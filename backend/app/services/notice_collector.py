import httpx

from app.config import settings


async def fetch_notices_from_crawler(page: int = 1, category: str = "") -> list[dict]:
    params: dict[str, str | int] = {"page": page}
    if category:
        params["category"] = category
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{settings.crawler_base_url}/notices", params=params)
        resp.raise_for_status()
        return resp.json().get("notices", [])


async def fetch_notice_detail_from_crawler(slug: str) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"{settings.crawler_base_url}/notices/detail", params={"slug": slug}
        )
        resp.raise_for_status()
        return resp.json()
