from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundException

from app.models.user import User
from app.models.source_juridique import SourceJuridique

from app.schemas.source import (
    SourceJuridiqueResponse,
    SourceSearchResult,
)

from app.services.search_service import SearchService


router = APIRouter(
    prefix="/sources",
    tags=["Sources Juridiques"],
)


@router.get(
    "/search",
    response_model=List[SourceSearchResult],
)
async def search_sources(
    q: str = Query(
        ...,
        min_length=2,
        description="Texte de recherche",
    ),
    top_k: int = Query(
        default=10,
        ge=1,
        le=50,
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Recherche juridique hybride :
    - Qdrant pour la recherche sémantique
    - PostgreSQL pour la recherche lexicale
    """

    return await SearchService.hybrid_search(
        db=db,
        query=q,
        top_k=top_k,
    )


@router.get(
    "/{id}",
    response_model=SourceJuridiqueResponse,
)
async def get_source(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retourne une source juridique par son identifiant.
    """

    stmt = select(SourceJuridique).where(
        SourceJuridique.id_source == id
    )

    result = await db.execute(stmt)

    source = result.scalar_one_or_none()

    if not source:
        raise NotFoundException(
            "Legal source not found"
        )

    return source