from pydantic import BaseModel
class DocumentImportRequest(BaseModel):
    titre_document: str
    type_source: str # e.g. Loi, Décret, Constitution
    contenu_texte: str
