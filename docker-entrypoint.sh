#!/bin/sh
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "Importing Phase 1 tax rules (if none exist)..."
python -c "
import django, os, sys
sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.tax.models import TaxRule
if TaxRule.objects.count() == 0:
    created, _ = TaxRule.import_from_json('/app/phase1/data/seed/tax_rules_2026.json')
    print(f'Imported {created} tax rules.')
else:
    print(f'Tax rules already present ({TaxRule.objects.count()}).')
" || true

exec "$@"
