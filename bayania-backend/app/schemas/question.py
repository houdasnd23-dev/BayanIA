from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# Piece Jointe schemas
class PieceJointeResponse(BaseModel):
    id_piece: int
    nom_fichier: str
    date_ajout: datetime
    taille_fichier: int
    chemin_fichier: str
    id_question: int
    class Config:
        from_attributes = True
# Donnee Sensible schemas
class DonneeSensibleResponse(BaseModel):
    id_donnee: int
    type_donnee: str
    valeur_detectee: str
    valeur_anonymisee: str
    id_question: int
    class Config:
        from_attributes = True
# Question schemas
class QuestionCreate(BaseModel):
    texte_question_brute: str
    mode_reponse: str = "simple" # simple, pro
class QuestionResponse(BaseModel):
    id_question: int
    texte_question_brute: str
    texte_question_anonymise: str
    date_heure_envoi: datetime
    mode_reponse: str
    id_user: int
    donnees_sensibles: List[DonneeSensibleResponse] = []
    pieces_jointes: List[PieceJointeResponse] = []