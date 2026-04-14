# Claude Code 작업 내역 — 2026-03-22

## 개요

2026년 3월 22일 Claude Code를 활용하여 수행한 프론트엔드 개선 및 인프라 변경 작업 기록.

---

## 1. 개인정보 처리 방침 추가

**변경 파일**
- `frontend/src/PrivacyPolicyModal.tsx` (신규)
- `frontend/src/App.tsx`

**내용**
- 로그인 폼 하단의 단순 안내 문구(`* 개인정보는 안전하게 보호되며...`)를 제거
- 클릭 시 모달로 전체 방침을 확인할 수 있는 `"개인정보 처리 방침에 동의합니다."` 문구로 교체
- 방침 모달 구성: 수집 항목 / 이용 목적 / 보관 및 파기 / 제3자 제공 / 이용자 권리 5개 항목

**수정 사항 (후속)**
- KV 캐시 사용 사실을 반영하여 3항(보관 및 파기) 문구 수정: 인증 토큰 및 채플 정보의 일시 캐싱 명시, 비밀번호 원문 미저장 명시
- 시행일을 2025-01-01 → 2026-03-24로 수정

---

## 2. 구역별 실제 좌석 배치 반영

**변경 파일**
- `frontend/src/App.tsx`
- `frontend/src/index.css`

**내용**
- 기존에 구역당 단일 최대 열 수(`SECTION_MAX_COLS`)로 모든 행을 동일하게 렌더링하던 방식 변경
- 이미지 파싱 및 사용자 제공 데이터를 바탕으로 `SECTION_ROW_COLS` 도입: 행별 실제 좌석 수 정의

**구역별 반영 내용 요약**

| 구역 | 총 행 수 | 특이사항 |
|------|---------|---------|
| A | 17 | 1행 5열 → 4-6행 8열(최대) → 17행 5열, 사다리꼴 |
| B | 16 | 1-3행 6열, 4-15행 7열, 16행 3열 |
| C | 15 | 1행 9열, 2-5행 10열, 6-15행 11열 |
| D | 16 | 1-3행 6열, 4-15행 7열, 16행 장애인석 |
| E | 17 | 1행 5열 → 4-6행 8열(최대) → 17행 5열 |
| F | 15 | 1-6행 8열, 7-10행 3열(출입구), 11-13행 8열, 14행 6열, 15행 5열 |
| G | 16 | 1-14행 7열, 15-16행 6열 |
| H | 16 | 전 행 9열 |
| I | 16 | 전 행 7열 |
| J | 15 | F구역과 대칭 |

- 좌석이 없는 칸: `seat-cell-void` (투명 처리)
- D구역 16행 장애인석: ♿ 라벨 별도 렌더링

---

## 3. 미지정 좌석 표시

**변경 파일**
- `frontend/src/App.tsx`

**내용**
- 로그인 성공 후 `seat_number`가 비어있거나 파싱 불가한 경우(구역 특정 불가) 좌석 UI 대신 "미지정" 안내 표시
- 기존에는 빈 UI가 렌더링되거나 `?` 등 불완전한 표시 발생

---

## 4. 프로젝트 이름 변경 (db-26-1 → ssu-chapel)

**변경 파일**

| 파일 | 변경 내용 |
|------|---------|
| `rusaint-wasm/wrangler.toml` | `name = "ssu-chapel"` |
| `frontend/package.json` | 배포 스크립트에 `--project-name ssu-chapel` 추가 |
| `frontend/.env` | Worker URL 변경 |
| `README.md` | 프로젝트 제목 변경 |
| `AGENTS.md` | 프로젝트 구조 경로 변경 |

**배포 결과**

| 서비스 | 이전 URL | 변경 후 URL |
|--------|---------|------------|
| Cloudflare Worker | `db-26-1.nggus5.workers.dev` | `ssu-chapel.nggus5.workers.dev` |
| Cloudflare Pages | `db-26-1.pages.dev` | `ssu-chapel.pages.dev` |

- Cloudflare Pages 프로젝트 신규 생성 (`wrangler pages project create ssu-chapel`)
- Worker 및 Pages 각각 재배포 완료

---

## 5. GitHub Actions 자동 배포 설정

**변경 파일**
- `.github/workflows/deploy-frontend.yml` (신규)

**내용**
- `main` 브랜치에 `frontend/**` 경로 변경 push 시 자동으로 Cloudflare Pages 배포
- `gh secret set` 으로 GitHub Secrets 3개 등록

| Secret | 설명 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Pages 배포용 API 토큰 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 ID |
| `VITE_API_BASE_URL` | Worker API 엔드포인트 URL |

**워크플로우 구성**
1. `actions/checkout@v4`
2. Node.js 20 설치 + npm 캐시
3. `npm ci` (frontend/)
4. `npm run build` (VITE_API_BASE_URL 주입)
5. `wrangler pages deploy dist --project-name ssu-chapel`
