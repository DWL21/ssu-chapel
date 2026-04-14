# rusaint WASM Cloudflare Worker 구현 문서

## 개요

SSU u-saint 시스템의 채플 정보를 조회하는 Cloudflare Worker.
[DWL21/rusaint](https://github.com/DWL21/rusaint) Rust 라이브러리를 WASM으로 컴파일하여 Cloudflare Worker 환경에서 실행한다.

## 프로젝트 구조

```
ssu-chapel/
├── rusaint/                         # DWL21/rusaint 클론 + WASM 패치
│   ├── Cargo.toml                   # workspace (wdpe 로컬 포크 포함)
│   ├── rust-toolchain.toml
│   └── packages/
│       ├── rusaint/                  # 코어 라이브러리 (WASM 패치 적용)
│       │   ├── Cargo.toml           # 플랫폼별 조건부 의존성
│       │   └── src/
│       │       ├── session.rs       # WASM용 쿠키 관리 재구현
│       │       ├── client.rs        # WasmCookieClient 래퍼
│       │       ├── utils.rs         # 헤더 WASM 분기
│       │       └── lib.rs           # 테스트 모듈 cfg 게이트
│       ├── rusaint-cli/             # CLI 도구
│       ├── rusaint-ffi/             # UniFFI 바인딩
│       ├── wdpe/                    # WebDynpro Parse Engine (로컬 포크)
│       │   ├── Cargo.toml           # reqwest WASM 분기
│       │   ├── src/requests.rs      # Send 바운드 제거 (WASM)
│       │   └── wdpe-macros/         # 프로시저 매크로
│       └── ...
└── rusaint-wasm/                    # Cloudflare Worker 프로젝트
    ├── Cargo.toml
    ├── wrangler.toml
    ├── package.json
    └── src/lib.rs                   # Worker 진입점 + Swagger UI
```

## API 엔드포인트

### `POST /chapel` - 채플 정보 조회

SSO 인증 후 해당 학기의 채플 정보를 JSON으로 반환한다.

**Request:**
```json
{
  "id": "20211234",
  "password": "mypassword",
  "year": 2026,
  "semester": "1"
}
```

- `semester`: `"1"`, `"2"`, `"summer"`, `"winter"`

**Response (200):**
```json
{
  "year": 2026,
  "semester": "One",
  "general_information": {
    "division": 2150101507,
    "chapel_time": "수 10:30-11:20 (08110-반광준)",
    "chapel_room": "한경직기념관 08110",
    "floor_level": 2,
    "seat_number": "G - 8 - 2",
    "absence_time": 0,
    "result": "P",
    "note": ""
  },
  "attendances": [
    {
      "division": 2150101507,
      "class_date": "2026.03.11",
      "category": "메시지 채플",
      "instructor": "반광준",
      "instructor_department": "교목실",
      "title": "...",
      "attendance": "출석",
      "result": "높음",
      "note": ""
    }
  ],
  "absence_requests": []
}
```

**에러 응답:**
| 상태 코드 | 설명 |
|-----------|------|
| 400 | 잘못된 요청 (JSON 파싱 실패, 유효하지 않은 semester) |
| 401 | SSO 인증 실패 |
| 500 | 서버 오류 (채플 앱 초기화 실패, 데이터 조회 실패) |

### `GET /docs` - Swagger UI

브라우저에서 접속하면 Swagger UI로 API 문서를 확인하고 테스트할 수 있다.

### `GET /openapi.json` - OpenAPI 스펙

OpenAPI 3.0.3 형식의 API 명세를 JSON으로 반환한다.

## WASM 컴파일을 위한 핵심 패치

rusaint 라이브러리는 네이티브 환경을 전제로 작성되어 WASM으로 컴파일하기 위해 다음 패치가 필요했다.

### 1. 쿠키 관리 재구현 (`session.rs`)

**문제:** `cookie_store`, `reqwest_cookie_store`가 `std::time::SystemTime`을 사용하여 WASM에서 컴파일 불가.

**해결:** WASM 전용 `USaintSession` 구현.
- `CookieStoreRwLock` 대신 `RwLock<HashMap<String, HashMap<String, String>>>` 사용 (도메인 → 쿠키맵)
- `store_cookies_from_headers()`: Set-Cookie 헤더 수동 파싱
- `cookie_header_for_url()`: URL에 맞는 쿠키를 Cookie 헤더 문자열로 조합
- `obtain_ssu_sso_token()`: SSO 로그인 시 쿠키를 수동으로 추적

```rust
#[cfg(target_arch = "wasm32")]
mod wasm {
    pub struct USaintSession {
        cookies: RwLock<HashMap<String, HashMap<String, String>>>,
    }
}

#[cfg(not(target_arch = "wasm32"))]
mod native {
    pub struct USaintSession(CookieStoreRwLock);
}
```

### 2. HTTP 클라이언트 래퍼 (`client.rs`)

**문제:** WASM에서 `reqwest::Client`가 `cookie_provider()`를 지원하지 않아 쿠키가 자동 전달되지 않음.

**해결:** `WasmCookieClient` 래퍼 구현.
- 매 요청 시 세션에서 쿠키를 꺼내 `Cookie` 헤더에 수동 삽입
- 응답의 `Set-Cookie` 헤더를 파싱하여 세션에 저장
- `WebDynproRequests` 트레이트를 구현하여 기존 코드와 호환

```rust
#[cfg(target_arch = "wasm32")]
pub struct WasmCookieClient {
    pub client: reqwest::Client,
    pub session: Arc<USaintSession>,
}

impl WebDynproRequests for WasmCookieClient {
    async fn navigate(&self, ...) -> Result<Body, ClientError> { ... }
    async fn send_events(&self, ...) -> Result<BodyUpdate, ClientError> { ... }
}
```

### 3. reqwest 기능 분기 (Cargo.toml)

**문제:** reqwest의 `cookies`, `rustls`, `http2`, `gzip`, `brotli`, `form` 기능은 WASM에서 사용 불가.

**해결:** 플랫폼별 조건부 의존성 설정.

```toml
# rusaint/packages/rusaint/Cargo.toml
[target.'cfg(not(target_arch = "wasm32"))'.dependencies]
reqwest = { version = "0.13.2", features = ["charset","http2","rustls","cookies","gzip","brotli"] }
reqwest_cookie_store = { version = "0.10.0", features = ["serde"], optional = true }
cookie_store = { version = "0.22", optional = true }

[target.'cfg(target_arch = "wasm32")'.dependencies]
reqwest = { version = "0.13.2", default-features = false, features = ["json"] }
```

```toml
# rusaint/packages/wdpe/Cargo.toml
[target.'cfg(not(target_arch = "wasm32"))'.dependencies]
reqwest = { version = "0.13", features = ["charset","http2","rustls","cookies","gzip","brotli","form"], optional = true }

[target.'cfg(target_arch = "wasm32")'.dependencies]
reqwest = { version = "0.13", default-features = false, features = ["json"], optional = true }
```

### 4. Send 바운드 제거 (`requests.rs`)

**문제:** WASM의 `reqwest::Response`는 `Send`를 구현하지 않아 async 트레이트에서 `+ Send` 바운드 위반.

**해결:** `WebDynproRequests` 트레이트를 플랫폼별로 이중 정의.

```rust
#[cfg(not(target_arch = "wasm32"))]
pub trait WebDynproRequests {
    fn navigate(...) -> impl Future<...> + Send;
    fn send_events(...) -> impl Future<...> + Send;
}

#[cfg(target_arch = "wasm32")]
pub trait WebDynproRequests {
    fn navigate(...) -> impl Future<...>;  // Send 없음
    fn send_events(...) -> impl Future<...>;
}
```

### 5. form 인코딩 수동 구현 (`requests/reqwest.rs`)

**문제:** reqwest의 `.form()` 메서드는 WASM에서 사용 불가 (`form` feature 미지원).

**해결:** `url::form_urlencoded::byte_serialize`를 사용하여 수동 인코딩 후 `.body()`로 전송.

### 6. ozra 의존성 격리

**문제:** `ozra` 크레이트가 WASM 미지원 의존성을 가짐.

**해결:** `ozra-support` feature로 분리하고, 관련 코드를 `#[cfg(feature = "ozra-support")]`로 게이트.

**영향 받는 파일:**
- `application/utils/oz.rs`
- `application/course_grades.rs` / `model.rs`
- `application/course_schedule.rs` / `model/syllabus.rs`

### 7. 기타 패치

| 파일 | 변경 내용 |
|------|----------|
| `rusaint/Cargo.toml` | workspace에 wdpe 추가, tokio `default-features = false` |
| `rusaint/packages/rusaint/src/utils.rs` | WASM에서 `ACCEPT_ENCODING`, `CONNECTION` 헤더 제거 |
| `rusaint/packages/rusaint/src/lib.rs` | 테스트 유틸 모듈을 `#[cfg(all(test, not(target_arch = "wasm32")))]`로 게이트 |

## 수정된 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `rusaint/Cargo.toml` | workspace members, tokio default-features |
| `rusaint/packages/rusaint/Cargo.toml` | features 추가, 조건부 의존성 |
| `rusaint/packages/rusaint/src/session.rs` | WASM용 쿠키 관리 전면 재구현 |
| `rusaint/packages/rusaint/src/client.rs` | WasmCookieClient 래퍼 추가 |
| `rusaint/packages/rusaint/src/utils.rs` | 헤더 WASM 분기 |
| `rusaint/packages/rusaint/src/lib.rs` | 테스트 모듈 cfg 게이트 |
| `rusaint/packages/rusaint/src/application/course_grades.rs` | ozra cfg 게이트 |
| `rusaint/packages/rusaint/src/application/course_grades/model.rs` | ozra cfg 게이트 |
| `rusaint/packages/rusaint/src/application/course_schedule.rs` | ozra cfg 게이트 |
| `rusaint/packages/rusaint/src/application/course_schedule/model/syllabus.rs` | ozra cfg 게이트 |
| `rusaint/packages/wdpe/Cargo.toml` | reqwest WASM 분기, workspace 제거 |
| `rusaint/packages/wdpe/src/requests.rs` | Send 바운드 조건부 제거 |
| `rusaint/packages/wdpe/src/requests/reqwest.rs` | form 수동 인코딩 |
| `rusaint-wasm/Cargo.toml` | 신규 |
| `rusaint-wasm/wrangler.toml` | 신규 |
| `rusaint-wasm/package.json` | 신규 |
| `rusaint-wasm/src/lib.rs` | 신규 |

## 빌드 및 배포

### 사전 요구사항

```bash
# rustup wasm32 타겟 설치
rustup target add wasm32-unknown-unknown

# worker-build 설치
cargo install worker-build

# wrangler 설치
npm install -g wrangler
```

### 로컬 개발

```bash
cd rusaint-wasm
npm install
npx wrangler dev
```

### WASM 컴파일 확인

```bash
# PATH에 rustup의 cargo/rustc가 우선하도록 설정 필요
# (Homebrew Rust가 설치된 경우 wasm32 타겟이 없어 충돌)
PATH="$HOME/.cargo/bin:$PATH" cargo check --target wasm32-unknown-unknown
```

### 배포

```bash
cd rusaint-wasm
npx wrangler deploy
```

## 알려진 주의사항

1. **Homebrew Rust vs rustup 충돌**: macOS에서 Homebrew로 Rust를 설치한 경우, `rustc`가 `/opt/homebrew/bin/rustc`를 우선 사용하여 wasm32 타겟을 찾지 못할 수 있다. `wrangler.toml`의 build command에서 `PATH="$HOME/.cargo/bin:$PATH"`로 해결.

2. **Raw string 리터럴**: OpenAPI JSON에 `"#/components/schemas/..."`가 포함되어 있어 `r#"..."#` 대신 `r##"..."##` (이중 해시) 사용.

3. **네이티브 빌드 호환성**: 모든 WASM 패치는 `#[cfg(target_arch = "wasm32")]`로 게이트되어 네이티브 빌드에 영향을 주지 않는다.
