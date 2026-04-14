# Stage 1: Rust WASM 빌드 준비
FROM rust:1.88-slim AS chef

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

RUN rustup target add wasm32-unknown-unknown
RUN cargo install cargo-chef --locked && cargo install worker-build --locked

WORKDIR /build

# 의존성 레이어용 레시피 생성
FROM chef AS planner
COPY rusaint/ ./rusaint/
COPY rusaint-wasm/ ./rusaint-wasm/
WORKDIR /build/rusaint-wasm
RUN cargo chef prepare --recipe-path recipe.json

# 의존성 캐시를 먼저 빌드한 뒤 실제 소스를 빌드
FROM chef AS builder
WORKDIR /build
COPY rusaint/ ./rusaint/
COPY rusaint-wasm/Cargo.toml ./rusaint-wasm/Cargo.toml
COPY rusaint-wasm/Cargo.lock ./rusaint-wasm/Cargo.lock

WORKDIR /build/rusaint-wasm
COPY --from=planner /build/rusaint-wasm/recipe.json ./recipe.json
RUN cargo chef cook --release --target wasm32-unknown-unknown --recipe-path recipe.json

WORKDIR /build
COPY rusaint-wasm/ ./rusaint-wasm/

WORKDIR /build/rusaint-wasm
RUN worker-build --release

# Stage 2: workerd 런타임
FROM node:20-bookworm-slim AS runtime

WORKDIR /app

# TLS CA 인증서 및 workerd npm 패키지
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install workerd

# 빌드된 WASM 복사
COPY --from=builder /build/rusaint-wasm/build ./build

# 엔트리포인트 스크립트
COPY rusaint-wasm/docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

EXPOSE 8787
ENTRYPOINT ["./docker-entrypoint.sh"]
