# backend/app/email_service.py
from dotenv import load_dotenv
load_dotenv()

import smtplib
from email.mime.text import MIMEText
import os

def send_email(to_email, content):
    from_email = "dbstjr0219@gmail.com"
    app_password = os.getenv("EMAIL_PASSWORD")

    msg = MIMEText(content)
    msg["Subject"] = "공지 요약"
    msg["From"] = from_email
    msg["To"] = to_email

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(from_email, app_password)
        server.send_message(msg)