"""create initial tables (notices, subscribers, subscriptions)

Revision ID: 0001
Revises:
Create Date: 2026-04-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notices",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("link", sa.String, unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "subscribers",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("email", sa.String, unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("subscriber_id", sa.BigInteger, sa.ForeignKey("subscribers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("subscriber_id", "category", name="uq_subscriber_category"),
    )


def downgrade() -> None:
    op.drop_table("subscriptions")
    op.drop_table("subscribers")
    op.drop_table("notices")
