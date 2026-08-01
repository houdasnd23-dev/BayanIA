#gere importation des docs
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.models.importation_document import ImportationDocument
from app.models.source_juridique import SourceJuridique
from app.utils.chunking import chunk_legal_text
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
logger = logging.getLogger(__name__)
class IngestionService:
    @staticmethod
    async def ingest_document(
        db: AsyncSession,
        titre_document: str,
        type_source: str,
        contenu_texte: str
    ) -> ImportationDocument:
        """
        Ingests a document: chunks it, stores chunks in Postgres,
        embeds chunks, and indexes them in Qdrant.
        """
        # 1. Create Importation record
        importation = ImportationDocument(statut_indexation="PENDING")
        db.add(importation)
        await db.commit()
        await db.refresh(importation)
        
        try:
            # 2. Chunk text
            chunks = chunk_legal_text(contenu_texte)
            if not chunks:
                raise ValueError("No chunks extracted from the document")
            # 3. Save chunks as SourceJuridique records in database
            db_sources = []
            for chunk in chunks:
                source = SourceJuridique(
                    type_source=type_source,
                    titre_document=titre_document,
                    contenu_texte=chunk["contenu_texte"],
                    numero_article=chunk["numero_article"],
                    statut_validite=True,
                    id_importation=importation.id_importation
                )
                db.add(source)
                db_sources.append(source)
                
            # Flush to database to obtain id_source values
            await db.commit()
            for source in db_sources:
                await db.refresh(source)
                
            # 4. Generate embeddings for all chunks
            # 4. Generate embeddings for all chunks
# On enrichit le texte UNIQUEMENT pour l'embedding (meilleur signal sémantique
# sur les articles courts) — le texte affiché/stocké (contenu_texte) reste inchangé.
            texts_to_embed = [f"{s.titre_document} — Article {s.numero_article} : {s.contenu_texte}"
               for s in db_sources]
            embeddings = await EmbeddingService.get_embeddings(texts_to_embed)
            
            # 5. Format and upsert points in Qdrant
            qdrant_points = []
            for source, embedding in zip(db_sources, embeddings):
                qdrant_points.append({
                    "id": source.id_source, # Use database integer ID directly
                    "vector": embedding,
                    "payload": {
                        "id_source": source.id_source,
                        "type_source": source.type_source,
                        "titre_document": source.titre_document,
                        "numero_article": source.numero_article,
                        "contenu_texte": source.contenu_texte,
                        "statut_validite": source.statut_validite 
                    }
                })
                # Upsert into Qdrant
            success = await QdrantService.upsert_chunks(qdrant_points)
            if not success:
                raise RuntimeError("Failed to upsert vectors into Qdrant")
                
            # 6. Update Importation status
            importation.statut_indexation = "COMPLETED"
            await db.commit()
            await db.refresh(importation)
            
        except Exception as e:
            logger.error(f"Error during document ingestion: {str(e)}")
            importation.statut_indexation = "FAILED"
            await db.commit()
            await db.refresh(importation)
            raise e
            
        return importation
