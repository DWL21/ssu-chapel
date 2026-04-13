from fastapi import APIRouter, Depends, Query
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.notice import Notice
from app.services.notice_collector import collect_new_notices

router = APIRouter(prefix="/notices", tags=["notices"])


@router.post("/refresh")
async def refresh_notices(
    page: int = Query(1, ge=1),
    category: str = Query(""),
    db: AsyncSession = Depends(get_db),
):
    new_notices = await collect_new_notices(db, page=page, category=category)
    return {"new_count": len(new_notices), "new_notices": new_notices}


@router.get("/count")
async def count_notices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count(Notice.id)))
    return {"count": result.scalar_one()}


@router.delete("")
async def clear_notices(db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Notice))
    await db.commit()
    return {"status": "cleared"}
