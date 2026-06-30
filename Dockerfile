FROM node:22-slim AS frontend-build

# Declare build-time env vars so Railway passes them into the Vite bundle
ARG VITE_API_URL
ARG VITE_API_BASE
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_POSTHOG_KEY
ARG VITE_ANON_SESSION_LIMIT
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
ENV VITE_ANON_SESSION_LIMIT=$VITE_ANON_SESSION_LIMIT

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# ── Backend + final image ───────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements_backend.txt
RUN pip install --no-cache-dir -r requirements_backend.txt

COPY backend/  ./backend/
COPY phase1/   ./phase1/
COPY phase2/   ./phase2/
COPY scripts/start.sh ./start.sh
COPY scripts/start-celery.sh ./start-celery.sh
COPY health_server.py ./health_server.py
RUN chmod +x start.sh start-celery.sh

# Whitenoise serves frontend from /app/frontend/dist (WHITENOISE_ROOT in settings.py)
COPY --from=frontend-build /app/frontend/dist ./frontend/dist/

ENV DJANGO_SETTINGS_MODULE=config.settings
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend

WORKDIR /app/backend
RUN python3 manage.py collectstatic --noinput || true

EXPOSE 8000
CMD ["bash", "/app/start.sh"]
