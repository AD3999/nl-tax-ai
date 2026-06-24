FROM node:22-slim AS frontend-build

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
COPY start.sh  ./start.sh
RUN chmod +x start.sh

# Whitenoise serves frontend from /app/frontend/dist (WHITENOISE_ROOT in settings.py)
COPY --from=frontend-build /app/frontend/dist ./frontend/dist/

ENV DJANGO_SETTINGS_MODULE=config.settings
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend

WORKDIR /app/backend
RUN python3 manage.py collectstatic --noinput || true

EXPOSE 8000
CMD ["bash", "/app/start.sh"]
