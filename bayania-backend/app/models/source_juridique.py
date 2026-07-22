from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, ForeignKey, Text
from app.models.base import Base
from app.models.reponse_ia import reponse_sources
from typing import List
class SourceJuridique(Base):
    __tablename__ = "sources_juridiques"
    id_source: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type_source: Mapped[str] = mapped_column(String(100), nullable=False) # Loi, Décret, Constitution, etc.
    titre_document: Mapped[str] = mapped_column(String(255), nullable=False)
    contenu_texte: Mapped[str] = mapped_column(Text, nullable=False)
    numero_article: Mapped[str] = mapped_column(String(50), nullable=True)
    statut_validite: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    id_importation: Mapped[int] = mapped_column(Integer, ForeignKey("importations_documents.id_importation"), nullable=False)
    # Relationships
    importation: Mapped["ImportationDocument"] = relationship("ImportationDocument", back_populates="sources")
    reponses: Mapped[List["ReponseIA"]] = relationship(
        "ReponseIA",
        secondary=reponse_sources,
        back_populates="sources"
    )