"""
Importe all_bo_text.jsonl directement dans le schéma réel de BayanIA :
    importations_documents  -> une ligne par import
    sources_juridiques      -> le contenu, lié par id_importation

Usage:
    pip install psycopg2-binary tqdm --break-system-packages
    python3 import_bayania.py
"""

import os
import json
import csv
import hashlib
import psycopg2
from tqdm import tqdm

JSONL_PATH = "data/sgg_ar/all_bo_text_merged.jsonl"  # <-- fusionné avec les résultats OCR disponibles

DB_CONFIG = {
    "host": os.environ.get("PGHOST", "localhost"),
    "port": os.environ.get("PGPORT", "5432"),
    "dbname": os.environ.get("PGDATABASE", "bayania"),
    "user": os.environ.get("PGUSER", "postgres"),
    "password": os.environ.get("PGPASSWORD", "postgres"),
}

TYPE_SOURCE = "bulletin_officiel"

CHUNK_SIZE = 3000       # caractères par chunk (plus grand qu'un chunk d'embedding,
                         # car ici c'est pour la lecture/citation, pas le vecteur)
CHUNK_OVERLAP = 300


def content_hash(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sanitize_text(text):
    """Retire les caractères NUL et autres caractères de contrôle invalides
    que PostgreSQL refuse dans un champ texte (fréquent avec les vieux PDF scannés)."""
    if text is None:
        return ""
    return text.replace("\x00", "").replace("\ufffd", "")


def already_imported(cur, h):
    cur.execute("SELECT 1 FROM sources_juridiques WHERE contenu_hash = %s LIMIT 1", (h,))
    return cur.fetchone() is not None


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    chunks = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + chunk_size, length)
        if end < length:
            newline_pos = text.rfind("\n", start, end)
            if newline_pos > start:
                end = newline_pos
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - overlap if end - overlap > start else end
    return chunks


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    with open(JSONL_PATH, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f]

    inserted, skipped, errors = 0, 0, 0
    error_log = []

    for record in tqdm(records, desc="Import BayanIA"):
        numero = record["numero_bo"]
        texte_complet = sanitize_text(record["text"])
        h = content_hash(texte_complet)

        if already_imported(cur, h):
            skipped += 1
            continue

        # si l'extraction n'a produit aucun texte exploitable (PDF scanné sans OCR,
        # ou fichier corrompu), on ne crée AUCUNE ligne -> pas de "Document sans titre"
        chunks_preview = chunk_text(texte_complet)
        if not texte_complet.strip() or not chunks_preview:
            errors += 1
            error_log.append({"numero": numero, "erreur": "texte vide après extraction (probable scan sans OCR)"})
            continue

        try:
            # 1. créer la ligne d'import (une seule par document, même s'il est ensuite découpé)
            cur.execute(
                """
                INSERT INTO importations_documents (statut_indexation)
                VALUES (%s)
                RETURNING id_importation
                """,
                ("complete",),
            )
            id_importation = cur.fetchone()[0]

            # 2. insérer un chunk par ligne (déjà calculés ci-dessus)
            chunks = chunks_preview
            n_chunks = len(chunks)

            for i, chunk in enumerate(chunks, start=1):
                titre = f"Bulletin Officiel n° {numero} (partie {i}/{n_chunks})"
                chunk_hash = h if i == 1 else hashlib.sha256(f"{h}-{i}".encode()).hexdigest()

                cur.execute(
                    """
                    INSERT INTO sources_juridiques
                        (type_source, titre_document, contenu_texte, numero_article,
                         statut_validite, id_importation, contenu_hash)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (TYPE_SOURCE, titre, chunk, numero, True, id_importation, chunk_hash),
                )

            inserted += 1
            conn.commit()  # commit document par document : si ça coupe, rien n'est perdu ni corrompu

        except Exception as e:
            conn.rollback()  # annule la transaction en cours, sinon la connexion reste bloquée
            errors += 1
            error_log.append({"numero": numero, "erreur": str(e)})
            print(f"\n  Erreur sur {numero}, ignoré: {e}")

    cur.close()
    conn.close()

    if error_log:
        with open("data/sgg_ar/import_errors.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["numero", "erreur"])
            writer.writeheader()
            writer.writerows(error_log)

    print(f"\n{inserted} bulletins importés, {skipped} déjà présents (ignorés), {errors} en erreur (voir data/sgg_ar/import_errors.csv).")


if __name__ == "__main__":
    main()