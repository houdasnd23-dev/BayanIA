"""
Audit de la base sources_juridiques / importations_documents sur Railway.
Détecte les doublons issus des imports répétés du scraper SGG et donne
une vue d'ensemble de ce qui est réellement indexé.

Usage:
    export DATABASE_URL="postgresql://user:pass@host:port/dbname"
    pip install asyncpg tabulate --break-system-packages
    python3 scripts/audit_db.py
"""

import asyncio
import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL")


async def main():
    if not DATABASE_URL:
        print("❌ Variable d'environnement DATABASE_URL manquante.")
        print('   Exemple: export DATABASE_URL="postgresql://postgres:xxx@host.railway.app:5432/railway"')
        return

    # asyncpg n'accepte pas le préfixe +asyncpg utilisé par SQLAlchemy
    dsn = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(dsn)

    print("=" * 60)
    print("VUE D'ENSEMBLE")
    print("=" * 60)

    n_imports = await conn.fetchval("SELECT COUNT(*) FROM importations_documents")
    n_sources = await conn.fetchval("SELECT COUNT(*) FROM sources_juridiques")
    print(f"Nombre d'imports (importations_documents) : {n_imports}")
    print(f"Nombre total de chunks (sources_juridiques) : {n_sources}")

    print()
    print("Répartition par type_source :")
    rows = await conn.fetch(
        "SELECT type_source, COUNT(*) AS n FROM sources_juridiques GROUP BY type_source ORDER BY n DESC"
    )
    for r in rows:
        print(f"  {r['type_source']:<30} {r['n']}")

    print()
    print("=" * 60)
    print("DOUBLONS (même contenu_hash — devrait être impossible si l'import a bien dédupliqué)")
    print("=" * 60)
    dupes = await conn.fetch(
        """
        SELECT contenu_hash, COUNT(*) AS n
        FROM sources_juridiques
        WHERE contenu_hash IS NOT NULL
        GROUP BY contenu_hash
        HAVING COUNT(*) > 1
        ORDER BY n DESC
        LIMIT 20
        """
    )
    if dupes:
        print(f"⚠️  {len(dupes)} hash(s) en double trouvés (affichage des 20 premiers) :")
        for d in dupes:
            print(f"  hash={d['contenu_hash'][:12]}...  ×{d['n']}")
    else:
        print("✅ Aucun doublon exact de contenu_hash.")

    print()
    print("=" * 60)
    print("DOUBLONS PAR TITRE (même titre_document, contenu peut différer légèrement — souvent un re-scrape)")
    print("=" * 60)
    title_dupes = await conn.fetch(
        """
        SELECT titre_document, COUNT(*) AS n, COUNT(DISTINCT contenu_hash) AS n_hash_distincts
        FROM sources_juridiques
        GROUP BY titre_document
        HAVING COUNT(*) > 1
        ORDER BY n DESC
        LIMIT 20
        """
    )
    if title_dupes:
        print(f"⚠️  {len(title_dupes)} titre(s) en double trouvés (affichage des 20 premiers) :")
        for t in title_dupes:
            flag = " ← contenus DIFFÉRENTS malgré même titre" if t["n_hash_distincts"] > 1 else ""
            print(f"  {t['titre_document'][:60]:<60} ×{t['n']}{flag}")
    else:
        print("✅ Aucun titre en double.")

    print()
    print("=" * 60)
    print("CHUNKS SANS contenu_hash (pas passés par le script de dédup — risque de doublon futur)")
    print("=" * 60)
    n_no_hash = await conn.fetchval(
        "SELECT COUNT(*) FROM sources_juridiques WHERE contenu_hash IS NULL"
    )
    print(f"{n_no_hash} chunk(s) sans contenu_hash sur {n_sources} au total.")

    print()
    print("=" * 60)
    print("IMPORTS SANS AUCUN CHUNK RATTACHÉ (imports fantômes)")
    print("=" * 60)
    orphan_imports = await conn.fetch(
        """
        SELECT i.id_importation, i.date_importation, i.statut_indexation
        FROM importations_documents i
        LEFT JOIN sources_juridiques s ON s.id_importation = i.id_importation
        WHERE s.id_source IS NULL
        """
    )
    if orphan_imports:
        print(f"⚠️  {len(orphan_imports)} import(s) sans chunk associé :")
        for o in orphan_imports:
            print(f"  id={o['id_importation']} date={o['date_importation']} statut={o['statut_indexation']}")
    else:
        print(" Aucun import orphelin.")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())