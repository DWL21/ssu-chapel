from sqlalchemy import BigInteger, String, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.database import Base


class Subscriber(Base):
    __tablename__ = "subscribers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="subscriber")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    subscriber_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("subscribers.id", ondelete="CASCADE"), nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    subscriber: Mapped["Subscriber"] = relationship(back_populates="subscriptions")

    __table_args__ = (
        UniqueConstraint("subscriber_id", "category", name="uq_subscriber_category"),
    )


class AuthCode(Base):
    __tablename__ = "auth_codes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, nullable=False)
    auth_code: Mapped[str] = mapped_column(String(6), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
