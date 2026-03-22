"""Initial schema with all tables including shelf_life and activity_logs

Revision ID: 001_init
Revises:
Create Date: 2026-03-22

"""
from alembic import op
import sqlalchemy as sa

revision = '001_init'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table('users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(150), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('role', sa.Enum('admin', 'supervisor', 'operator', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # farms
    op.create_table('farms',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('site_id', sa.String(20), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('location', sa.String(200), nullable=False),
        sa.Column('gps_lat', sa.Float(), nullable=False),
        sa.Column('gps_lng', sa.Float(), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('site_id'),
    )

    # batches
    op.create_table('batches',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('farm_id', sa.String(), sa.ForeignKey('farms.id'), nullable=False),
        sa.Column('batch_code', sa.String(50), nullable=False),
        sa.Column('chick_count', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('status', sa.Enum('active', 'harvested', 'closed', name='batchstatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('batch_code'),
    )
    op.create_index('ix_batches_batch_code', 'batches', ['batch_code'], unique=True)

    # procurement
    op.create_table('procurement',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('item_type', sa.Enum('feed', 'medicine', 'chicks', name='itemtype'), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(20), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('total_cost', sa.Float(), nullable=False),
        sa.Column('supplier', sa.String(150), nullable=True),
        sa.Column('purchased_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    # inventory
    op.create_table('inventory_transactions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('item_type', sa.String(20), nullable=False),
        sa.Column('transaction_type', sa.Enum('inward', 'issue', name='transactiontype'), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('balance_after', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('procurement_id', sa.String(), sa.ForeignKey('procurement.id'), nullable=True),
        sa.Column('batch_id', sa.String(), sa.ForeignKey('batches.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    # daily_reports
    op.create_table('daily_reports',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('batch_id', sa.String(), sa.ForeignKey('batches.id'), nullable=False),
        sa.Column('reported_by', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('report_date', sa.Date(), nullable=False),
        sa.Column('mortality', sa.Integer(), nullable=False),
        sa.Column('feed_consumed', sa.Float(), nullable=False),
        sa.Column('gps_lat', sa.Float(), nullable=False),
        sa.Column('gps_lng', sa.Float(), nullable=False),
        sa.Column('gps_valid', sa.Boolean(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'verified', 'rejected', name='reportstatus'), nullable=False),
        sa.Column('verified_by', sa.String(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    # weighing
    op.create_table('weighing',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('batch_id', sa.String(), sa.ForeignKey('batches.id'), nullable=False),
        sa.Column('gross_weight', sa.Float(), nullable=False),
        sa.Column('tare_weight', sa.Float(), nullable=False),
        sa.Column('net_weight', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('recorded_by', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    # transport
    op.create_table('transport',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('batch_id', sa.String(), sa.ForeignKey('batches.id'), nullable=False),
        sa.Column('vehicle_number', sa.String(30), nullable=False),
        sa.Column('driver_name', sa.String(100), nullable=True),
        sa.Column('origin', sa.String(150), nullable=False),
        sa.Column('destination', sa.String(150), nullable=False),
        sa.Column('dispatch_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('arrival_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('batch_id'),
    )

    # processing
    op.create_table('processing',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('batch_id', sa.String(), sa.ForeignKey('batches.id'), nullable=False),
        sa.Column('farm_weight', sa.Float(), nullable=False),
        sa.Column('inward_weight', sa.Float(), nullable=False),
        sa.Column('loss', sa.Float(), nullable=False),
        sa.Column('wings_kg', sa.Float(), nullable=False),
        sa.Column('legs_kg', sa.Float(), nullable=False),
        sa.Column('breast_kg', sa.Float(), nullable=False),
        sa.Column('lollipop_kg', sa.Float(), nullable=False),
        sa.Column('waste_kg', sa.Float(), nullable=False),
        sa.Column('shelf_life_days', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('processed_at', sa.Date(), nullable=False, server_default=sa.func.current_date()),
        sa.Column('processed_by', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('batch_id'),
    )

    # sales
    op.create_table('sales',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('batch_id', sa.String(), sa.ForeignKey('batches.id'), nullable=False),
        sa.Column('buyer_name', sa.String(100), nullable=False),
        sa.Column('total_weight', sa.Float(), nullable=False),
        sa.Column('price_per_kg', sa.Float(), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('sold_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    # activity_logs
    op.create_table('activity_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity', sa.String(50), nullable=True),
        sa.Column('entity_id', sa.String(), nullable=True),
        sa.Column('detail', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('activity_logs')
    op.drop_table('sales')
    op.drop_table('processing')
    op.drop_table('transport')
    op.drop_table('weighing')
    op.drop_table('daily_reports')
    op.drop_table('inventory_transactions')
    op.drop_table('procurement')
    op.drop_table('batches')
    op.drop_table('farms')
    op.drop_table('users')
