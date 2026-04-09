# backend/app/scheduler.py

import schedule
import time
from email_service import send_email

def get_emails_from_db():
    # TODO: 나중에 DB 연결
    return ["dbstjr0219@gmail.com"]

def job():
    emails = get_emails_from_db()
    content = "오늘 공지 요약입니다"

    for e in emails:
        send_email(e, content)

def run_scheduler():
    schedule.every().day.at("09:00").do(job)

    while True:
        schedule.run_pending()
        time.sleep(60)