"""
Filtre all_bo_text.jsonl pour ne garder que les N documents les plus récents
(basé sur les dates du fichier Excel d'origine).

Usage:
    python3 filter_top_recent.py
"""

import json
import openpyxl

EXCEL_PATH = "Bulletins_Officiels.xlsx"
JSONL_IN = "data/sgg_ar/all_bo_text.jsonl"
JSONL_OUT = "data/sgg_ar/all_bo_text_top2500.jsonl"

N_KEEP = 2500


def main():
    # 1. charger la correspondance numero -> date depuis l'Excel
    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))[2:]

    date_by_numero = {}
    for row in rows:
        numero, date_str = row[0], row[1]
        if numero is not None and date_str is not None:
            date_by_numero[str(numero).strip()] = str(date_str)[:10]

    # 2. charger tous les documents déjà extraits
    with open(JSONL_IN, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f]

    # 3. associer une date à chaque document, trier du plus récent au plus ancien
    for r in records:
        r["_date"] = date_by_numero.get(str(r["numero_bo"]).strip(), "0000-00-00")

    records.sort(key=lambda r: r["_date"], reverse=True)

    kept = records[:N_KEEP]
    for r in kept:
        del r["_date"]

    print(f"{len(records)} documents au total, on garde les {len(kept)} plus récents.")
    print(f"Le plus récent gardé : {records[0]['numero_bo']} ({date_by_numero.get(str(records[0]['numero_bo']), '?')})")
    print(f"Le plus ancien gardé : {kept[-1]['numero_bo']} ({date_by_numero.get(str(kept[-1]['numero_bo']), '?')})")

    with open(JSONL_OUT, "w", encoding="utf-8") as f:
        for r in kept:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"\nÉcrit : {JSONL_OUT}")


if __name__ == "__main__":
    main()