import asyncio
import logging
from datetime import date, datetime, timezone, timedelta

import schedule
import time
from sqlalchemy import select, delete

from app.database import AsyncSessionLocal
from app.models.notice import Notice
from app.models.subscription import Subscriber, Subscription
from app.services.notice_collector import fetch_notices_from_crawler
from app.email_template import build_email_html
from app.SendMail import send_email_with_retry

logger = logging.getLogger(__name__)

ALL_CATEGORIES = [
    "전체", "학사", "장학", "국제교류", "외국인유학생",
    "채용", "비교과·행사", "교원채용", "교직", "봉사", "기타",
]


async def _fetch_by_categories(categories: set[str]) -> tuple[dict[str, list[dict]], set[str]]:
    """카테고리별 크롤링. 반환: (category→notices 맵, 실패한 카테고리 집합)"""
    category_raw: dict[str, list[dict]] = {}
    failed: set[str] = set()
    for cat in categories:
        cat_param = "" if cat == "전체" else cat
        try:
            category_raw[cat] = await fetch_notices_from_crawler(page=1, category=cat_param)
        except Exception:
            logger.exception("크롤링 실패: %s", cat)
            failed.add(cat)
    return category_raw, failed


async def _existing_links(db) -> set[str]:
    result = await db.execute(select(Notice.link))
    return set(result.scalars().all())


async def _record_new_links(db, links: set[str]) -> None:
    for link in links:
        db.add(Notice(link=link))
    await db.commit()


async def _collect_and_send():
    async with AsyncSessionLocal() as db:
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
                subscriber_map[subscriber.id] = {"subscriber": subscriber, "categories": set()}
            subscriber_map[subscriber.id]["categories"].add(category)
            all_categories.add(category)

        category_raw, failed_categories = await _fetch_by_categories(all_categories)

        if not category_raw:
            logger.info("크롤링 가능한 카테고리 없음, 발송 스킵")
            return

        existing_links = await _existing_links(db)

        new_by_category: dict[str, list[dict]] = {}
        for cat, notices in category_raw.items():
            new_by_category[cat] = [
                n for n in notices
                if n.get("link") and n["link"] not in existing_links
            ]

        today = date.today()
        sent_link_pool: set[str] = set()

        for sid, info in subscriber_map.items():
            subscriber = info["subscriber"]
            cats = info["categories"]

            if cats & failed_categories:
                logger.info("실패 카테고리 구독으로 이번 회차 스킵: %s", subscriber.email)
                continue

            matched: list[dict] = []
            seen: set[str] = set()
            for cat in cats:
                for n in new_by_category.get(cat, []):
                    link = n.get("link")
                    if link and link not in seen:
                        seen.add(link)
                        matched.append(n)

            if not matched:
                continue

            html = build_email_html(matched, target_date=today, unsub_token=subscriber.unsub_token)
            subject = f"숭실대 공지사항 ({today.strftime('%Y.%m.%d')}) — {len(matched)}건"

            try:
                send_email_with_retry(subscriber.email, subject, html_body=html)
                sent_link_pool |= seen
                logger.info("발송 완료: %s (%d건)", subscriber.email, len(matched))
            except Exception:
                logger.exception("발송 실패: %s", subscriber.email)

        if sent_link_pool:
            await _record_new_links(db, sent_link_pool)


async def _cleanup_old_records():
    """60일 초과 notices 레코드 삭제"""
    cutoff = datetime.now(timezone.utc) - timedelta(days=60)
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            delete(Notice).where(Notice.created_at < cutoff)
        )
        await db.commit()
        deleted = result.rowcount
        if deleted:
            logger.info("cleanup: %d개 오래된 공지 기록 삭제", deleted)


