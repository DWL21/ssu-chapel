-- 구독자 테이블
CREATE TABLE IF NOT EXISTS subscribers (
  email       TEXT    PRIMARY KEY,
  categories  TEXT    NOT NULL,  -- JSON array: ["학사","채용"]
  unsub_token TEXT    NOT NULL,  -- 해지 링크용 무작위 토큰
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 이메일 인증 코드 (TTL: 10분)
CREATE TABLE IF NOT EXISTS auth_codes (
  email      TEXT    PRIMARY KEY,
  code       TEXT    NOT NULL,
  expires_at INTEGER NOT NULL
);

-- 이미 발송된 공지 (중복 발송 방지)
CREATE TABLE IF NOT EXISTS seen_notices (
  notice_id  TEXT    PRIMARY KEY,  -- URL 기반 고유 ID
  category   TEXT    NOT NULL,
  title      TEXT    NOT NULL,
  url        TEXT    NOT NULL,
  posted_at  TEXT    NOT NULL,
  first_seen INTEGER NOT NULL DEFAULT (unixepoch())
);
