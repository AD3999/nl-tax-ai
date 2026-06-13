import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("nltaxai")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# ── Celery Beat schedule ────────────────────────────────────────────────────────
# To activate, run a worker with beat:
#   celery -A config worker -B -l info
# On Railway: add a second service with the command above + REDIS_URL env var.
# ────────────────────────────────────────────────────────────────────────────────
app.conf.beat_schedule = {
    # BTW deadline reminders — daily at 08:00 Amsterdam
    "daily-btw-reminder": {
        "task": "users.send_btw_reminders",
        "schedule": crontab(hour=8, minute=0),
    },
    # IB return deadline reminder — daily at 08:15 Amsterdam
    "daily-ib-reminder": {
        "task": "users.send_ib_reminder",
        "schedule": crontab(hour=8, minute=15),
    },
    # Monthly reserve reminder — 1st of each month at 09:00
    "monthly-reserve-reminder": {
        "task": "users.send_monthly_reserve_reminder",
        "schedule": crontab(hour=9, minute=0, day_of_month=1),
    },
    # Rule change notifications — daily at 09:30
    "rule-change-notifications": {
        "task": "users.send_rule_change_notifications",
        "schedule": crontab(hour=9, minute=30),
    },
}
app.conf.timezone = "Europe/Amsterdam"
