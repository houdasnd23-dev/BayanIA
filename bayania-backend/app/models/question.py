from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.models.base import Base
from datetime import datetime
from typing import List, Optional
class Question(Base):
    __tablename__ = "questions"
    id_question: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    texte_question_brute: Mapped[str] = mapped_column(Text, nullable=False)
    texte_question_anonymise: Mapped[str] = mapped_column(Text, nullable=False)
    date_heure_envoi: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    mode_reponse: Mapped[str] = mapped_column(String(50), nullable=False) # simple, pro
    id_user: Mapped[int] = mapped_column(Integer, ForeignKey("users.id_user"), nullable=False)
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="questions")
    donnees_sensibles: Mapped[List["DonneeSensible"]] = relationship("DonneeSensible", back_populates="question", cascade="all, delete-orphan")
    pieces_jointes: Mapped[List["PieceJointe"]] = relationship("PieceJointe", back_populates="question", cascade="all, delete-orphan")
    reponse_ia: Mapped[Optional["ReponseIA"]] = relationship("ReponseIA", uselist=False, back_populates="question", cascade="all, delete-orphan")