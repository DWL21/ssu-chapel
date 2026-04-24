import type { Notice } from './types';

interface SendOptions {
  to: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  html: string;
  text: string;
  apiKey: string;
}

// Resend API로 이메일 발송
async function sendEmail(opts: SendOptions): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${opts.fromName} <${opts.fromEmail}>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[Resend] 발송 실패 ${res.status}: ${body}`);
  }

  return res.ok;
}

// 인증번호 발송
export async function sendAuthCode(
  email: string,
  code: string,
  fromEmail: string,
  fromName: string,
  apiKey: string,
): Promise<boolean> {
  const html = `
<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:2rem;background:#F1F3F7;border-radius:12px;">
  <h2 style="color:#014099;margin-bottom:0.5rem;">숭실대 공지사항 메일 구독</h2>
  <p style="color:#4b5563;margin-bottom:1.5rem;">아래 6자리 인증번호를 입력하여 구독을 완료해주세요.</p>
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:1.5rem;text-align:center;">
    <span style="font-size:2rem;font-weight:700;letter-spacing:0.5rem;color:#014099;">${code}</span>
  </div>
  <p style="color:#9ca3af;font-size:0.8rem;margin-top:1rem;">이 코드는 10분 후 만료됩니다. 본인이 요청하지 않았다면 무시해주세요.</p>
</div>`;

  const text = `숭실대 공지사항 구독 인증번호: ${code}\n\n이 코드는 10분 후 만료됩니다.`;

  return sendEmail({
    to: email,
    fromEmail,
    fromName,
    subject: `[SSU 공지] 인증번호: ${code}`,
    html,
    text,
    apiKey,
  });
}

// 공지 다이제스트 발송
export async function sendDigest(opts: {
  to: string;
  fromEmail: string;
  fromName: string;
  notices: Notice[];
  unsubUrl: string;
  date: string;
  apiKey: string;
}): Promise<boolean> {
  const { to, fromEmail, fromName, notices, unsubUrl, date, apiKey } = opts;

  const noticeRows = notices
    .map(
      (n) => `
  <tr>
    <td style="padding:0.75rem 0;border-bottom:1px solid #e5e7eb;">
      <div style="font-size:0.7rem;font-weight:700;color:#014099;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.25rem;">${n.category}</div>
      <a href="${n.url}" style="color:#1f2937;font-weight:600;text-decoration:none;font-size:0.95rem;">${n.title}</a>
      <div style="margin-top:0.2rem;font-size:0.75rem;color:#9ca3af;">${n.department ? `${n.department} · ` : ''}${n.postedAt}</div>
    </td>
  </tr>`,
    )
    .join('');

  const noticeText = notices
    .map((n) => `[${n.category}] ${n.title}\n${n.url}\n${n.postedAt}`)
    .join('\n\n');

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F3F7;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:2rem auto;">
    <tr><td>
      <div style="background:#014099;padding:1.25rem 1.5rem;border-radius:12px 12px 0 0;">
        <h1 style="color:white;font-size:1.2rem;margin:0;font-weight:700;">📧 숭실대 공지사항 요약</h1>
        <p style="color:rgba(255,255,255,0.75);font-size:0.8rem;margin:0.25rem 0 0;">${date} 기준 새 공지 ${notices.length}건</p>
      </div>
      <div style="background:#ffffff;padding:1.25rem 1.5rem;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${noticeRows || '<tr><td style="padding:1rem 0;color:#9ca3af;text-align:center;">오늘은 새 공지가 없습니다.</td></tr>'}
        </table>
        <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #f1f5f9;text-align:center;">
          <a href="${unsubUrl}" style="font-size:0.75rem;color:#9ca3af;">구독 해지</a>
          <span style="color:#e5e7eb;margin:0 0.5rem">|</span>
          <a href="https://scatch.ssu.ac.kr/공지사항/" style="font-size:0.75rem;color:#9ca3af;">전체 공지 보기</a>
        </div>
      </div>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `숭실대 공지사항 요약 (${date})\n\n${noticeText || '오늘은 새 공지가 없습니다.'}\n\n구독 해지: ${unsubUrl}`;

  return sendEmail({
    to,
    fromEmail,
    fromName,
    subject: `[SSU 공지] ${date} 새 공지 ${notices.length}건`,
    html,
    text,
    apiKey,
  });
}
