"""
Django settings for nl-tax-ai backend.
Reads all secrets from environment variables via django-environ.
"""

import os
import sys
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Allow importing phase2 modules (project root is one level above backend/)
_PROJECT_ROOT = str(BASE_DIR.parent)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, []),
)

_env_file = BASE_DIR.parent / ".env"
if _env_file.exists():
    environ.Env.read_env(_env_file)

SECRET_KEY = env("DJANGO_SECRET_KEY", default="dev-secret-key-change-in-production")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")
# Railway injects RAILWAY_ENVIRONMENT at runtime. When present, health checks arrive
# from internal infrastructure using unpredictable internal hostnames. Using * inside
# Railway is safe: Railway's edge proxy handles public routing security.
if os.environ.get("RAILWAY_ENVIRONMENT") and "*" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS = list(ALLOWED_HOSTS) + ["*"]
elif "*" not in ALLOWED_HOSTS:
    for _host in ["localhost", "127.0.0.1"]:
        if _host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(_host)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    # Local apps
    "apps.users",
    "apps.tax",
    "apps.chat",
    "apps.calculator",
    "apps.payments",
    "apps.portal",
    "apps.zzp",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ── Database ──────────────────────────────────────────────────────────────────

DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default="postgresql://nltaxai:nltaxai@localhost:5432/nltaxai",
    )
}

# ── Auth ──────────────────────────────────────────────────────────────────────

AUTH_USER_MODEL = "users.User"

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

SITE_ID = 1

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ── REST Framework ────────────────────────────────────────────────────────────

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/minute",
        "user": "300/minute",
        "chat": "60/minute",
    },
}

# ── CORS ──────────────────────────────────────────────────────────────────────

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:5173", "http://localhost:3000"],
)
CORS_ALLOW_CREDENTIALS = True

# ── Celery ────────────────────────────────────────────────────────────────────

CELERY_BROKER_URL = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "Europe/Amsterdam"

# Celery Beat — periodic tasks
from celery.schedules import crontab  # noqa: E402

CELERY_BEAT_SCHEDULE = {
    # Portal: engagement checklist reminders — daily at 08:00 Amsterdam
    "send-pending-reminders": {
        "task": "apps.portal.tasks.send_pending_reminders_task",
        "schedule": crontab(hour=8, minute=0),
    },
    # Portal: GDPR document purge — daily at 02:00
    "purge-expired-documents": {
        "task": "apps.portal.tasks.purge_expired_documents_task",
        "schedule": crontab(hour=2, minute=0),
    },
    # User reminders: BTW quarterly deadlines — daily at 08:15
    "send-btw-reminders": {
        "task": "users.send_btw_reminders",
        "schedule": crontab(hour=8, minute=15),
    },
    # User reminders: IB return deadline — daily at 08:20
    "send-ib-reminder": {
        "task": "users.send_ib_reminder",
        "schedule": crontab(hour=8, minute=20),
    },
    # User reminders: monthly tax reserve — 1st of each month at 09:00
    "send-monthly-reserve-reminder": {
        "task": "users.send_monthly_reserve_reminder",
        "schedule": crontab(hour=9, minute=0, day_of_month=1),
    },
    # User reminders: tax rule change notifications — daily at 09:30
    "send-rule-change-notifications": {
        "task": "users.send_rule_change_notifications",
        "schedule": crontab(hour=9, minute=30),
    },
    # Google Calendar: push deadline events to all connected users — daily at 07:00
    "sync-google-calendars": {
        "task": "apps.users.tasks.sync_all_google_calendars_task",
        "schedule": crontab(hour=7, minute=0),
    },
}

# ── Stripe ────────────────────────────────────────────────────────────────────

STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY", default="")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET", default="")
STRIPE_PRICE_ID = env("STRIPE_PRICE_ID", default="")   # monthly premium price ID
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")

# ── Chat limits ───────────────────────────────────────────────────────────────
FREE_DAILY_LIMIT  = env.int("FREE_DAILY_LIMIT",  default=10)   # free accounts: 10 AI messages/day
ANON_SESSION_LIMIT = env.int("ANON_SESSION_LIMIT", default=5)   # anonymous: 5 messages per browser session

