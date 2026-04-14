export interface Env {
  DB: D1Database;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // GET /api/utm — 전체 목록 조회
    if (method === 'GET' && path === '/api/utm') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM utm_entries ORDER BY id DESC'
      ).all();
      return json(results);
    }

    // POST /api/utm — 새 기록 저장
    if (method === 'POST' && path === '/api/utm') {
      let body: { base?: string; source?: string; campaign?: string; content?: string; url?: string };
      try {
        body = await request.json();
      } catch {
        return err('Invalid JSON');
      }

      const { base, source, campaign, content, url: finalUrl } = body;
      if (!base || !source || !campaign || !content || !finalUrl) {
        return err('base, source, campaign, content, url 은 필수입니다.');
      }

      const result = await env.DB.prepare(
        'INSERT INTO utm_entries (base, source, campaign, content, url) VALUES (?, ?, ?, ?, ?) RETURNING *'
      )
        .bind(base, source, campaign, content, finalUrl)
        .first();

      return json(result, 201);
    }

    // DELETE /api/utm/:id — 단건 삭제
    const singleMatch = path.match(/^\/api\/utm\/(\d+)$/);
    if (method === 'DELETE' && singleMatch) {
      const id = Number(singleMatch[1]);
      const { success, meta } = await env.DB.prepare(
        'DELETE FROM utm_entries WHERE id = ?'
      )
        .bind(id)
        .run();

      if (!success || meta.changes === 0) return err('Not found', 404);
      return json({ deleted: id });
    }

    // DELETE /api/utm — 전체 삭제
    if (method === 'DELETE' && path === '/api/utm') {
      await env.DB.prepare('DELETE FROM utm_entries').run();
      return json({ deleted: 'all' });
    }

    return err('Not found', 404);
  },
} satisfies ExportedHandler<Env>;
