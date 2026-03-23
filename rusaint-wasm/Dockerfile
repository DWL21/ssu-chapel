# Stage 1: Rust WASM 빌드
FROM rust:1.88-slim AS builder

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

RUN rustup target add wasm32-unknown-unknown
RUN cargo install worker-build --locked

WORKDIR /build

# 소스 복사 (rusaint 라이브러리 포함)
COPY rusaint/ ./rusaint/
COPY rusaint-wasm/ ./rusaint-wasm/

WORKDIR /build/rusaint-wasm
RUN worker-build --release

# Stage 2: workerd 런타임
FROM node:20-bookworm-slim AS runtime

WORKDIR /app

# workerd npm 패키지 (바이너리 포함)
RUN npm install workerd

# 빌드된 WASM 복사
COPY --from=builder /build/rusaint-wasm/build ./build

# 엔트리포인트 스크립트
COPY rusaint-wasm/docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

EXPOSE 8787
ENTRYPOINT ["./docker-entrypoint.sh"]
