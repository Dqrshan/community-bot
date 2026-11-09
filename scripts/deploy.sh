#!/usr/bin/env bash
set -euo pipefail

set -a; . ./.env; set +a

START_CMD="TURSO_DATABASE_URL=${TURSO_DATABASE_URL} \
TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN} node dist/index.js"

catalyst deploy appsail -ni --command "$START_CMD"

sleep 5
curl -s -m 20 \
  "https://community-bot-50047512140.development.catalystappsail.in/ping"
