# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

SSU(숭실대학교) u-saint 시스템의 채플 정보를 조회하는 웹 서비스. Rust 라이브러리를 WASM으로 컴파일하여 Cloudflare Worker에서 실행하고, React 프론트엔드에서 채플 출석/좌석 정보를 시각화한다.

## 디렉토리 구조

```
ssu-chapel/
├── frontend/          # React + TypeScript + Vite SPA (Cloudflare Pages)
├── rusaint-wasm/      # Cloudflare Worker (Rust→WASM) — API 서버
├── rusaint/           # DWL21/rusaint 포크 — SSU u-saint 스크래퍼 라이브러리
├── utm/               # UTM 링크 생성기 (Cloudflare Worker + D1)
├── nginx/             # 로컬 Docker 환경용 리버스 프록시
└── docker-compose.yml # 로컬 개발 스택 (worker + redis + webdis + nginx)
```

## 주요 명령어

### Frontend (`frontend/`)
```bash
npm run dev        # Vite 개발 서버 (localhost:5173)
npm run build      # TypeScript 컴파일 + Vite 번들
npm run lint       # ESLint
npm run deploy     # Cloudflare Pages 배포
```

### rusaint-wasm Worker (`rusaint-wasm/`)
```bash
npm run dev        # wrangler dev (로컬 Worker)
npm run deploy     # Cloudflare Workers 배포
```

WASM 컴파일 확인:
```bash
PATH="$HOME/.cargo/bin:$PATH" cargo check --target wasm32-unknown-unknown
```

### UTM Worker (`utm/worker/`)
```bash
npm run dev            # wrangler dev
npm run deploy         # 배포
npm run db:init        # 로컬 D1 DB 초기화
npm run db:init:remote # 원격 D1 DB 초기화
```

### Docker (로컬 전체 스택)
```bash
docker compose up           # 전체 스택 실행
docker compose build worker # worker 이미지 빌드
```

### 사전 요구사항 (rusaint-wasm 빌드)
```bash
rustup target add wasm32-unknown-unknown
cargo install worker-build
npm install -g wrangler
```

## 아키텍처

### 데이터 흐름

```
User Browser
  → Frontend SPA (React, Cloudflare Pages)
    → POST /auth/token  → rusaint-wasm Worker
    → POST /chapel      → rusaint-wasm Worker
                              → rusaint 라이브러리 (WASM)
                                  → SSU u-saint (웹 스크래핑)
                              → 캐시 (Docker: Redis+Webdis / Prod: Cloudflare KV)
```

### rusaint-wasm API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/auth/token` | SSO 로그인, 토큰 캐시 |
| `POST` | `/chapel` | 채플 정보 조회 (token + year + semester) |
| `POST` | `/auth/logout` | 캐시 무효화 |
| `GET`  | `/docs` | Swagger UI |
| `GET`  | `/openapi.json` | OpenAPI 3.0.3 명세 |

`semester` 값: `"1"`, `"2"`, `"summer"`, `"winter"`

### 캐시 전략

rusaint-wasm은 환경 변수 `WEBDIS_URL` 존재 여부에 따라 캐시 백엔드를 결정한다:
- 로컬(Docker): `WEBDIS_URL` → Redis + Webdis HTTP API
- 프로덕션(Cloudflare): `WEBDIS_URL` 없음 → Cloudflare KV

### Frontend 구조

`frontend/src/App.tsx` 단일 컴포넌트(~700줄)에 인증, 채플 데이터 조회, 좌석 시각화, QR 포스터 생성이 모두 포함되어 있다. 컴포넌트 분리가 되어 있지 않다.

## WASM 패치 핵심 사항

`rusaint` 라이브러리는 네이티브 환경 전제로 작성되어 WASM 컴파일을 위해 다음 패치가 적용되어 있다 (모두 `#[cfg(target_arch = "wasm32")]`로 게이트):

1. **쿠키 관리** (`rusaint/packages/rusaint/src/session.rs`): `cookie_store`가 WASM 미지원으로 `HashMap<String, HashMap<String, String>>` 기반 수동 구현으로 대체
2. **HTTP 클라이언트** (`rusaint/packages/rusaint/src/client.rs`): `WasmCookieClient` 래퍼로 쿠키 헤더 수동 삽입/파싱
3. **reqwest 기능 분기**: `cookies`, `rustls`, `http2`, `gzip`, `brotli`, `form` feature는 WASM에서 제외 (`Cargo.toml`의 `cfg` 조건부 의존성)
4. **Send 바운드 제거** (`rusaint/packages/wdpe/src/requests.rs`): WASM의 `reqwest::Response`는 `Send` 미구현으로 트레이트 이중 정의
5. **form 인코딩** (`rusaint/packages/wdpe/src/requests/reqwest.rs`): `.form()` 대신 `url::form_urlencoded`로 수동 인코딩

## 알려진 주의사항

- **macOS Homebrew Rust**: `wrangler.toml` build command에 `PATH="$HOME/.cargo/bin:$PATH"` 필요 (wasm32 타겟 미지원 rustc 충돌)
- **OpenAPI raw string**: `r##"..."##` (이중 해시) 사용 — JSON 내 `#/components/schemas/` 때문
- **backend/ 디렉토리**: 현재 비어 있음 (`.gitkeep`만 존재)
