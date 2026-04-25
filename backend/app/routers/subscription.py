import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.auth_code import AuthCode
from app.models.subscription import Subscriber, Subscription
from app.schemas.subscription import (
    SubscribeRequest,
    UnsubscribeRequest,
    SubscriptionResponse,
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


def _random_token() -> str:
    return secrets.token_hex(24)


async def _verify_auth_code(db: AsyncSession, email: str, code: str):
    result = await db.execute(select(AuthCode).where(AuthCode.email == email))
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(400, "인증번호를 먼저 요청해주세요.")
    if datetime.now(timezone.utc) > row.expires_at:
        raise HTTPException(400, "인증번호가 만료되었습니다.")
    if row.code != code:
        raise HTTPException(400, "인증번호가 올바르지 않습니다.")
    await db.execute(delete(AuthCode).where(AuthCode.email == email))


async def _get_or_create_subscriber(db: AsyncSession, email: str) -> Subscriber:
    result = await db.execute(select(Subscriber).where(Subscriber.email == email))
    subscriber = result.scalar_one_or_none()
    if subscriber is None:
        subscriber = Subscriber(email=email, unsub_token=_random_token())
        db.add(subscriber)
        await db.flush()
    elif subscriber.unsub_token is None:
        subscriber.unsub_token = _random_token()
        await db.flush()
    return subscriber


@router.post("", response_model=SubscriptionResponse, status_code=201)
async def subscribe(body: SubscribeRequest, db: AsyncSession = Depends(get_db)):
    if not body.categories:
        raise HTTPException(status_code=400, detail="카테고리를 1개 이상 선택해주세요.")

    email = body.email.lower().strip()
    await _verify_auth_code(db, email, body.auth_code.strip())

    subscriber = await _get_or_create_subscriber(db, email)

    result = await db.execute(
        select(Subscription.category).where(Subscription.subscriber_id == subscriber.id)
    )
    existing = set(result.scalars().all())

    seen = set()
    for cat in body.categories:
        if cat.value not in existing and cat.value not in seen:
            db.add(Subscription(subscriber_id=subscriber.id, category=cat.value))
            seen.add(cat.value)

    await db.commit()

    result = await db.execute(
        select(Subscription.category).where(Subscription.subscriber_id == subscriber.id)
    )
    subscribed = list(result.scalars().all())

    return SubscriptionResponse(email=email, subscribed_categories=subscribed)


@router.delete("", response_model=SubscriptionResponse)
async def unsubscribe_by_category(body: UnsubscribeRequest, db: AsyncSession = Depends(get_db)):
    if not body.categories:
        raise HTTPException(status_code=400, detail="카테고리를 1개 이상 선택해주세요.")

    result = await db.execute(select(Subscriber).where(Subscriber.email == body.email))
    subscriber = result.scalar_one_or_none()
    if subscriber is None:
        raise HTTPException(status_code=404, detail="등록된 구독 정보가 없습니다.")

    category_values = [cat.value for cat in body.categories]
    await db.execute(
        delete(Subscription).where(
            Subscription.subscriber_id == subscriber.id,
            Subscription.category.in_(category_values),
        )
    )

    result = await db.execute(
        select(Subscription.category).where(Subscription.subscriber_id == subscriber.id)
    )
    remaining = list(result.scalars().all())

    if not remaining:
        await db.execute(delete(Subscriber).where(Subscriber.id == subscriber.id))

    await db.commit()

    return SubscriptionResponse(email=body.email, subscribed_categories=remaining)
