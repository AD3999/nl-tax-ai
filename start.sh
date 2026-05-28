#!/bin/bash
set -e

export PYTHONPATH=/app/backend:${PYTHONPATH:-}
cd /app/backend

echo "==> Running migrations…"
python3 manage.py migrate --noinput

echo "==> Starting gunicorn…"
exec python3 -m gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers 2 \
  --timeout 120 \
  --log-level info
