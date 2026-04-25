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

        # 2. 카테고리별 크롤링 — 성공/실패 분리 추적
        category_raw: dict[str, list[dict]] = {}
        failed_categories: set[str] = set()
        for category in all_categories:
            cat_param = "" if category == "전체" else category
            try:
                category_raw[category] = await fetch_notices_from_crawler(page=1, category=cat_param)
            except Exception:
                logger.exception("크롤링 실패: %s", category)
                failed_categories.add(category)

        if not category_raw:
            logger.info("크롤링 가능한 카테고리 없음, 발송 스킵")
            return

        # 3. 신규 링크 판정 (DB 변경은 아직 없음)
        all_links: set[str] = {
            n["link"] for notices in category_raw.values() for n in notices if n.get("link")
        }
        if not all_links:
            logger.info("크롤 결과 없음, 발송 스킵")
            return

        result = await db.execute(select(Notice.link).where(Notice.link.in_(all_links)))
        existing_links = set(result.scalars().all())
        new_links = all_links - existing_links

        if not new_links:
            logger.info("새 공지사항 없음, 발송 스킵")
            return

        # 카테고리별 신규 공지 매핑
        category_notices: dict[str, list[dict]] = {
            cat: [n for n in notices if n.get("link") and n["link"] in new_links]
            for cat, notices in category_raw.items()
        }

        # 4. 실패 카테고리에 속하는 notice의 link는 영구 저장 차단
        # — 다른 카테고리/광역 피드에서 발견되었더라도, 그 카테고리만 구독한 사용자는 받지 못했으므로
        # 다음 회차에서도 "신규"로 판정되어 재시도되어야 함
        links_blocked_by_failed_cats: set[str] = {
            n["link"]
            for notices in category_raw.values()
            for n in notices
            if n.get("link") and n.get("category") in failed_categories
        }

        # 5. 발송 대상 결정 — 실패 카테고리를 하나라도 구독한 사용자는 이번 회차 스킵
        # (그 사용자가 봤어야 할 다른 카테고리 공지도 다음 회차로 미뤄지지만,
        #  per-subscriber 발송 기록이 없는 현재 스키마에서 누락보다 중복이 안전)
        skip_subscribers: set[int] = {
            sid for sid, info in subscriber_map.items()
            if info["categories"] & failed_categories
        }

        # 6. link → 받았어야 할 sid 집합 (audience)
        link_audience: dict[str, set[int]] = {}
        for sid, info in subscriber_map.items():
            if sid in skip_subscribers:
                continue
            for cat in info["categories"]:
                for n in category_notices.get(cat, []):
                    link_audience.setdefault(n["link"], set()).add(sid)

        # 7. 발송 + 성공 sid 추적
        sent_sids: set[int] = set()
        today = date.today()
        for sid, info in subscriber_map.items():
            if sid in skip_subscribers:
                logger.info("실패 카테고리 구독으로 이번 회차 스킵: %s", info["subscriber"].email)
                continue

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
                sent_sids.add(sid)
                logger.info("발송 완료: %s (%d건)", subscriber.email, len(unique_notices))
            except Exception:
                logger.exception("발송 실패: %s", subscriber.email)

        # 8. persist — 모든 audience가 발송 성공한 link만, 그리고 실패 카테고리에 안 속하는 link만
        persistable_links = {
            link for link, audience in link_audience.items()
            if audience and audience.issubset(sent_sids)
        } - links_blocked_by_failed_cats

        if persistable_links:
            for link in persistable_links:
                db.add(Notice(link=link))
            await db.commit()
            logger.info("저장 완료: %d 링크", len(persistable_links))

        deferred = new_links - persistable_links
        if deferred:
            logger.info(
                "다음 회차로 미룸: %d 링크 (발송 실패 또는 카테고리 크롤링 실패 영향)",
                len(deferred),
            )


def _job():
    asyncio.run(_collect_and_send())


def run_scheduler():
    schedule.every().day.at("08:00").do(_job)
    logger.info("스케줄러 시작 — 매일 08:00 KST 발송")

    while True:
        schedule.run_pending()
        time.sleep(60)
