"""
Extrait le texte de tous les PDF téléchargés et produit un JSON structuré
par Bulletin Officiel (un fichier JSON par PDF + un fichier global).

Usage:
    pip install pymupdf tqdm --break-system-packages
    python3 extract_text.py
"""

import os
import re
import json
import fitz  # pymupdf
from tqdm import tqdm

PDF_DIR = "data/sgg_ar/pdfs"
OUT_DIR = "data/sgg_ar/extracted"
GLOBAL_JSON = "data/sgg_ar/all_bo_text.jsonl"  # jsonl = 1 ligne par BO, pratique pour import en masse

os.makedirs(OUT_DIR, exist_ok=True)


def extract_numero(filename):
    """BO_7480_Ar.pdf -> '7480' ; BO_7522bis_Ar.pdf -> '7522bis'"""
    m = re.match(r"BO_(.+?)_[Aa]r\.pdf", filename)
    return m.group(1) if m else filename


def extract_pdf(path):
    doc = fitz.open(path)
    pages = []
    for page in doc:
        text = page.get_text("text")
        pages.append(text)
    doc.close()
    full_text = "\n".join(pages)
    return full_text, len(pages)


def main():
    files = sorted(f for f in os.listdir(PDF_DIR) if f.lower().endswith(".pdf"))

    with open(GLOBAL_JSON, "w", encoding="utf-8") as global_f:
        for filename in tqdm(files, desc="Extraction texte"):
            path = os.path.join(PDF_DIR, filename)
            numero = extract_numero(filename)

            try:
                full_text, n_pages = extract_pdf(path)
            except Exception as e:
                print(f"Erreur sur {filename}: {e}")
                continue

            record = {
                "numero_bo": numero,
                "filename": filename,
                "n_pages": n_pages,
                "lang": "ar",
                "text": full_text,
            }

            # un fichier individuel (pratique pour debug / relecture)
            with open(os.path.join(OUT_DIR, f"{numero}.json"), "w", encoding="utf-8") as f:
                json.dump(record, f, ensure_ascii=False, indent=2)

            # une ligne dans le fichier global (pour import DB en masse)
            global_f.write(json.dumps(record, ensure_ascii=False) + "\n")

    print(f"Terminé. Résultat global : {GLOBAL_JSON}")


if __name__ == "__main__":
    main()