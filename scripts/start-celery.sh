#!/bin/bash
set -e

export PYTHONPATH=/app/backend:${PYTHONPATH:-}
cd /app/backend

echo "==> Starting Celery worker + beat…"
# -B runs beat scheduler in the same process (acceptable for single-worker setups)
exec python3 -m celery -A config worker \
  --beat \
  --loglevel=INFO \
  --concurrency=2
