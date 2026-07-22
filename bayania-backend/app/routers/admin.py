from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.user import User
from app.schemas.user import UserResponse
from app.schemas.source import ImportationDocumentResponse
from app.schemas.document import DocumentImportRequest
from app.services.ingestion_service import IngestionService
from fastapi import APIRouter, Depends, status, File, UploadFile, Form
from pypdf import PdfReader
from app.models.importation_document import ImportationDocument
from app.schemas.source import ImportationDocumentDetailResponse
from app.core.exceptions import InvalidRequestException
router = APIRouter(prefix="/admin", tags=["Admin Panel"])

@router.post(
    "/documents",
    response_model=ImportationDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["administrateur"]))]
)
async def import_document(
    doc_in: DocumentImportRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Imports, chunks, vectorizes, and indexes a legal document.
    Access restricted to administrators.
    """
    return await IngestionService.ingest_document(
        db=db,
        titre_document=doc_in.titre_document,
        type_source=doc_in.type_source,
        contenu_texte=doc_in.contenu_texte
    )
@router.get(
    "/utilisateurs",
    response_model=List[UserResponse],
    dependencies=[Depends(require_role(["administrateur"]))]
)
async def list_users(
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the list of all registered users.
    Access restricted to administrators.
    """
    stmt = select(User).options(selectinload(User.profil))
    result = await db.execute(stmt)
    return list(result.scalars().all())
@router.post(
    "/documents/upload",
    response_model=ImportationDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["administrateur"]))]
)
async def upload_document(
    titre_document: str = Form(...),
    type_source: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads a PDF file, extracts its text, then ingests it
    (chunking, embedding, indexing in Qdrant).
    """
    if not file.filename.lower().endswith(".pdf"):
        raise InvalidRequestException("Seuls les fichiers PDF sont acceptés")

    reader = PdfReader(file.file)
    contenu_texte = ""
    for page in reader.pages:
        contenu_texte += (page.extract_text() or "") + "\n"

    if not contenu_texte.strip():
        raise InvalidRequestException("Impossible d'extraire du texte de ce PDF")

    return await IngestionService.ingest_document(
        db=db,
        titre_document=titre_document,
        type_source=type_source,
        contenu_texte=contenu_texte
    )   
@router.get(
    "/documents",
    response_model=List[ImportationDocumentDetailResponse],
    dependencies=[Depends(require_role(["administrateur"]))]
)
async def list_documents(
    db: AsyncSession = Depends(get_db)
):
    """
    Returns all imported documents with their indexation status,
    most recent first.
    """
    stmt = (
        select(ImportationDocument)
        .options(selectinload(ImportationDocument.sources))
        .order_by(ImportationDocument.date_importation.desc())
    )
    result = await db.execute(stmt)
    importations = result.scalars().all()

    response = []
    for imp in importations:
        first_source = imp.sources[0] if imp.sources else None
        response.append(
            ImportationDocumentDetailResponse(
                id_importation=imp.id_importation,
                date_importation=imp.date_importation,
                statut_indexation=imp.statut_indexation,
                titre_document=first_source.titre_document if first_source else "Document sans titre",
                type_source=first_source.type_source if first_source else "Inconnu",
                nb_chunks=len(imp.sources),
            )
        )
    return response   