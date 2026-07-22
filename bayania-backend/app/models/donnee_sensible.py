from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey
from .question import Question

from app.models.base import Base
class DonneeSensible(Base):
    __tablename__ = "donnees_sensibles"
    id_donnee: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type_donnee: Mapped[str] = mapped_column(String(50), nullable=False) # NOM, CIN, TELEPHONE, EMAIL, ADRESSE
    valeur_detectee: Mapped[str] = mapped_column(String(255), nullable=False)
    valeur_anonymisee: Mapped[str] = mapped_column(String(255), nullable=False)
    id_question: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id_question"), nullable=False)
    # Relationships
    question: Mapped["Question"] = relationship("Question", back_populates="donnees_sensibles")