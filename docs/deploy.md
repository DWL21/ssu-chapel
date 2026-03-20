# rusaint-wasm 배포 가이드

## 배포 방식

**Cloudflare Git 연동 (자동 배포)** 방식을 사용한다.
`main` 브랜치에 push하면 Cloudflare가 자동으로 빌드 및 배포한다.

## 배포 흐름

```
Git push → Cloudflare 빌드 서버 → Rust 설치 → WASM 컴파일 → Worker 배포
```

## Cloudflare 대시보드 설정

| 항목 | 값 |
|------|-----|
| Git 리포지토리 | `DWL21/db-26-1` |
| 루트 디렉터리 | `/rusaint-wasm` |
| 빌드 명령 | `npx wrangler deploy` |
| 프로덕션 분기 | `main` |

빌드 시 `wrangler.toml`의 `[build].command`가 실행되어 Rust 설치, `worker-build` 설치, WASM 컴파일을 자동으로 수행한다.

## 배포 방법

### 자동 배포 (권장)

```bash
git add .
git commit -m "변경 내용"
git push origin main
```

push 후 Cloudflare 대시보드에서 빌드 로그를 확인할 수 있다.
첫 빌드는 Rust 설치로 인해 5~10분 소요, 이후 캐시로 단축된다.

### 로컬 배포

Cloudflare 자동 배포를 사용하지 않고 로컬에서 직접 배포할 수도 있다.

```bash
cd rusaint-wasm
npx wrangler login    # 최초 1회
npx wrangler deploy
```

## 로컬 개발

```bash
cd rusaint-wasm
npm install
npx wrangler dev
```

`http://localhost:8787`에서 테스트 가능.

- `GET /docs` - Swagger UI
- `GET /openapi.json` - API 명세
- `POST /chapel` - 채플 정보 조회

## 사전 요구사항 (로컬)

```bash
rustup target add wasm32-unknown-unknown
cargo install worker-build
npm install -g wrangler
```
