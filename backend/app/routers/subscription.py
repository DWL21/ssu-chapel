from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.subscription import Subscriber, Subscription
from app.schemas.subscription import (
    SubscribeRequest,
    UnsubscribeRequest,
    SubscriptionResponse,
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


async def _get_or_create_subscriber(db: AsyncSession, email: str) -> Subscriber:
    result = await db.execute(select(Subscriber).where(Subscriber.email == email))
    subscriber = result.scalar_one_or_none()
    if subscriber is None:
        subscriber = Subscriber(email=email)
        db.add(subscriber)
        await db.flush()
    return subscriber


@router.post("", response_model=SubscriptionResponse, status_code=201)
async def subscribe(body: SubscribeRequest, db: AsyncSession = Depends(get_db)):
    if not body.categories:
        raise HTTPException(status_code=400, detail="카테고리를 1개 이상 선택해주세요.")

    subscriber = await _get_or_create_subscriber(db, body.email)

    result = await db.execute(
        select(Subscription.category).where(Subscription.subscriber_id == subscriber.id)
    )
    existing = set(result.scalars().all())

    for cat in body.categories:
        if cat.value not in existing:
            db.add(Subscription(subscriber_id=subscriber.id, category=cat.value))

    await db.commit()

    result = await db.execute(
        select(Subscription.category).where(Subscription.subscriber_id == subscriber.id)
    )
    subscribed = list(result.scalars().all())

    return SubscriptionResponse(email=body.email, subscribed_categories=subscribed)


@router.delete("", response_model=SubscriptionResponse)
async def unsubscribe(body: UnsubscribeRequest, db: AsyncSession = Depends(get_db)):
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
