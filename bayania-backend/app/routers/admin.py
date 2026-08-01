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
import tempfile
import os
import asyncio
from app.services.pdf_extraction import extract_text_docling
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
    if not file.filename.lower().endswith(".pdf"):
        raise InvalidRequestException("Seuls les fichiers PDF sont acceptés")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        loop = asyncio.get_running_loop()
        contenu_texte = await loop.run_in_executor(
              None, lambda: extract_text_docling(tmp_path, force_ocr=True)
            )
    finally:
        os.unlink(tmp_path)  # nettoyage systématique, même en cas d'erreur

    if not contenu_texte.strip():
        raise InvalidRequestException("Impossible d'extraire du texte de ce PDF")

    return await IngestionService.ingest_document(
        db=db, titre_document=titre_document, type_source=type_source, contenu_texte=contenu_texte
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
@router.delete(
    "/documents/{id_importation}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(["administrateur"]))]
)
async def delete_document(
    id_importation: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Supprime un document importé : ses chunks en base PostgreSQL
    (cascade automatique via la relation ImportationDocument.sources)
    et les vecteurs correspondants dans Qdrant.
    """
    stmt = (
        select(ImportationDocument)
        .options(selectinload(ImportationDocument.sources))
        .where(ImportationDocument.id_importation == id_importation)
    )
    result = await db.execute(stmt)
    importation = result.scalar_one_or_none()

    if not importation:
        raise NotFoundException("Document non trouvé")

    # Récupère les IDs des chunks pour les supprimer aussi de Qdrant
    source_ids = [s.id_source for s in importation.sources]

    if source_ids:
        await QdrantService.delete_points(source_ids)

    # Cascade="all, delete-orphan" sur la relation supprime aussi
    # automatiquement les lignes sources_juridiques associées
    await db.delete(importation)
    await db.commit()