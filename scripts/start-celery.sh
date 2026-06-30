#!/bin/bash
set -e

export PYTHONPATH=/app/backend:${PYTHONPATH:-}
cd /app/backend

echo "==> Running migrations…"
python3 manage.py migrate --noinput

echo "==> Starting Celery worker + beat…"
exec python3 -m celery -A config worker \
  --beat \
  --loglevel=INFO \
  --concurrency=2
