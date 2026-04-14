import schedule
import time
import asyncio
from datetime import datetime
from sqlalchemy import select
from app.SendMail import send_email
from app.email_template import build_email_html
from app.models.subscription import Subscriber, Subscription, Notice
from app.database import AsyncSessionLocal

async def get_daily_notices():
    """Get notices from database (placeholder for now)."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Notice))
        return result.scalars().all()

async def job():
    """Daily digest cron job at 9:00 AM KST."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Subscriber))
            subscribers = result.scalars().all()
            
            for subscriber in subscribers:
                result = await session.execute(
                    select(Subscription.category).where(Subscription.subscriber_id == subscriber.id)
                )
                categories = result.scalars().all()
                
                if not categories:
                    continue
                
                notices_list = []
                for notice in await get_daily_notices():
                    if hasattr(notice, 'category') and notice.category in categories:
                        notices_list.append({
                            'title': getattr(notice, 'title', '공지사항'),
                            'category': getattr(notice, 'category', ''),
                            'status': '진행',
                            'link': getattr(notice, 'link', '#'),
                            'department': getattr(notice, 'department', '')
                        })
                
                if notices_list:
                    html_body = build_email_html(notices_list)
                    send_email(
                        subscriber.email,
                        subject=f"[{', '.join(categories)}] 오늘의 공지 요약",
                        html_body=html_body
                    )
    except Exception as e:
        print(f"Scheduler error: {e}")

def run_scheduler():
    """Run the scheduler in a loop."""
    schedule.every().day.at("09:00").do(lambda: asyncio.run(job()))
    
    while True:
        schedule.run_pending()
        time.sleep(60)