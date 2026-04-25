import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.auth_code import AuthCode
from app.SendMail import send_auth_code

router = APIRouter(prefix="/auth", tags=["auth"])


class RequestCodeBody(BaseModel):
    email: EmailStr


def _random_code() -> str:
    return f"{secrets.randbelow(900000) + 100000}"


@router.post("/request-code")
async def request_code(body: RequestCodeBody, db: AsyncSession = Depends(get_db)):
    email = body.email.lower().strip()
    now = datetime.now(timezone.utc)

    result = await db.execute(select(AuthCode).where(AuthCode.email == email))
    existing = result.scalar_one_or_none()

    if existing and existing.expires_at - now > timedelta(minutes=9):
        raise HTTPException(429, "인증번호를 이미 발송했습니다. 1분 후 다시 시도해주세요.")

    code = _random_code()
    expires_at = now + timedelta(minutes=10)

    if existing:
        existing.code = code
        existing.expires_at = expires_at
    else:
        db.add(AuthCode(email=email, code=code, expires_at=expires_at))

    await db.commit()
    send_auth_code(email, code)

    return {"ok": True}
