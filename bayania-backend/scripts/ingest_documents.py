import argparse
import asyncio
import os
import sys
# Add project root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.database import AsyncSessionLocal
from app.services.ingestion_service import IngestionService
async def main(title: str, source_type: str, file_path: str):
    # Verify file existence
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        sys.exit(1)
        
    print(f"Reading document content from: {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    print(f"Starting ingestion for '{title}' ({source_type})...")
    
    async with AsyncSessionLocal() as session:
        try:
            importation = await IngestionService.ingest_document(
                db=session,
                titre_document=title,
                type_source=source_type,
                contenu_texte=content
            )
            print("--------------------------------------------------")
            print("INGESTION SUCCESSFUL!")
            print(f"Importation ID  : {importation.id_importation}")
            print(f"Date            : {importation.date_importation}")
            print(f"Status          : {importation.statut_indexation}")
            print("--------------------------------------------------")
        except Exception as e:
            print(f"Error during ingestion: {str(e)}")
            sys.exit(1)
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest legal documents into BayanIA RAG backend.")
    parser.add_argument("--title", required=True, help="Title of the document")
    parser.add_argument("--type", required=True, help="Type of legal document (e.g., Loi, Décret)")