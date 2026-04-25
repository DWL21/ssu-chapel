import asyncio
import logging
from datetime import date

import schedule
import time
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.notice import Notice
from app.models.subscription import Subscriber, Subscription
from app.services.notice_collector import fetch_notices_from_crawler
from app.email_template import build_email_html
from app.SendMail import send_email

logger = logging.getLogger(__name__)


async def _collect_and_send():
    async with AsyncSessionLocal() as db:
        # 1. 모든 구독자와 구독 카테고리 조회
        result = await db.execute(
            select(Subscriber, Subscription.category)
            .join(Subscription, Subscriber.id == Subscription.subscriber_id)
        )
        rows = result.all()

        if not rows:
            logger.info("구독자가 없어 발송 스킵")
            return

        # subscriber_id -> {subscriber, categories}
        subscriber_map: dict[int, dict] = {}
        all_categories: set[str] = set()
        for subscriber, category in rows:
            if subscriber.id not in subscriber_map:
                subscriber_map[subscriber.id] = {
                    "subscriber": subscriber,
                    "categories": set(),
                }
            subscriber_map[subscriber.id]["categories"].add(category)
            all_categories.add(category)

        # 2. 카테고리별 공지사항 크롤링 (raw)
        category_raw: dict[str, list[dict]] = {}
        all_links: set[str] = set()
        for category in all_categories:
            cat_param = "" if category == "전체" else category
            try:
                notices = await fetch_notices_from_crawler(page=1, category=cat_param)
            except Exception:
                logger.exception("크롤링 실패: %s", category)
                continue
            category_raw[category] = notices
            all_links.update(n["link"] for n in notices if n.get("link"))

        if not all_links:
            logger.info("새 공지사항 없음, 발송 스킵")
            return

        # 전체 링크를 한 번에 DB 조회 — 카테고리 간 교차 오염 방지
        result = await db.execute(select(Notice.link).where(Notice.link.in_(all_links)))
        existing_links = set(result.scalars().all())
        new_links = all_links - existing_links

        for link in new_links:
            db.add(Notice(link=link))
        await db.commit()

        # 카테고리별 신규 공지 필터링
        category_notices: dict[str, list[dict]] = {
            cat: [n for n in notices if n.get("link") and n["link"] in new_links]
            for cat, notices in category_raw.items()
        }
        category_notices = {cat: ns for cat, ns in category_notices.items() if ns}

        if not category_notices:
            logger.info("새 공지사항 없음, 발송 스킵")
            return

        # 3. 구독자별 매칭 + 발송
        today = date.today()
        for info in subscriber_map.values():
            subscriber = info["subscriber"]
            cats = info["categories"]

            matched_notices = []
            for cat in cats:
                matched_notices.extend(category_notices.get(cat, []))

            if not matched_notices:
                continue

            # 중복 제거 (link 기준)
            seen_links: set[str] = set()
            unique_notices = []
            for n in matched_notices:
                if n["link"] not in seen_links:
                    seen_links.add(n["link"])
                    unique_notices.append(n)

            html = build_email_html(unique_notices, target_date=today, unsub_token=subscriber.unsub_token)
            subject = f"숭실대 공지사항 ({today.strftime('%Y.%m.%d')}) — {len(unique_notices)}건"

            try:
                send_email(subscriber.email, subject, html_body=html)
                logger.info("발송 완료: %s (%d건)", subscriber.email, len(unique_notices))
            except Exception:
                logger.exception("발송 실패: %s", subscriber.email)


def _job():
    asyncio.run(_collect_and_send())


def run_scheduler():
    schedule.every().day.at("08:00").do(_job)
    logger.info("스케줄러 시작 — 매일 08:00 KST 발송")

    while True:
        schedule.run_pending()
        time.sleep(60)
