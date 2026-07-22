import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.importation_document import ImportationDocument
from app.models.source_juridique import SourceJuridique
from app.models.question import Question
from app.models.reponse_ia import ReponseIA
from app.services.ingestion_service import IngestionService
from app.services.rag_service import RAGService
@pytest.mark.asyncio
@patch("app.services.embedding_service.EmbeddingService.get_embeddings")
@patch("app.services.qdrant_service.QdrantService.upsert_chunks")
async def test_document_ingestion_pipeline(
    mock_upsert,
    mock_embeddings,
    db_session: AsyncSession
):
    # Set up mocks
    mock_embeddings.return_value = [[0.1] * 384, [0.2] * 384]
    mock_upsert.return_value = True
    
    # Run ingestion
    doc_title = "Constitution du 29 juillet 2011"
    doc_type = "Constitution"
    doc_content = "Article premier : Le Maroc est une monarchie constitutionnelle.\nArticle 2 : La souveraineté appartient à la Nation."
    
    importation = await IngestionService.ingest_document(
        db=db_session,
        titre_document=doc_title,
        type_source=doc_type,
        contenu_texte=doc_content
    )
    
    assert importation.statut_indexation == "COMPLETED"
    
    # Verify records exist in PostgreSQL
    stmt_import = select(ImportationDocument).where(ImportationDocument.id_importation == importation.id_importation)
    res_import = await db_session.execute(stmt_import)
    assert res_import.scalar_one_or_none() is not None
     stmt_sources = select(SourceJuridique).where(SourceJuridique.id_importation == importation.id_importation)
    res_sources = await db_session.execute(stmt_sources)
    sources = list(res_sources.scalars().all())
    
    assert len(sources) == 2
    assert sources[0].numero_article == "Article premier"
    assert "monarchie constitutionnelle" in sources[0].contenu_texte
    assert sources[1].numero_article == "Article 2"
    assert "La souveraineté" in sources[1].contenu_texte
    
    # Assert Qdrant upsert was called with the correct data
    assert mock_upsert.called
    assert mock_embeddings.called
@pytest.mark.asyncio
@patch("app.services.embedding_service.EmbeddingService.get_embedding")
@patch("app.services.qdrant_service.QdrantService.search_similar")
@patch("app.services.llm_service.LLMService.generate_response")
async def test_rag_query_flow(
    mock_llm,
    mock_search,
    mock_embed,
    db_session: AsyncSession
):
    # Prepare mock DB source
    importation = ImportationDocument(statut_indexation="COMPLETED")
    db_session.add(importation)
    await db_session.commit()
    await db_session.refresh(importation)
    
    source = SourceJuridique(
        type_source="Constitution",
        titre_document="Constitution 2011",
        contenu_texte="Article premier: Le Maroc est une monarchie constitutionnelle.",
        numero_article="Article premier",
        statut_validite=True,
        id_importation=importation.id_importation
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
     source = SourceJuridique(
        type_source="Constitution",
        titre_document="Constitution 2011",
        contenu_texte="Article premier: Le Maroc est une monarchie constitutionnelle.",
        numero_article="Article premier",
        statut_validite=True,
        id_importation=importation.id_importation
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    
    # Set up service mocks
    mock_embed.return_value = [0.1] * 384
    
    mock_search.return_value = [{
        "id_source": source.id_source,
        "titre_document": source.titre_document,
        "numero_article": source.numero_article,
        "contenu_texte": source.contenu_texte,
        "type_source": source.type_source,
        "score": 0.95
    }]
    
    mock_llm.return_value = "Conformément à la Constitution, le Maroc est une monarchie constitutionnelle."
    
    # Execute RAG flow
    question_text = "Quel est le régime politique du Maroc ?"
    response_text, cited_sources, confidence = await RAGService.process_question(
        db=db_session,
        anonymized_question=question_text
    )
    
    assert "monarchie constitutionnelle" in response_text
    assert len(cited_sources) == 1
    assert cited_sources[0].id_source == source.id_source
    assert confidence > 0.8  # Expect high confidence
    
    assert mock_embed.called
    assert mock_search.called
    assert mock_llm.called