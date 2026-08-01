"""
Télécharge tous les Bulletins Officiels (édition arabe générale) listés
dans Bulletins_Officiels.xlsx, en respectant un délai raisonnable entre
les requêtes (site gouvernemental public).

Usage:
    pip install openpyxl requests tqdm --break-system-packages
    python3 sgg_bulk_downloader.py
"""

import os
import re
import csv
import time
import requests
import openpyxl
from tqdm import tqdm

EXCEL_PATH = "Bulletins_Officiels.xlsx"   # mets le chemin exact si besoin
OUTPUT = "data/sgg_ar"
PDF_DIR = os.path.join(OUTPUT, "pdfs")
FAILED_LOG = os.path.join(OUTPUT, "failed.csv")
FOLDER_ID = 3111       # dossier fixe pour l'édition arabe générale
LANG = "AR"
DELAY = 1.2            # secondes entre requêtes -> reste poli avec le serveur

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; recherche-juridique/1.0)"}

os.makedirs(PDF_DIR, exist_ok=True)


def clean_numero(raw):
    """'7522-bis' -> variantes possibles de nom de fichier à tester."""
    raw = str(raw).strip()
    variants = [raw]
    if "-bis" in raw:
        variants.append(raw.replace("-bis", "bis"))
        variants.append(raw.replace("-bis", ""))
    if "-ter" in raw:
        variants.append(raw.replace("-ter", "ter"))
    return variants


def build_urls(numero_variants, year):
    urls = []
    for v in numero_variants:
        # deux casses courantes observées : _Ar.pdf et _ar.pdf
        urls.append(f"https://www.sgg.gov.ma/BO/{LANG}/{FOLDER_ID}/{year}/BO_{v}_Ar.pdf")
        urls.append(f"https://www.sgg.gov.ma/BO/{LANG}/{FOLDER_ID}/{year}/BO_{v}_ar.pdf")
    return urls


def download(numero, date_str):
    year = date_str.split("-")[0]
    variants = clean_numero(numero)

    for url in build_urls(variants, year):
        filename = url.split("/")[-1]
        path = os.path.join(PDF_DIR, filename)

        if os.path.exists(path):
            return "exists", filename

        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
        except requests.RequestException as e:
            continue

        if r.status_code == 200 and r.headers.get("content-type", "").startswith("application/pdf"):
            with open(path, "wb") as f:
                f.write(r.content)
            return "downloaded", filename

    return "not_found", None


def main():
    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))[2:]  # skip titre + en-têtes

    failed = []
    stats = {"downloaded": 0, "exists": 0, "not_found": 0}

    for row in tqdm(rows, desc="Téléchargement BO"):
        numero, date_str = row[0], row[1]
        if numero is None or date_str is None:
            continue
        date_str = str(date_str)[:10]  # au cas où c'est un datetime

        status, filename = download(numero, date_str)
        stats[status] += 1

        if status == "not_found":
            failed.append({"numero": numero, "date": date_str})

        time.sleep(DELAY)

    with open(FAILED_LOG, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["numero", "date"])
        writer.writeheader()
        writer.writerows(failed)

    print("\n--- Résumé ---")
    print(stats)
    print(f"Échecs loggés dans : {FAILED_LOG}")


if __name__ == "__main__":
    main()