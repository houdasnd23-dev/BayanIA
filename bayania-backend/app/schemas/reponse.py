from pydantic import BaseModel
from datetime import datetime
from typing import List
from app.schemas.source import SourceJuridiqueResponse
class ReponseIAResponse(BaseModel):
    id_reponse: int
    texte_reponse: str
    score_confiance: float
    date_heure_generation: datetime
    id_question: int
    sources: List[SourceJuridiqueResponse] = []
    class Config:
        from_attributes = True