"""
Fusionne all_bo_text.jsonl avec les résultats OCR déjà produits dans extracted_ocr/.
Pour chaque document : utilise le texte OCR s'il existe, sinon garde le texte original.

Peut être relancé plusieurs fois pendant que l'OCR continue en tâche de fond --
récupère chaque fois les nouveaux résultats disponibles.

Usage:
    python3 merge_ocr_results.py
"""

import os
import json

JSONL_IN = "data/sgg_ar/all_bo_text.jsonl"
OCR_DIR = "data/sgg_ar/extracted_ocr"
JSONL_OUT = "data/sgg_ar/all_bo_text_merged.jsonl"


def main():
    with open(JSONL_IN, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f]

    merged, from_ocr, from_original = 0, 0, 0

    with open(JSONL_OUT, "w", encoding="utf-8") as out:
        for record in records:
            ocr_path = os.path.join(OCR_DIR, f"{record['numero_bo']}.json")

            if os.path.exists(ocr_path):
                with open(ocr_path, "r", encoding="utf-8") as f:
                    ocr_record = json.load(f)
                record["text"] = ocr_record["text"]
                record["n_pages"] = ocr_record.get("n_pages", record.get("n_pages"))
                record["ocr"] = True
                from_ocr += 1
            else:
                from_original += 1

            out.write(json.dumps(record, ensure_ascii=False) + "\n")
            merged += 1

    print(f"{merged} documents fusionnés.")
    print(f"  - {from_ocr} avec texte OCR")
    print(f"  - {from_original} avec le texte original (pas encore OCRisé ou pas nécessaire)")
    print(f"Résultat : {JSONL_OUT}")


if __name__ == "__main__":
    main()