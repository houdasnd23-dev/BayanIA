import asyncio
import asyncpg
import os

DATABASE_URL = os.getenv("RAILWAY_URL")

async def main():
    conn = await asyncpg.connect(RAILWAY_URL)
    
    # Check count in importations_documents
    count_importations = await conn.fetchval("SELECT COUNT(*) FROM importations_documents")
    print(f"Number of rows in importations_documents: {count_importations}")
    
    # Check total chunks in sources_juridiques on Railway
    chunks_count = await conn.fetchval("SELECT COUNT(*) FROM sources_juridiques")
    print(f"Total chunks in sources_juridiques on Railway: {chunks_count}")
    
    await conn.close()

asyncio.run(main())
