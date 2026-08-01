import re
from typing import List, Dict, Any

def chunk_legal_text(text: str) -> List[Dict[str, Any]]:
    """
    Splits legal text into chunks, targeting articles (FR: Article/Art., AR: المادة)
    or falls back to paragraph/sentence structures.
    """
    article_regex = re.compile(
        r'(?:^|\n)('
        r'Article\s+(?:\d+|premier|1er)'      # FR: Article 1, Article premier
        r'|Art\.\s+\d+'                        # FR: Art. 12
        r'|المادة\s+(?:\d+|الأولى|[٠-٩]+)'     # AR: المادة 1 / المادة الأولى / chiffres arabes
        r')\b',
        re.IGNORECASE | re.UNICODE
    )

    matches = list(article_regex.finditer(text))
    chunks = []
    if not matches:
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        for idx, para in enumerate(paragraphs):
            if len(para) > 20:
                chunks.append({
                    "numero_article": f"Paragraphe {idx + 1}",
                    "contenu_texte": para
                })

        if not chunks and text.strip():
            chunks.append({
                "numero_article": "Général",
                "contenu_texte": text.strip()
            })
        return chunks

    for i in range(len(matches)):
        start = matches[i].start()
        header = matches[i].group(1).strip()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)

        article_content = text[start:end].strip()

        if len(article_content) > 10:
            chunks.append({
                "numero_article": header,
                "contenu_texte": article_content
            })
    return chunks