from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer
from app.models.base import Base
from typing import List
class Profil(Base):
    __tablename__ = "profils"
    id_profil: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type_profil: Mapped[str] = mapped_column(String(50), unique=True, nullable=False) # normal, professionnel, administrateur
    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="profil")