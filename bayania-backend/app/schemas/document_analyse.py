# app/schemas/document_analysis.py
from pydantic import BaseModel
from typing import List

class ClauseRisque(BaseModel):
    clause: str
    niveau_risque: str  # "faible", "moyen", "élevé"
    explication: str

class AnalyseDocumentResponse(BaseModel):
    resume: str
    clauses_risque: List[ClauseRisque]
    conformite: str
    recommandations: List[str]