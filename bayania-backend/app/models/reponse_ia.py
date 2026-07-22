from sqlalchemy.sql import func
from app.models.base import Base
from datetime import datetime
from typing import List
from datetime import datetime
from typing import List
from sqlalchemy import (
    Table,
    Column,
    Integer,
    Float,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)
from sqlalchemy.sql import func

from app.models.base import Base
# Association table for ReponseIA <-> SourceJuridique (Many-to-Many)
reponse_sources = Table(
    "reponse_sources",
    Base.metadata,
    Column("id_reponse", Integer, ForeignKey("reponses_ia.id_reponse", ondelete="CASCADE"), primary_key=True),
    Column("id_source", Integer, ForeignKey("sources_juridiques.id_source", ondelete="CASCADE"), primary_key=True)
)
class ReponseIA(Base):
    __tablename__ = "reponses_ia"
    id_reponse: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    texte_reponse: Mapped[str] = mapped_column(Text, nullable=False)
    score_confiance: Mapped[float] = mapped_column(Float, nullable=False)
    date_heure_generation: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    id_question: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id_question"), nullable=False)
    # Relationships
    question: Mapped["Question"] = relationship("Question", back_populates="reponse_ia")
    sources: Mapped[List["SourceJuridique"]] = relationship(
        "SourceJuridique",
        secondary=reponse_sources,
        back_populates="reponses"
    )