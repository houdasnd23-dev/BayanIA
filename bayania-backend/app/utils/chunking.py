
import re
from typing import List, Dict, Any
def chunk_legal_text(text: str) -> List[Dict[str, Any]]:
    """
    Splits legal text into chunks, targeting articles or falls back to paragraph/sentence structures.
    Returns a list of dictionaries:
    [
        {"numero_article": "Article 1", "contenu_texte": "..."},
        ...
    ]
    """
    # Regex to detect article starts: "Article 1", "Art. 12", "Article premier", etc.
    # Checks for "Article X" or "Art. X" at the start of a line or after a newline.
    article_regex = re.compile(
        r'(?:^|\n)(Article\s+(?:\d+|premier|1er)|Art\.\s+\d+)\b',
        re.IGNORECASE
    )
    
    matches = list(article_regex.finditer(text))
    chunks = []
    if not matches:
        # Fallback to double newline split (paragraphs)
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        for idx, para in enumerate(paragraphs):
            # Skip extremely short lines
            if len(para) > 20:
                chunks.append({
                    "numero_article": f"Paragraphe {idx + 1}",
                    "contenu_texte": para
                })
        
        # If paragraphs yield nothing, split by lines or return the whole text
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
        
        # Extract full text of the article (including header for semantic richness)
        article_content = text[start:end].strip()
        
        if len(article_content) > 10:
            chunks.append({
                "numero_article": header,
                "contenu_texte": article_content
            })
        return chunks