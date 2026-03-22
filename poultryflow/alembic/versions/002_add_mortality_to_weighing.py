"""Add mortality column to weighing table

Revision ID: 002_mortality
Revises: 001_init
Create Date: 2026-03-22

"""
from alembic import op
import sqlalchemy as sa

revision = '002_mortality'
down_revision = '001_init'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'weighing',
        sa.Column('mortality', sa.Integer(), nullable=False, server_default='0'),
    )


def downgrade() -> None:
    op.drop_column('weighing', 'mortality')
