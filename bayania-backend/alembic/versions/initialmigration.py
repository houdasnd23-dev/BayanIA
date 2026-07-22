"""Initial migration
Revision ID: 1a2b3c4d5e6f
Revises: 
Create Date: 2026-07-18 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = None
branch_labels = None
depends_on = None
def upgrade() -> None:
    # 1. Create profils table
    op.create_table(
        'profils',
        sa.Column('id_profil', sa.Integer(), nullable=False),
        sa.Column('type_profil', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('id_profil'),
        sa.UniqueConstraint('type_profil')
    )
    op.create_index(op.f('ix_profils_id_profil'), 'profils', ['id_profil'], unique=False)
    # 2. Create users table
    op.create_table(
        'users',
        sa.Column('id_user', sa.Integer(), nullable=False),
        sa.Column('nom_user', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=150), nullable=False),
        sa.Column('mot_de_passe', sa.String(length=255), nullable=False),
        sa.Column('date_creation_compte', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('id_profil', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['id_profil'], ['profils.id_profil'], ),
        sa.PrimaryKeyConstraint('id_user')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id_user'), 'users', ['id_user'], unique=False)
    # 3. Create questions table
    op.create_table(
        'questions',
        sa.Column('id_question', sa.Integer(), nullable=False),
        sa.Column('texte_question_brute', sa.Text(), nullable=False),
        sa.Column('texte_question_anonymise', sa.Text(), nullable=False),
        sa.Column('date_heure_envoi', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('mode_reponse', sa.String(length=50), nullable=False),
        sa.Column('id_user', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['id_user'], ['users.id_user'], ),
        sa.PrimaryKeyConstraint('id_question')
    )
    op.create_index(op.f('ix_questions_id_question'), 'questions', ['id_question'], unique=False)
    # 4. Create donnees_sensibles table
    op.create_table(
        'donnees_sensibles',
        sa.Column('id_donnee', sa.Integer(), nullable=False),
        sa.Column('type_donnee', sa.String(length=50), nullable=False),
        sa.Column('valeur_detectee', sa.String(length=255), nullable=False),
        sa.Column('valeur_anonymisee', sa.String(length=255), nullable=False),
        sa.Column('id_question', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['id_question'], ['questions.id_question'], ),
        sa.PrimaryKeyConstraint('id_donnee')
    )
    op.create_index(op.f('ix_donnees_sensibles_id_donnee'), 'donnees_sensibles', ['id_donnee'], unique=False)
    # 5. Create pieces_jointes table
    op.create_table(
        'pieces_jointes',
        sa.Column('id_piece', sa.Integer(), nullable=False),
        sa.Column('nom_fichier', sa.String(length=255), nullable=False),
        sa.Column('date_ajout', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('taille_fichier', sa.Integer(), nullable=False),
        sa.Column('chemin_fichier', sa.String(length=512), nullable=False),
        sa.Column('id_question', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['id_question'], ['questions.id_question'], ),
        sa.PrimaryKeyConstraint('id_piece')
    )
    op.create_index(op.f('ix_pieces_jointes_id_piece'), 'pieces_jointes', ['id_piece'], unique=False)
    # 6. Create importations_documents table
    op.create_table(
        'importations_documents',
        sa.Column('id_importation', sa.Integer(), nullable=False),
        sa.Column('date_importation', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('statut_indexation', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('id_importation')
    )
    op.create_index(op.f('ix_importations_documents_id_importation'), 'importations_documents', ['id_importation'], unique=False)
    # 7. Create sources_juridiques table
    op.create_table(
        'sources_juridiques',
        sa.Column('id_source', sa.Integer(), nullable=False),
        sa.Column('type_source', sa.String(length=100), nullable=False),
         sa.Column('titre_document', sa.String(length=255), nullable=False),
        sa.Column('contenu_texte', sa.Text(), nullable=False),
        sa.Column('numero_article', sa.String(length=50), nullable=True),
        sa.Column('statut_validite', sa.Boolean(), nullable=False),
        sa.Column('id_importation', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['id_importation'], ['importations_documents.id_importation'], ),
        sa.PrimaryKeyConstraint('id_source')
    )
    op.create_index(op.f('ix_sources_juridiques_id_source'), 'sources_juridiques', ['id_source'], unique=False)
    # 8. Create reponses_ia table
    op.create_table(
        'reponses_ia',
        sa.Column('id_reponse', sa.Integer(), nullable=False),
        sa.Column('texte_reponse', sa.Text(), nullable=False),
        sa.Column('score_confiance', sa.Float(), nullable=False),
        sa.Column('date_heure_generation', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('id_question', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['id_question'], ['questions.id_question'], ),
        sa.PrimaryKeyConstraint('id_reponse')
    )
    op.create_index(op.f('ix_reponses_ia_id_reponse'), 'reponses_ia', ['id_reponse'], unique=False)
    # 9. Create reponse_sources association table (Many-to-Many)
    op.create_table(
        'reponse_sources',
        sa.Column('id_reponse', sa.Integer(), nullable=False),
        sa.Column('id_source', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['id_reponse'], ['reponses_ia.id_reponse'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['id_source'], ['sources_juridiques.id_source'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id_reponse', 'id_source')
    )
def downgrade() -> None:
    op.drop_table('reponse_sources')
    op.drop_index(op.f('ix_reponses_ia_id_reponse'), table_name='reponses_ia')
    op.drop_table('reponses_ia')
    op.drop_index(op.f('ix_sources_juridiques_id_source'), table_name='sources_juridiques')
    op.drop_table('sources_juridiques')
    op.drop_index(op.f('ix_importations_documents_id_importation'), table_name='importations_documents')
    op.drop_table('importations_documents')
    op.drop_index(op.f('ix_pieces_jointes_id_piece'), table_name='pieces_jointes')
    op.drop_table('pieces_jointes')
    op.drop_index(op.f('ix_donnees_sensibles_id_donnee'), table_name='donnees_sensibles')
    op.drop_table('donnees_sensibles')
    op.drop_index(op.f('ix_questions_id_question'), table_name='questions')
    op.drop_table('questions')
    op.drop_index(op.f('ix_users_id_user'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_profils_id_profil'), table_name='profils')
    op.drop_table('profils')