import type { Env } from './types';
import { handleCron } from './cron';
import { sendAuthCode } from './mailer';
import { fetchNotices } from './scraper';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default {
  // ───── HTTP 라우터 ─────
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // POST /auth/request-code — 이메일 인증번호 발송
    if (method === 'POST' && pathname === '/auth/request-code') {
      let body: { email?: string };
      try {
        body = await request.json();
      } catch {
        return err('Invalid JSON');
      }

      const email = body.email?.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return err('유효하지 않은 이메일 형식입니다.');
      }

      // 발송 제한: 1분 이내 재발송 방지
      const existing = await env.DB
        .prepare('SELECT expires_at FROM auth_codes WHERE email = ?')
        .bind(email)
        .first<{ expires_at: number }>();

      const now = Date.now();
      if (existing && existing.expires_at - now > 9 * 60 * 1000) {
        return err('인증번호를 이미 발송했습니다. 1분 후 다시 시도해주세요.', 429);
      }

      const code = randomCode();
      const expiresAt = now + 10 * 60 * 1000; // 10분

      await env.DB
        .prepare('INSERT OR REPLACE INTO auth_codes (email, code, expires_at) VALUES (?, ?, ?)')
        .bind(email, code, expiresAt)
        .run();

      const isDev = env.DEV_MODE === 'true';

      if (isDev) {
        // 로컬 개발: MailChannels 대신 콘솔 출력 + 응답에 코드 포함
        console.log(`\n[DEV] 인증번호 (${email}): ${code}\n`);
        return json({ ok: true, dev_code: code });
      }

      const sent = await sendAuthCode(email, code, env.MAIL_FROM, env.MAIL_FROM_NAME, env.RESEND_API_KEY);
      if (!sent) {
        return err('이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.', 502);
      }

      return json({ ok: true });
    }

    // POST /subscriptions — 인증 확인 후 구독 등록
    if (method === 'POST' && pathname === '/subscriptions') {
      let body: { email?: string; categories?: string[]; auth_code?: string };
      try {
        body = await request.json();
      } catch {
        return err('Invalid JSON');
      }

      const email = body.email?.trim().toLowerCase();
      const categories = body.categories;
      const authCode = body.auth_code?.trim();

      if (!email || !categories?.length || !authCode) {
        return err('email, categories, auth_code 필드가 필요합니다.');
      }

      // 인증코드 검증
      const row = await env.DB
        .prepare('SELECT code, expires_at FROM auth_codes WHERE email = ?')
        .bind(email)
        .first<{ code: string; expires_at: number }>();

      if (!row) return err('인증번호를 먼저 요청해주세요.', 400);
      if (Date.now() > row.expires_at) return err('인증번호가 만료되었습니다.', 400);
      if (row.code !== authCode) return err('인증번호가 올바르지 않습니다.', 400);

      // 구독 저장
      const token = randomToken();
      await env.DB
        .prepare(
          'INSERT OR REPLACE INTO subscribers (email, categories, unsub_token) VALUES (?, ?, ?)',
        )
        .bind(email, JSON.stringify(categories), token)
        .run();

      // 사용한 코드 삭제
      await env.DB.prepare('DELETE FROM auth_codes WHERE email = ?').bind(email).run();

      return json({ ok: true });
    }

    // GET /unsubscribe?token=... — 구독 해지
    if (method === 'GET' && pathname === '/unsubscribe') {
      const token = url.searchParams.get('token');
      if (!token) return err('token 파라미터가 필요합니다.');

      const row = await env.DB
        .prepare('SELECT email FROM subscribers WHERE unsub_token = ?')
        .bind(token)
        .first<{ email: string }>();

      if (!row) return err('유효하지 않거나 이미 해지된 토큰입니다.', 404);

      await env.DB
        .prepare('DELETE FROM subscribers WHERE unsub_token = ?')
        .bind(token)
        .run();

      return json({ ok: true, email: row.email });
    }

    // GET /health
    if (method === 'GET' && pathname === '/health') {
      return json({ ok: true, ts: new Date().toISOString() });
    }

    // GET /admin/test-scraper?secret=... — 스크래퍼 결과 확인
    if (method === 'GET' && pathname === '/admin/test-scraper') {
      const secret = url.searchParams.get('secret');
      if (!secret || secret !== env.ADMIN_SECRET) return err('Unauthorized', 401);
      const notices = await fetchNotices(env.SCATCH_BASE, ['전체']);
      return json({ count: notices.length, sample: notices.slice(0, 3) });
    }

    // POST /admin/run-cron?secret=... — 수동 Cron 트리거
    if (method === 'POST' && pathname === '/admin/run-cron') {
      const secret = url.searchParams.get('secret');
      if (!secret || secret !== env.ADMIN_SECRET) {
        return err('Unauthorized', 401);
      }
      await handleCron(env);
      return json({ ok: true, message: 'Cron 실행 완료' });
    }

    return err('Not Found', 404);
  },

  // ───── Cron 핸들러 ─────
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleCron(env));
  },
} satisfies ExportedHandler<Env>;
