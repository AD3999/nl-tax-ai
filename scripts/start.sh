#!/bin/bash
set -e

export PYTHONPATH=/app/backend:${PYTHONPATH:-}
cd /app/backend

echo "==> Running migrations…"
python3 manage.py migrate --noinput

echo "==> Seeding tax reminders…"
python3 manage.py seed_reminders

echo "==> Importing tax rules into DB…"
python3 manage.py shell -c "
from apps.tax.models import TaxRule
from pathlib import Path
p = Path('/app/phase1/data/seed/tax_rules_2026.json')
if p.exists():
    c, u = TaxRule.import_from_json(str(p))
    print(f'  tax_rules: {c} created, {u} updated')
else:
    print('  tax_rules_2026.json not found — skipping')
"

echo "==> Starting uvicorn (ASGI) on port ${PORT:-8000}…"
exec python3 -m uvicorn config.asgi:application \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --ws websockets
