"""Create subscription tables migration.

Revision ID: 0002_add_subscriptions
Revises: 0001_create_initial_tables
Create Date: 2026-04-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0002_add_subscriptions'
down_revision = '0001_create_initial_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create subscribers table
    op.create_table(
        'subscribers',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('subscriber_id', sa.BigInteger(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['subscriber_id'], ['subscribers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('subscriber_id', 'category', name='uq_subscriber_category')
    )

    # Add columns to notices table
    op.add_column('notices', sa.Column('title', sa.String(), nullable=True))
    op.add_column('notices', sa.Column('content', sa.Text(), nullable=True))
    op.add_column('notices', sa.Column('category', sa.String(), nullable=True))
    op.add_column('notices', sa.Column('department', sa.String(), nullable=True))

    # Make column not nullable after adding
    op.alter_column('notices', 'title', nullable=False)
    op.alter_column('notices', 'category', nullable=False)


def downgrade() -> None:
    # Revert notices table
    op.drop_column('notices', 'department')
    op.drop_column('notices', 'category')
    op.drop_column('notices', 'content')
    op.drop_column('notices', 'title')

    # Drop tables
    op.drop_table('subscriptions')
    op.drop_table('subscribers')
