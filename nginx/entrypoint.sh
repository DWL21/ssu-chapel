#!/bin/sh
set -e

CERT="/etc/letsencrypt/live/api.ssu-chapel.kro.kr/fullchain.pem"

if [ -f "$CERT" ]; then
    echo "[nginx] SSL 인증서 감지 → HTTPS 모드"
    cp /etc/nginx/available/https.conf /etc/nginx/conf.d/default.conf
else
    echo "[nginx] 인증서 없음 → HTTP 모드 (certbot 대기)"
    cp /etc/nginx/available/http.conf /etc/nginx/conf.d/default.conf
fi

exec nginx -g "daemon off;"
