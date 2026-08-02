"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    op.add_column(
        'sources_juridiques',
        sa.Column('contenu_hash', sa.String(length=64), nullable=True)
    )
    op.create_index(
        op.f('ix_sources_juridiques_contenu_hash'),
        'sources_juridiques',
        ['contenu_hash']
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_sources_juridiques_contenu_hash'), table_name='sources_juridiques')
    op.drop_column('sources_juridiques', 'contenu_hash')