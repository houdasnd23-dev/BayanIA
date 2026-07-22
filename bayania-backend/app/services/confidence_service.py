from typing import List, Dict, Any
class ConfidenceService:
    @staticmethod
    def calculate_score(
        response_text: str,
        retrieved_sources: List[Dict[str, Any]]
    ) -> float:
        """
        Calculates a confidence score between 0.0 and 1.0 based on:
        1. Semantic similarity score of retrieved sources (weight: 70%)
        2. Direct citation overlap in the response text (weight: 30%)
        """
        if not retrieved_sources:
            return 0.0
            
        # 1. Average similarity score of RAG hits
        avg_similarity = sum(s["score"] for s in retrieved_sources) / len(retrieved_sources)
        # Cap similarity between 0 and 1
        avg_similarity = max(0.0, min(1.0, avg_similarity))
        
        # 2. Citation coverage (check if article numbers or document titles are mentioned)
        citations_found = 0
        response_lower = response_text.lower()
        
        for source in retrieved_sources:
            article = str(source.get("numero_article", "")).lower()
            title = str(source.get("titre_document", "")).lower()
            
            # Check if article name or document title is present in the response text
            cited_article = len(article) > 2 and article in response_lower
            cited_title = len(title) > 3 and title in response_lower
            
            if cited_article or cited_title:
                citations_found += 1
                
        citation_ratio = citations_found / len(retrieved_sources)
        
        # Weighted combination
        confidence = (0.7 * avg_similarity) + (0.3 * citation_ratio)
        
        return round(confidence, 2)