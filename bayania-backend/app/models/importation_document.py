from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.sql import func
from .source_juridique import SourceJuridique
from app.models.base import Base
from datetime import datetime
from typing import List
class ImportationDocument(Base):
    __tablename__ = "importations_documents"
    id_importation: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    date_importation: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    statut_indexation: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False) # PENDING, COMPLETED, FAILED
    # Relationships
    sources: Mapped[List["SourceJuridique"]] = relationship("SourceJuridique", back_populates="importation", cascade="all, delete-orphan")