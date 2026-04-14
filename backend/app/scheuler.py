import schedule
import time
import asyncio

from app.email_service import send_email
from app.database import AsyncSessionLocal, get_emails


async def fetch_emails():
    async with AsyncSessionLocal() as session:
        emails = await get_emails(session)
        return emails


def job():
    emails = asyncio.run(fetch_emails())
    content = "오늘 공지 요약입니다"

    for e in emails:
        send_email(e, content)


def run_scheduler():
    schedule.every().day.at("09:00").do(job)

    while True:
        schedule.run_pending()
        time.sleep(60)