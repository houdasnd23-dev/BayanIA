from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
# Source Juridique schemas
class SourceJuridiqueBase(BaseModel):
    type_source: str
    titre_document: str
    contenu_texte: str
    numero_article: Optional[str] = None
    statut_validite: bool = True
class SourceJuridiqueCreate(SourceJuridiqueBase):
    id_importation: int
class SourceJuridiqueResponse(SourceJuridiqueBase):
    id_source: int
    id_importation: int
    class Config:
        from_attributes = True
# Importation Document schemas
class ImportationDocumentResponse(BaseModel):
    id_importation: int
    date_importation: datetime
    statut_indexation: str
    class Config:
        from_attributes = True
class ImportationDocumentDetailResponse(BaseModel):
    id_importation: int
    date_importation: datetime
    statut_indexation: str
    titre_document: str
    type_source: str
    nb_chunks: int

    class Config:
        from_attributes = True
class SourceSearchResult(BaseModel):
    id_source: Optional[int] = None
    titre_document: Optional[str] = None
    numero_article: Optional[str] = None
    contenu_texte: Optional[str] = None
    type_source: Optional[str] = None
    score: float