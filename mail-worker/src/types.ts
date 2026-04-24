export interface Env {
  DB: D1Database;
  MAIL_FROM: string;
  MAIL_FROM_NAME: string;
  FRONTEND_ORIGIN: string;
  SCATCH_BASE: string;
  DEV_MODE?: string;      // "true" 이면 이메일 대신 콘솔 출력
  RESEND_API_KEY: string;  // wrangler secret put RESEND_API_KEY
  ADMIN_SECRET: string;   // wrangler secret put ADMIN_SECRET
}

export interface Notice {
  noticeId: string; // URL slug 기반 고유 ID
  category: string;
  title: string;
  url: string;
  postedAt: string;
  department: string;
}

export interface Subscriber {
  email: string;
  categories: string[]; // JSON parse 후
  unsubToken: string;
}
