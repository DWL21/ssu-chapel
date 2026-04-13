import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.notice import Notice


async def fetch_notices_from_crawler(page: int = 1, category: str = "") -> list[dict]:
    params: dict[str, str | int] = {"page": page}
    if category:
        params["category"] = category
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{settings.crawler_base_url}/notices", params=params)
        resp.raise_for_status()
        return resp.json().get("notices", [])


async def collect_new_notices(
    db: AsyncSession, page: int = 1, category: str = ""
) -> list[dict]:
    notices = await fetch_notices_from_crawler(page=page, category=category)
    if not notices:
        return []

    links = [n["link"] for n in notices if n.get("link")]
    result = await db.execute(select(Notice.link).where(Notice.link.in_(links)))
    existing = set(result.scalars().all())

    new_notices = [n for n in notices if n["link"] not in existing]
    for n in new_notices:
        db.add(Notice(link=n["link"]))

    await db.commit()
    return new_notices
