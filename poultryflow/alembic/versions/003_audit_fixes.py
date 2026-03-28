"""Audit fixes: skinless_curry_cut_kg, remaining_chicks, inventory item_type enum

Changes:
1. processing.skinless_curry_cut_kg  — adds the missing cut-breakdown column
2. batches.remaining_chicks          — per-batch live chick counter (backfilled from chick_count)
3. inventory_transactions.item_type  — re-typed from varchar(20) to the shared 'itemtype' enum
                                       (enum was already created by 001_init for procurement)

Revision ID: 003_audit_fixes
Revises: 002_mortality
Create Date: 2026-03-28
"""
from alembic import op
import sqlalchemy as sa

revision = '003_audit_fixes'
down_revision = '002_mortality'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add skinless_curry_cut_kg to the processing breakdown
    op.add_column(
        'processing',
        sa.Column('skinless_curry_cut_kg', sa.Float(), nullable=False, server_default='0.0'),
    )

    # 2. Add remaining_chicks to batches (nullable; immediately back-filled)
    op.add_column(
        'batches',
        sa.Column('remaining_chicks', sa.Integer(), nullable=True),
    )
    # Back-fill existing rows so remaining_chicks starts equal to chick_count
    op.execute("UPDATE batches SET remaining_chicks = chick_count")

    # 3. Standardise inventory_transactions.item_type to the shared 'itemtype' enum.
    #    The 'itemtype' enum ('feed', 'medicine', 'chicks') was created in 001_init for
    #    the procurement table.  All existing varchar values match the enum literals,
    #    so a plain USING cast is safe.
    op.execute(
        "ALTER TABLE inventory_transactions "
        "ALTER COLUMN item_type TYPE itemtype "
        "USING item_type::itemtype"
    )


def downgrade() -> None:
    # Revert item_type back to varchar
    op.execute(
        "ALTER TABLE inventory_transactions "
        "ALTER COLUMN item_type TYPE varchar(30) "
        "USING item_type::text"
    )

    op.drop_column('batches', 'remaining_chicks')
    op.drop_column('processing', 'skinless_curry_cut_kg')
