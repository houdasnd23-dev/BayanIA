import tempfile
import os

from fastapi import APIRouter, Depends, File, UploadFile, Form, status
import asyncio
from app.core.dependencies import get_current_user
from app.models.user import User
from app.core.exceptions import InvalidRequestException
from app.schemas.document_analyse import AnalyseDocumentResponse
from app.services.pdf_extraction import extract_text_docling
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.services.llm_service import LLMService

router = APIRouter(prefix="/documents", tags=["Analyse de Documents"])


@router.post("/analyse-pdf", response_model=AnalyseDocumentResponse, status_code=status.HTTP_200_OK)
async def analyse_pdf(
    file: UploadFile = File(...),
    instructions: str = Form(""),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise InvalidRequestException("Seuls les fichiers PDF sont acceptés")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        loop = asyncio.get_running_loop()
        document_text = await loop.run_in_executor(
               None, lambda: extract_text_docling(tmp_path, force_ocr=False)
                 )
    finally:
        os.unlink(tmp_path)

    if not document_text.strip():
        raise InvalidRequestException("Impossible d'extraire du texte de ce PDF")

    query_vector = await EmbeddingService.get_embedding(document_text[:1000])
    context_chunks = await QdrantService.search_similar(query_vector, top_k=5)

    return await LLMService.analyze_document(
        document_text=document_text,
        instructions_utilisateur=instructions,
        context_chunks=context_chunks,
    )