#!/bin/bash
set -e

# Locate Python across railpack/mise and nixpacks environments
export PATH=/root/.local/share/mise/shims:/root/.local/bin:/root/.nix-profile/bin:/nix/var/nix/profiles/default/bin:${PATH}

# Debug: show available Python binaries
echo "==> PATH: $PATH"
echo "==> python3 location: $(command -v python3 2>/dev/null || echo NOT FOUND)"
echo "==> python location:  $(command -v python 2>/dev/null || echo NOT FOUND)"
ls /root/.local/share/mise/installs/python/ 2>/dev/null && echo "==> mise python installs found" || echo "==> no mise python installs"

# Resolve python binary
PYTHON_BIN=$(command -v python3 2>/dev/null || command -v python 2>/dev/null || find /root/.local/share/mise/installs/python -name "python3" -type f 2>/dev/null | head -1)
if [ -z "$PYTHON_BIN" ]; then
  echo "ERROR: Python not found. Aborting."
  exit 1
fi
echo "==> Using Python: $PYTHON_BIN ($($PYTHON_BIN --version 2>&1))"

export PYTHONPATH=/app/backend:${PYTHONPATH:-}
cd /app/backend

echo "==> Running migrations…"
$PYTHON_BIN manage.py migrate --noinput

echo "==> Seeding tax reminders…"
$PYTHON_BIN manage.py seed_reminders

echo "==> Importing tax rules into DB…"
$PYTHON_BIN manage.py shell -c "
from apps.tax.models import TaxRule
from pathlib import Path
p = Path('/app/phase1/data/seed/tax_rules_2026.json')
if p.exists():
    c, u = TaxRule.import_from_json(str(p))
    print(f'  tax_rules: {c} created, {u} updated')
else:
    print('  tax_rules_2026.json not found — skipping')
"

echo "==> Starting gunicorn on port ${PORT:-8000}…"
exec $PYTHON_BIN -m gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers 2 \
  --timeout 120 \
  --log-level info \
  --access-logfile -
