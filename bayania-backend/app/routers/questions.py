from fastapi import APIRouter, Depends, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundException, AuthorizationException, InvalidRequestException
from app.models.user import User
from app.models.question import Question
from app.models.donnee_sensible import DonneeSensible
from app.models.piece_jointe import PieceJointe
from app.models.reponse_ia import ReponseIA
from app.schemas.question import QuestionCreate, QuestionResponse, PieceJointeResponse
from app.schemas.reponse import ReponseIAResponse
from app.services.anonymisation_service import AnonymisationService
from app.services.rag_service import RAGService
from app.utils.file_storage import FileStorage
router = APIRouter(prefix="/questions", tags=["Questions"])
@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    question_in: QuestionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Poses a question:
    1. Detects and anonymizes sensitive data.
     2. Saves the Question and its sensitive data mappings.
    3. Runs RAG + LLM to generate the answer.
    4. Saves the generated ReponseIA with cited sources and confidence score.
    """
    # 1. Anonymisation
    anonymized_text, sensitive_mappings = AnonymisationService.anonymise(
        question_in.texte_question_brute
    )
    
    # 2. Save Question
    db_question = Question(
        texte_question_brute=question_in.texte_question_brute,
        texte_question_anonymise=anonymized_text,
        mode_reponse=question_in.mode_reponse,
        id_user=current_user.id_user
    )
    db.add(db_question)
    await db.flush() # flush to get id_question
    
    # Save sensitive data mappings
    for mapping in sensitive_mappings:
        ds = DonneeSensible(
            type_donnee=mapping["type_donnee"],
            valeur_detectee=mapping["valeur_detectee"],
            valeur_anonymisee=mapping["valeur_anonymisee"],
            id_question=db_question.id_question
        )
        db.add(ds)
        
    await db.commit()
    
    # 3. Run RAG Pipeline
    response_text, cited_sources, confidence_score = await RAGService.process_question(
        db, anonymized_text
    )
    
    # 4. Save Response
    db_response = ReponseIA(
        texte_reponse=response_text,
        score_confiance=confidence_score,
        id_question=db_question.id_question,
        sources=cited_sources # Assign many-to-many relationship
    )
    db.add(db_response)
    await db.commit()
    
    # Eager load relationships for return serialization
    stmt = (
        select(Question)
        .where(Question.id_question == db_question.id_question)
        .options(
            selectinload(Question.donnees_sensibles),
            selectinload(Question.pieces_jointes)
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one()
@router.get("/{id}/reponse", response_model=ReponseIAResponse)
async def get_question_reponse(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the generated response for a specific question, including cited sources.
    """
    # First, verify question exists and check authorization
    stmt_q = select(Question).where(Question.id_question == id)
    result_q = await db.execute(stmt_q)
    question = result_q.scalar_one_or_none()
    
    if not question:
        raise NotFoundException("Question not found")
        
    # Check permissions: owner, pro, or admin
    user_role = current_user.profil.type_profil
    if question.id_user != current_user.id_user and user_role not in ["professionnel", "administrateur"]:
        raise AuthorizationException("You are not authorized to view this response")
        
    # Load response with sources
    stmt_r = (
        select(ReponseIA)
        .where(ReponseIA.id_question == id)
        .options(selectinload(ReponseIA.sources))
    )
    result_r = await db.execute(stmt_r)
    reponse = result_r.scalar_one_or_none()
    
    if not reponse:
        raise NotFoundException("Response not yet generated or not found")
        
    return reponse
@router.post("/{id}/pieces-jointes", response_model=PieceJointeResponse, status_code=status.HTTP_201_CREATED)
async def upload_piece_jointe(
    id: int,
    file: UploadFile = File(...),
      current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads a piece jointe (attachment) for a specific question.
    """
    stmt = select(Question).where(Question.id_question == id)
    result = await db.execute(stmt)
    question = result.scalar_one_or_none()
    
    if not question:
        raise NotFoundException("Question not found")
        
    if question.id_user != current_user.id_user and current_user.profil.type_profil != "administrateur":
        raise AuthorizationException("You are not authorized to attach files to this question")
        
    # Read file content length
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    # Save file to disk
    chemin_fichier = FileStorage.save_file(file)
    
    # Save metadata to DB
    db_piece = PieceJointe(
        nom_fichier=file.filename,
        taille_fichier=file_size,
        chemin_fichier=chemin_fichier,
        id_question=question.id_question
    )
    db.add(db_piece)
   

    await db.commit()
    await db.refresh(db_piece)
    return db_piece

@router.get("", response_model=List[QuestionResponse])
async def list_questions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns all questions asked by the current user, most recent first.
    """
    stmt = (
        select(Question)
        .where(Question.id_user == current_user.id_user)
        .options(
            selectinload(Question.donnees_sensibles),
            selectinload(Question.pieces_jointes)
        )
        .order_by(Question.date_heure_envoi.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
