# 메일 구독 서비스 통합 계획

> mail-frontend(신규 UI) + backend(기존 Python FastAPI) 조합으로 통합.
> mail-worker(Cloudflare Worker 중복)는 삭제.

## 1. mail-frontend — 에러 키 수정
- `SubscriptionForm.tsx:51,83` — `err.error` → `err.detail`
- `UnsubscribePage.tsx:24` — `body.error` → `body.detail`

## 2. backend — 기존 Python 스택 확장

### DB (Alembic 0002)
- `auth_codes` 테이블 추가 (email PK, code TEXT, expires_at TIMESTAMP)
- `subscribers.unsub_token` 칼럼 추가 (TEXT, nullable → 기존 행 호환)

### 라우터
- `POST /auth/request-code` 신규 — 6자리 코드 생성, DB 저장, Gmail SMTP 발송
- `POST /subscriptions` 수정 — `auth_code` 검증 추가, unsub_token 자동 생성
- `GET /unsubscribe?token=` 신규 — 토큰 기반 구독 해지

### SendMail.py
- `send_auth_code(to, code)` 함수 추가

### scheuler.py
- 08:00 KST 스케줄
- 구독자 조회 → 카테고리별 크롤링 → email_template.py HTML → 매칭 발송
- notices 테이블로 중복 방지

## 3. frontend/src/App.tsx — 깨진 import 수정
- `EmailSubscriptionForm` import + 모달 제거
- `📧 구독` 버튼을 ssu-mails.pages.dev 외부 링크로 교체

## 4. mail-worker/ 삭제
- 디렉토리 전체 제거 (git rm)
