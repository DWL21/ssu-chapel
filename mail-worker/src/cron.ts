import type { Env, Notice, Subscriber } from './types';
import { fetchNotices } from './scraper';
import { sendDigest } from './mailer';

// 오늘 날짜 문자열 (KST 기준)
function todayKST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '.');
}

// 만료된 auth_codes 삭제 (매 Cron마다 정리)
async function cleanExpiredCodes(db: D1Database) {
  await db.prepare('DELETE FROM auth_codes WHERE expires_at < ?').bind(Date.now()).run();
}

// D1에서 아직 발송 안 한 신규 공지 필터링 + 저장
async function filterNew(db: D1Database, notices: Notice[]): Promise<Notice[]> {
  const fresh: Notice[] = [];

  for (const notice of notices) {
    const existing = await db
      .prepare('SELECT notice_id FROM seen_notices WHERE notice_id = ?')
      .bind(notice.noticeId)
      .first<{ notice_id: string }>();

    if (!existing) {
      fresh.push(notice);
      await db
        .prepare(
          'INSERT INTO seen_notices (notice_id, category, title, url, posted_at) VALUES (?, ?, ?, ?, ?)',
        )
        .bind(notice.noticeId, notice.category, notice.title, notice.url, notice.postedAt)
        .run();
    }
  }

  return fresh;
}

// 구독자 조회
async function getSubscribers(db: D1Database): Promise<Subscriber[]> {
  const { results } = await db
    .prepare('SELECT email, categories, unsub_token FROM subscribers')
    .all<{ email: string; categories: string; unsub_token: string }>();

  return results.map((row) => ({
    email: row.email,
    categories: JSON.parse(row.categories) as string[],
    unsubToken: row.unsub_token,
  }));
}

// 공지를 구독자의 카테고리에 맞게 필터
function filterForSubscriber(notices: Notice[], subscriber: Subscriber): Notice[] {
  const cats = subscriber.categories;
  if (cats.includes('전체')) return notices;
  return notices.filter((n) => cats.includes(n.category));
}

// Cron 핸들러 — wrangler.toml crons = ["0 23 * * *"] (08:00 KST)
export async function handleCron(env: Env): Promise<void> {
  await cleanExpiredCodes(env.DB);

  // 1. 모든 고유 카테고리 수집
  const subscribers = await getSubscribers(env.DB);
  if (subscribers.length === 0) return;

  const allCats = [...new Set(subscribers.flatMap((s) => s.categories))];
  const categoriesToFetch = allCats.includes('전체')
    ? Object.keys({ 학사: 1, 장학: 1, 국제교류: 1, 외국인유학생: 1, 채용: 1, '비교과·행사': 1, 교원채용: 1, 교직: 1, 봉사: 1, 기타: 1 })
    : allCats;

  // 2. 스크래핑
  const raw = await fetchNotices(env.SCATCH_BASE, categoriesToFetch);

  // 3. 신규 공지만 필터 (seen_notices 대비)
  const fresh = await filterNew(env.DB, raw);
  if (fresh.length === 0) return; // 신규 없으면 메일 발송 안 함

  const date = todayKST();

  // 4. 구독자별 발송
  await Promise.allSettled(
    subscribers.map(async (sub) => {
      const subNotices = filterForSubscriber(fresh, sub);
      if (subNotices.length === 0) return;

      const unsubUrl = `${env.FRONTEND_ORIGIN}/?unsubscribe=${sub.unsubToken}`;

      await sendDigest({
        to: sub.email,
        fromEmail: env.MAIL_FROM,
        fromName: env.MAIL_FROM_NAME,
        notices: subNotices,
        unsubUrl,
        date,
        apiKey: env.RESEND_API_KEY,
      });
    }),
  );
}
