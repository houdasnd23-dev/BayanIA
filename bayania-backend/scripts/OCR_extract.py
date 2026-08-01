"""
Applique l'OCR (Tesseract, arabe) aux PDF dont l'extraction PyMuPDF a échoué
(texte quasi vide -> probablement un scan image).

IMPORTANT : lance d'abord en mode TEST (quelques documents) pour vérifier
la qualité de l'OCR et estimer le temps réel avant de lancer sur tout le corpus.

Usage:
    pip install pytesseract pillow pymupdf --break-system-packages
    python3 ocr_extract.py
"""

import os
import json
import time
import multiprocessing as mp
from functools import partial
import fitz  # pymupdf
import pytesseract
from PIL import Image
from tqdm import tqdm

# Si tesseract.exe n'est pas dans le PATH, décommente et adapte cette ligne :
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

PDF_DIR = "data/sgg_ar/pdfs"
JSONL_PATH = "data/sgg_ar/all_bo_text.jsonl"
OCR_OUTPUT_DIR = "data/sgg_ar/extracted_ocr"
OCR_JSONL = "data/sgg_ar/all_bo_text_ocr.jsonl"

MIN_TEXT_LENGTH = 50
ZOOM = 2.5
LANG = "ara"

TEST_MODE = False      # <-- passe en False pour traiter tout le corpus
TEST_LIMIT = 3

# nombre de documents traités EN MÊME TEMPS -> ajuste selon ton CPU
# (laisse 1 coeur de libre pour que Windows reste réactif)
N_WORKERS = max(1, mp.cpu_count() - 1)

os.makedirs(OCR_OUTPUT_DIR, exist_ok=True)


def needs_ocr(record):
    return len(record["text"].strip()) < MIN_TEXT_LENGTH


def ocr_pdf(path):
    doc = fitz.open(path)
    page_texts = []
    for page in doc:
        pix = page.get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        text = pytesseract.image_to_string(img, lang=LANG)
        page_texts.append(text)
    doc.close()
    return "\n".join(page_texts), len(page_texts)


def process_one(record):
    """Traite un seul document -> exécuté dans un processus séparé (parallélisme)."""
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    pdf_path = os.path.join(PDF_DIR, record["filename"])
    if not os.path.exists(pdf_path):
        return {"status": "missing", "numero_bo": record["numero_bo"]}

    try:
        text, n_pages = ocr_pdf(pdf_path)
    except Exception as e:
        return {"status": "error", "numero_bo": record["numero_bo"], "error": str(e)}

    new_record = dict(record)
    new_record["text"] = text
    new_record["n_pages"] = n_pages
    new_record["ocr"] = True

    with open(os.path.join(OCR_OUTPUT_DIR, f"{record['numero_bo']}.json"), "w", encoding="utf-8") as f:
        json.dump(new_record, f, ensure_ascii=False, indent=2)

    return {"status": "ok", "record": new_record}


def main():
    with open(JSONL_PATH, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f]

    to_process = [r for r in records if needs_ocr(r)]
    print(f"{len(to_process)} documents nécessitent l'OCR.")

    if TEST_MODE:
        to_process = to_process[:TEST_LIMIT]
        print(f"MODE TEST : traitement de seulement {len(to_process)} document(s).")

    print(f"Parallélisation sur {N_WORKERS} coeurs.")

    results = []
    errors = []

    with mp.Pool(N_WORKERS) as pool:
        for res in tqdm(pool.imap_unordered(process_one, to_process), total=len(to_process), desc="OCR en cours"):
            if res["status"] == "ok":
                results.append(res["record"])
            else:
                errors.append(res)

    with open(OCR_JSONL, "w", encoding="utf-8") as f:
        for r in results:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    if errors:
        with open("data/sgg_ar/ocr_errors.json", "w", encoding="utf-8") as f:
            json.dump(errors, f, ensure_ascii=False, indent=2)

    print(f"\nTerminé. {len(results)} documents OCRisés, {len(errors)} erreurs.")
    print(f"Résultat : {OCR_JSONL}")
    if TEST_MODE:
        print("\n>>> Vérifie la qualité du texte extrait ci-dessus/dans les fichiers JSON.")
        print(">>> Si c'est bon, mets TEST_MODE = False et relance pour traiter tout le corpus.")


if __name__ == "__main__":
    main()