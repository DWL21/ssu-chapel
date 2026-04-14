# Claude Code 작업 내역 — 2026-03-20

## 개요

2026년 3월 20일 프로젝트 초기 구현 세션. rusaint-wasm Cloudflare Worker와 React 프론트엔드를 처음 구축한 날.

---

## 1. rusaint-wasm Cloudflare Worker 초기 구현

**관련 커밋** `a9d834c` `60cb629` `9b88495` `3c61194` `834b102`

**내용**
- `rusaint-wasm/` 프로젝트 신규 생성
  - `Cargo.toml`: rusaint 라이브러리 WASM 의존성 구성
  - `wrangler.toml`: Cloudflare Worker 배포 설정
  - `src/lib.rs`: ChapelApplication 초기 구현, `/chapel` POST 엔드포인트
- SSO 인증 처리 및 채플 정보 조회 로직 구현
- 요청 파싱, 인증 실패/학기 유효성 오류 핸들링
- WASM 바이너리 빌드 및 Worker 배포 완료
- `AGENTS.md`: rusaint WASM Cloudflare Worker 구현 문서 작성

---

## 2. React 프론트엔드 초기 구현

**관련 커밋** `b7c8a37`

**내용**
- `frontend/` Vite + React + TypeScript 프로젝트 초기 생성
- SSU 채플 정보 조회 UI 구현
  - 학번/비밀번호 로그인 폼
  - 채플 정보(시간, 출결 현황) 표시
  - 출석 기록 테이블
- `VITE_API_BASE_URL` 환경변수로 API 주소 외부화, `.env` gitignore 추가

---

## 3. UI 개선 — SSU 브랜드 컬러 및 좌석 배치도 이미지

**관련 커밋** `8ca2837`

**내용**
- 전체 UI 스타일 개편: 숭실대 브랜드 컬러 (#014099) 적용
- 좌석 배치도 이미지를 메인 화면에 추가
- CSS 전면 재작성으로 카드 레이아웃, 그라디언트, 배지 스타일 정비

---

## 4. 세부 UX 개선

**관련 커밋** `3aeafe6` `feb9996` `615268c`

**내용**
- 학번/비밀번호 입력값 앞뒤 공백 자동 제거
- API 에러 응답 파싱 후 서버 제공 메시지 표시 (fallback: 일반 오류 메시지)
- 비밀번호 입력 필드 옆 "비밀번호 찾기" 링크 추가 (SSU Smart ID 페이지 연결)
