import asyncio
import asyncpg

LOCAL_URL = "postgresql://postgres:temp123@localhost:5433/postgres"

async def main():
    conn = await asyncpg.connect(LOCAL_URL)
    rows = await conn.fetch("SELECT * FROM importations_documents LIMIT 5")
    print("Local importations_documents rows:")
    for r in rows:
        print(dict(r))
    await conn.close()

asyncio.run(main())