async def seed_existing_notices() -> None:
    """부팅 시 1회 — 현재 구독 카테고리 page=1 링크를 notices 에 사전 저장.
    첫 cron 시점의 누적분 폭주 발송을 차단한다. 메일 발송은 하지 않는다."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Subscription.category).distinct())
        all_categories = set(result.scalars().all())

        if not all_categories:
            logger.info("seed: 구독 카테고리 없음")
            return

        category_raw, _ = await _fetch_by_categories(all_categories)

        existing_links = await _existing_links(db)
        new_links: set[str] = set()
        for notices in category_raw.values():
            for n in notices:
                link = n.get("link")
                if link and link not in existing_links and link not in new_links:
                    new_links.add(link)

        if new_links:
            await _record_new_links(db, new_links)
        logger.info("seed 완료: %d 링크 사전 저장", len(new_links))


async def _fetch_notices_for_categories(categories: set[str]) -> list[dict]:
    """카테고리별 크롤링 후 링크 기준 중복 제거하여 반환."""
    seen: set[str] = set()
    result: list[dict] = []
    for cat in categories:
        cat_param = "" if cat == "전체" else cat
        try:
            notices = await fetch_notices_from_crawler(page=1, category=cat_param)
        except Exception:
            logger.exception("크롤링 실패: %s", cat)
            continue
        for n in notices:
            link = n.get("link")
            if link and link not in seen:
                seen.add(link)
                result.append(n)
    return result


async def _fetch_until_cutoff(
    categories: set[str], cutoff: date, max_pages: int = 5
) -> list[dict]:
    """카테고리별로 페이지를 늘려가며 게시일이 cutoff 이전인 공지를 만날 때까지 크롤링.
    카테고리당 max_pages 까지가 안전 상한. 링크 기준 중복 제거."""
    seen: set[str] = set()
    result: list[dict] = []
    for cat in categories:
        cat_param = "" if cat == "전체" else cat
        for page in range(1, max_pages + 1):
            try:
                page_notices = await fetch_notices_from_crawler(page=page, category=cat_param)
            except Exception:
                logger.exception("크롤링 실패: cat=%s page=%d", cat, page)
                break
            if not page_notices:
                break

            oldest: date | None = None
            for n in page_notices:
                link = n.get("link")
                if link and link not in seen:
                    seen.add(link)
                    result.append(n)
                try:
                    d = datetime.strptime(n.get("date", ""), "%Y.%m.%d").date()
                    if oldest is None or d < oldest:
                        oldest = d
                except (ValueError, TypeError):
                    continue

            if oldest is not None and oldest < cutoff:
                break
        else:
            logger.warning("cat=%s max_pages=%d 도달, 3일 윈도우 끝까지 못 봤을 가능성", cat, max_pages)
    return result


async def send_now_to_subscriber(subscriber_id: int, categories: set[str]) -> None:
    """구독 완료 직후 백필 발송 — 게시일 7일 이내의 공지를 모두 발송.
    발송 후 notices 에 없는 링크를 삽입하여 다음 크론의 재발송을 방지한다."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Subscriber).where(Subscriber.id == subscriber_id)
        )
        subscriber = result.scalar_one_or_none()
        if subscriber is None:
            return

    cutoff = date.today() - timedelta(days=7)
    notices = await _fetch_until_cutoff(categories, cutoff)

    def _within_window(n: dict) -> bool:
        try:
            return datetime.strptime(n.get("date", ""), "%Y.%m.%d").date() >= cutoff
        except (ValueError, TypeError):
            return False

    notices = [n for n in notices if n.get("link") and _within_window(n)]

    if not notices:
        logger.info("즉시 발송 스킵: 최근 7일 공지 없음 (%s)", subscriber.email)
        return

    today = date.today()
    html = build_email_html(notices, target_date=today, unsub_token=subscriber.unsub_token, welcome=True)
    subject = f"숭실대 공지사항 구독 완료 ({today.strftime('%Y.%m.%d')}) — {len(notices)}건"

    try:
        send_email_with_retry(subscriber.email, subject, html_body=html)
        logger.info("즉시 발송 완료: %s (%d건)", subscriber.email, len(notices))
    except Exception:
        logger.exception("즉시 발송 실패: %s", subscriber.email)
        return

    sent_links = {n["link"] for n in notices}
    async with AsyncSessionLocal() as db:
        existing = await _existing_links(db)
        new_links = sent_links - existing
        if new_links:
            await _record_new_links(db, new_links)


async def resend_today_to_all() -> int:
    """모든 구독자에게 현재 공지사항 강제 재발송 (관리자용, 발송 이력 갱신 없음).
    반환: 발송 성공 수."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Subscriber, Subscription.category)
            .join(Subscription, Subscriber.id == Subscription.subscriber_id)
        )
        rows = result.all()

    if not rows:
        return 0

    subscriber_map: dict[int, dict] = {}
    for subscriber, category in rows:
        if subscriber.id not in subscriber_map:
            subscriber_map[subscriber.id] = {"subscriber": subscriber, "categories": set()}
        subscriber_map[subscriber.id]["categories"].add(category)

    sent = 0
    for info in subscriber_map.values():
        sub = info["subscriber"]
        notices = await _fetch_notices_for_categories(info["categories"])
        if not notices:
            continue
        today = date.today()
        html = build_email_html(notices, target_date=today, unsub_token=sub.unsub_token)
        subject = f"숭실대 공지사항 ({today.strftime('%Y.%m.%d')}) — {len(notices)}건"
        try:
            send_email_with_retry(sub.email, subject, html_body=html)
            sent += 1
            logger.info("재발송 완료: %s (%d건)", sub.email, len(notices))
        except Exception:
            logger.exception("재발송 실패: %s", sub.email)

    return sent


def _job(loop: asyncio.AbstractEventLoop):
    future = asyncio.run_coroutine_threadsafe(_collect_and_send(), loop)
    future.result()


def _cleanup_job(loop: asyncio.AbstractEventLoop):
    future = asyncio.run_coroutine_threadsafe(_cleanup_old_records(), loop)
    future.result()


def run_scheduler(loop: asyncio.AbstractEventLoop):
    schedule.every().day.at("08:00", "Asia/Seoul").do(_job, loop)
    schedule.every().monday.at("03:00", "Asia/Seoul").do(_cleanup_job, loop)
    logger.info("스케줄러 시작 — 매일 08:00 KST 발송 / 매주 월요일 03:00 KST cleanup")

    while True:
        schedule.run_pending()
        time.sleep(60)
