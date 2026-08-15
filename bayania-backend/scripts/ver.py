"""
Pour chaque titre en double, vérifie si le CONTENU (contenu_texte) est
réellement identique (= vrai doublon à supprimer) ou différent
(= chunks légitimes d'un même document long, juste avec le même titre).

Usage:
    $env:DATABASE_URL = "postgresql://..."
    python3 scripts/audit_db_content.py
"""

import asyncio
import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL")


async def main():
    if not DATABASE_URL:
        print("❌ DATABASE_URL manquante.")
        return

    dsn = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(dsn)

    print("Analyse des titres en double (hors 'code de travail en ar', déjà identifié comme légitime)...\n")

    title_dupes = await conn.fetch(
        """
        SELECT titre_document, COUNT(*) AS n
        FROM sources_juridiques
        WHERE titre_document != 'code de travail en ar'
        GROUP BY titre_document
        HAVING COUNT(*) > 1
        ORDER BY n DESC
        LIMIT 30
        """
    )

    total_vrais_doublons = 0
    total_chunks_legitimes = 0

    for t in title_dupes:
        titre = t["titre_document"]
        n = t["n"]

        rows = await conn.fetch(
            "SELECT id_source, contenu_texte, id_importation FROM sources_juridiques WHERE titre_document = $1",
            titre,
        )
        contenus_distincts = set(r["contenu_texte"] for r in rows)
        n_distinct = len(contenus_distincts)
        n_imports_distincts = len(set(r["id_importation"] for r in rows))

        if n_distinct == 1:
            # tout le monde a EXACTEMENT le même texte -> vrai doublon
            statut = f"🔴 VRAI DOUBLON — {n} lignes, contenu identique, {n_imports_distincts} import(s) distinct(s)"
            total_vrais_doublons += (n - 1)  # n-1 lignes à supprimer, on garde une copie
        elif n_distinct == n:
            statut = f"✅ chunks légitimes — {n} lignes, {n} contenus tous différents (un seul long document)"
            total_chunks_legitimes += n
        else:
            statut = f"🟠 MIXTE — {n} lignes mais seulement {n_distinct} contenus distincts (mélange de vrais doublons et de chunks)"
            total_vrais_doublons += (n - n_distinct)

        print(f"{titre[:70]:<70} {statut}")

    print()
    print("=" * 60)
    print(f"Estimation lignes à supprimer si nettoyage (vrais doublons) : {total_vrais_doublons}")
    print(f"Lignes légitimes (chunks d'un même document, à garder)      : {total_chunks_legitimes}")
    print("=" * 60)

    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())