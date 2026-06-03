#!/bin/bash
set -e

export PYTHONPATH=/app/backend:${PYTHONPATH:-}
cd /app/backend

echo "==> Running migrations…"
python3 manage.py migrate --noinput

echo "==> Seeding tax reminders…"
python3 manage.py seed_reminders

echo "==> Importing tax rules into DB…"
python3 -c "
from apps.tax.models import TaxRule
import os, sys
from pathlib import Path
p = Path('/app/phase1/data/seed/tax_rules_2026.json')
if p.exists():
    c, u = TaxRule.import_from_json(str(p))
    print(f'  tax_rules: {c} created, {u} updated')
else:
    print('  tax_rules_2026.json not found — skipping')
"

echo "==> Starting gunicorn…"
exec python3 -m gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers 2 \
  --timeout 120 \
  --log-level info
