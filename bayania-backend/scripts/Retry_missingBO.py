"""
Retente le téléchargement des BO manquants (listés dans failed.csv) en essayant
plusieurs conventions d'URL utilisées par le SGG à différentes époques.

Usage:
    python3 retry_missing_bo.py
"""

import os
import csv
import time
import requests
from urllib.parse import quote
from tqdm import tqdm

OUTPUT = "data/sgg_ar"
PDF_DIR = os.path.join(OUTPUT, "pdfs")
FAILED_IN = os.path.join(OUTPUT, "failed.csv")
STILL_FAILED_OUT = os.path.join(OUTPUT, "failed_v2.csv")

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; recherche-juridique/1.0)"}
DELAY = 1.0

os.makedirs(PDF_DIR, exist_ok=True)


def numero_variants(raw):
    raw = str(raw).strip()
    variants = {raw}
    if "-bis" in raw:
        variants.add(raw.replace("-bis", "bis"))
        variants.add(raw.replace("-bis", " bis"))
    if "-ter" in raw:
        variants.add(raw.replace("-ter", "ter"))
    return list(variants)


def candidate_urls(numero, year):
    """Génère les URLs à tester, dans l'ordre du plus probable au moins probable,
    en couvrant les 3 conventions connues du site + variantes de nommage."""
    urls = []
    for v in numero_variants(numero):
        v_space = v.replace("-", " ")  # "7454-bis" -> "7454 bis"

        # 1. Format récent (2019+) : dossier fixe 3111, underscore ou espace
        urls.append(f"https://www.sgg.gov.ma/BO/AR/3111/{year}/BO_{v}_Ar.pdf")
        urls.append(f"https://www.sgg.gov.ma/BO/AR/3111/{year}/{quote(f'BO {v_space}_Ar.pdf')}")

        # 2. Format intermédiaire (~2010-2018) : Portals/0
        urls.append(f"https://www.sgg.gov.ma/Portals/0/BO/{year}/BO_{v}_Ar.pdf")
        urls.append(f"https://www.sgg.gov.ma/Portals/0/BO/{year}/{quote(f'BO {v_space}_Ar.pdf')}")

        # 3. Format ancien (avant ~2010) : tout en minuscules
        urls.append(f"https://www.sgg.gov.ma/BO/bo_ar/{year}/bo_{v}_ar.pdf")
        urls.append(f"http://www.sgg.gov.ma/BO/bo_ar/{year}/bo_{v}_ar.pdf")

    return urls


def try_download(numero, year):
    for url in candidate_urls(numero, year):
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
        except requests.RequestException:
            continue

        if r.status_code == 200 and r.headers.get("content-type", "").startswith("application/pdf"):
            filename = f"BO_{numero}_Ar.pdf"
            path = os.path.join(PDF_DIR, filename)
            with open(path, "wb") as f:
                f.write(r.content)
            return True, url

        time.sleep(0.3)

    return False, None


def main():
    with open(FAILED_IN, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    still_failed = []
    recovered = 0

    for row in tqdm(rows, desc="Nouvelle tentative"):
        numero, date_str = row["numero"], row["date"]
        year = str(date_str)[:4]

        success, url_used = try_download(numero, year)

        if success:
            recovered += 1
            print(f"  Récupéré: {numero} ({year}) -> {url_used}")
        else:
            still_failed.append(row)

        time.sleep(DELAY)

    with open(STILL_FAILED_OUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["numero", "date"])
        writer.writeheader()
        writer.writerows(still_failed)

    print(f"\n--- Résumé ---")
    print(f"Récupérés : {recovered}")
    print(f"Toujours introuvables : {len(still_failed)} (voir {STILL_FAILED_OUT})")


if __name__ == "__main__":
    main()