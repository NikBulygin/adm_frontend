#!/bin/sh
set -eu

APP_MODE_NORMALIZED="$(printf '%s' "${APP_MODE:-DEV}" | tr '[:lower:]' '[:upper:]')"
FRONTEND_PORT_VALUE="${FRONTEND_PORT:-3000}"

if [ ! -d /app/node_modules ] || [ -z "$(ls -A /app/node_modules 2>/dev/null || true)" ]; then
  pnpm install --frozen-lockfile
fi

if [ "$APP_MODE_NORMALIZED" = "DEV" ]; then
  export NODE_ENV=development
  exec pnpm dev --host 0.0.0.0 --port "$FRONTEND_PORT_VALUE"
fi

export NODE_ENV=production
pnpm build
exec node .output/server/index.mjs
