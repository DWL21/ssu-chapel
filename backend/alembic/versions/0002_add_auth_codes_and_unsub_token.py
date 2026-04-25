"""add auth_codes table and subscribers.unsub_token

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "auth_codes",
        sa.Column("email", sa.String, primary_key=True),
        sa.Column("code", sa.String, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.add_column(
        "subscribers",
        sa.Column("unsub_token", sa.String, unique=True, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("subscribers", "unsub_token")
    op.drop_table("auth_codes")
