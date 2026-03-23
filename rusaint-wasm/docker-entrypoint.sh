#!/bin/sh
set -e

WEBDIS_URL="${WEBDIS_URL:-http://webdis:7379}"

# 필수 파일 존재 확인
if [ ! -f /app/build/worker/shim.mjs ]; then
    echo "ERROR: /app/build/worker/shim.mjs not found" >&2
    exit 1
fi
if [ ! -f /app/build/index_bg.wasm ]; then
    echo "ERROR: /app/build/index_bg.wasm not found" >&2
    exit 1
fi

echo "workerd starting: webdis=${WEBDIS_URL}"

# workerd.capnp 생성
# 모듈 이름은 상대 import 경로 해석을 위해 파일 경로 구조와 일치해야 함
# shim.mjs → "../index.js" → "./index_bg.wasm"
cat > /app/workerd.capnp << CAPNP
using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "main", worker = .chapelWorker),
  ],
  sockets = [
    (name = "http", address = "*:8787", http = (), service = "main"),
  ],
);

const chapelWorker :Workerd.Worker = (
  modules = [
    (name = "build/worker/shim.mjs", esModule = embed "build/worker/shim.mjs"),
    (name = "build/index.js", esModule = embed "build/index.js"),
    (name = "build/index_bg.wasm", wasm = embed "build/index_bg.wasm"),
  ],
  bindings = [
    (name = "WEBDIS_URL", text = "${WEBDIS_URL}"),
  ],
  compatibilityDate = "2024-11-01",
);
CAPNP

exec /app/node_modules/.bin/workerd serve /app/workerd.capnp
