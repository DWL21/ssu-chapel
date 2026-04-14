print("파일 실행 시작")
import asyncio

from app.database import Base, engine
from app.database import AsyncSessionLocal, get_emails
from app.models.subscription import Subscriber
from app.SendMail import send_email
from sqlalchemy import select


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def add_test_email(session):
    emails=["dbstjr0219@gmail.com","fbs0219@naver.com"]
    for e in emails:
        result = await session.execute(
            select(Subscriber).where(Subscriber.email == e)
        )
        exists = result.scalar()

        if not exists:
            session.add(Subscriber(email=e))
    await session.commit()

async def test_multiemail():
    await init_db()
    async with AsyncSessionLocal() as session:
        await add_test_email(session)
        emails = await get_emails(session)

        print("가져온 이메일:", emails)  # 🔍 확인용

        content = "DB 기반 테스트 메일입니다"

        for e in emails:
            print(f"보내는 중: {e}")
            send_email(e, content)


if __name__ == "__main__":
    asyncio.run(test_multiemail())