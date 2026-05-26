import logging
import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def send_email_with_retry(
    to_email: str,
    subject: str,
    body: str = "",
    html_body: str = "",
    *,
    attempts: int = 3,
    backoff: float = 2.0,
):
    """Send email with retry on transient SMTP / network errors.

    Retries only on smtplib.SMTPException and OSError. Configuration errors
    (e.g. missing credentials raising ValueError) propagate immediately.
    """
    last_exc: Exception | None = None
    for i in range(attempts):
        try:
            send_email(to_email, subject, body=body, html_body=html_body)
            if i > 0:
                logger.info("SMTP 재시도 성공 (%d회차): %s", i + 1, to_email)
            return
        except (smtplib.SMTPException, OSError) as e:
            last_exc = e
            logger.warning(
                "SMTP 실패 (%d/%d) %s: %s", i + 1, attempts, to_email, e
            )
            if i < attempts - 1:
                time.sleep(backoff * (2 ** i))
    assert last_exc is not None
    raise last_exc


def send_email(to_email: str, subject: str, body: str = "", html_body: str = ""):
    """Send email using SMTP (Gmail).

    Args:
        to_email: Recipient email address
        subject: Email subject
        body: Plain text email body
        html_body: HTML email body (if provided, takes precedence)
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_name = os.getenv("SMTP_FROM_NAME", "숭실 매일메일")

    if not smtp_user or not smtp_password:
        raise ValueError("SMTP_USER and SMTP_PASSWORD environment variables are required")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr((from_name, smtp_user), charset="utf-8")
    msg["To"] = to_email

    if body:
        msg.attach(MIMEText(body, "plain"))

    if html_body:
        msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)


def send_auth_code(to_email: str, code: str) -> None:
    """Send a 6-digit verification code for subscription confirmation."""
    subject = f"[숭실대 공지 메일] 인증번호 {code}"
    text_body = (
        f"숭실대 공지사항 구독 인증번호: {code}\n"
        "10분 내에 입력해주세요.\n\n"
        "본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다."
    )
    html_body = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#222;">
      <h2 style="margin:0 0 16px;font-size:18px;">숭실대 공지사항 구독 인증</h2>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#555;">
        구독 페이지에서 아래 6자리 인증번호를 입력해주세요.
        <br/>10분 후 만료됩니다.
      </p>
      <div style="background:#f5f5f7;border-radius:8px;padding:20px;text-align:center;letter-spacing:8px;font-size:28px;font-weight:600;color:#111;">
        {code}
      </div>
      <p style="margin:24px 0 0;font-size:12px;color:#999;line-height:1.5;">
        본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.
      </p>
    </div>
    """
    send_email(to_email, subject, body=text_body, html_body=html_body)
