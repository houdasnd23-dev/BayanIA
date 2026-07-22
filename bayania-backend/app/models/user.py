from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.models.base import Base
from datetime import datetime
from typing import List, Optional
class User(Base):
    __tablename__ = "users"
    id_user: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nom_user: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    mot_de_passe: Mapped[str] = mapped_column(String(255), nullable=False)
    date_creation_compte: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    id_profil: Mapped[int] = mapped_column(Integer, ForeignKey("profils.id_profil"), nullable=False)
    # Relationships
    profil: Mapped["Profil"] = relationship("Profil", back_populates="users")
    questions: Mapped[List["Question"]] = relationship("Question", back_populates="user")