# ── Email (SMTP) ───────────────────────────────────────────────────────────────
# ── Google OAuth (shared for login + Calendar sync) ───────────────────────────
GOOGLE_CLIENT_ID     = env("GOOGLE_CLIENT_ID", default=env("VITE_GOOGLE_CLIENT_ID", default=""))
GOOGLE_CLIENT_SECRET = env("GOOGLE_CLIENT_SECRET", default="")
GOOGLE_CALENDAR_REDIRECT_URI = env(
    "GOOGLE_CALENDAR_REDIRECT_URI",
    default="http://localhost:8000/api/users/google-calendar/callback/",
)

EMAIL_BACKEND     = env("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST        = env("EMAIL_HOST", default="")
EMAIL_PORT        = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER   = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS     = env.bool("EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="TaxWijs <noreply@taxwijs.nl>")


# ── Internationalisation ──────────────────────────────────────────────────────

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Europe/Amsterdam"
USE_I18N = True
USE_TZ = True

LANGUAGES = [
    ("nl", "Dutch"),
    ("en", "English"),
    ("fa", "Persian"),
]

# ── Static & Media ────────────────────────────────────────────────────────────

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ── WhiteNoise — serve React build + Django static files ─────────────────────

# Serve the React dist folder (index.html, assets/, favicon) at the URL root.
# WhiteNoise intercepts these before Django's URL router.
WHITENOISE_ROOT = BASE_DIR.parent / "frontend" / "dist"

# ── File storage for uploaded client documents ────────────────────────────────
# "local" (default) writes to MEDIA_ROOT on local disk — fine for dev, but
# Railway's filesystem is ephemeral: every deploy wipes backend/media/, so any
# previously uploaded document 404s on download even though its DB row (and
# "approved" status) survives. Set FILE_STORAGE_PROVIDER=s3 with AWS_* env vars
# to persist documents in any S3-compatible bucket (AWS S3, Cloudflare R2,
# Backblaze B2, MinIO) so they survive deploys/restarts.
FILE_STORAGE_PROVIDER = env("FILE_STORAGE_PROVIDER", default="local").lower()

if FILE_STORAGE_PROVIDER == "s3":
    AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME")
    AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default="eu-central-1")
    AWS_S3_ENDPOINT_URL = env("AWS_S3_ENDPOINT_URL", default=None)  # set for R2 / B2 / MinIO
    AWS_DEFAULT_ACL = None        # private — documents are only ever served via DocumentFileView
    AWS_S3_FILE_OVERWRITE = False  # match FileSystemStorage's collision behaviour (auto-suffix, never overwrite)

    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3.S3Storage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }
else:
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }
    if not DEBUG:
        print(
            "WARNING: FILE_STORAGE_PROVIDER=local in a non-DEBUG environment. "
            "Uploaded client documents are stored on local disk and WILL BE LOST on the "
            "next deploy/restart (e.g. Railway's ephemeral filesystem). Set "
            "FILE_STORAGE_PROVIDER=s3 with AWS_* credentials to persist them.",
            file=sys.stderr,
        )

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── Structured Logging (Phase 6) ──────────────────────────────────────────────

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "django.utils.log.ServerFormatter",
            "format": '{"time":"%(asctime)s","level":"%(levelname)s","name":"%(name)s","message":"%(message)s"}',
        },
        "verbose": {
            "format": "[%(asctime)s] %(levelname)-8s %(name)s: %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

# ── Sentry (Phase 6 — error tracking) ────────────────────────────────────────

SENTRY_DSN = env("SENTRY_DSN", default="")

if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.celery import CeleryIntegration
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[DjangoIntegration(), CeleryIntegration()],
            traces_sample_rate=0.1,
            send_default_pii=False,
        )
    except ImportError:
        pass  # sentry-sdk not installed — no error tracking

# ── AI providers ──────────────────────────────────────────────────────────────

OPENAI_API_KEY = env("OPENAI_API_KEY", default="")
ANTHROPIC_API_KEY = env("ANTHROPIC_API_KEY", default="")

# ── Production security (activated when DEBUG=False) ──────────────────────────

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=False)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
