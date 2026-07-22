from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from .question import Question
from app.models.base import Base
from datetime import datetime
class PieceJointe(Base):
    __tablename__ = "pieces_jointes"
    id_piece: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nom_fichier: Mapped[str] = mapped_column(String(255), nullable=False)
    date_ajout: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    taille_fichier: Mapped[int] = mapped_column(Integer, nullable=False)
    chemin_fichier: Mapped[str] = mapped_column(String(512), nullable=False)
    id_question: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id_question"), nullable=False)
    # Relationships
    question: Mapped["Question"] = relationship("Question", back_populates="pieces_jointes")