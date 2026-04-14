#!/bin/bash
set -e

DOMAIN="api.ssu-chapel.kro.kr"
EMAIL="${1:?사용법: $0 <이메일>}"

echo "=== 1단계: nginx 및 의존 서비스 시작 (HTTP 모드) ==="
docker compose up -d redis webdis worker
docker compose up -d --build nginx
sleep 5

echo "=== 2단계: Let's Encrypt 인증서 발급 ==="
docker compose run --rm --entrypoint certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

echo "=== 3단계: nginx 재시작 (HTTPS 모드) ==="
docker compose restart nginx

echo ""
echo "=== 완료! https://$DOMAIN ==="
echo "자동 갱신은 certbot 서비스가 12시간마다 처리합니다."
