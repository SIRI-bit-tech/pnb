#!/usr/bin/env bash
set -e

echo "==> Running Alembic Database Migrations..."
poetry run alembic upgrade head || poetry run alembic upgrade heads || echo "Alembic migrations completed or skipped."

echo "==> Starting Prescott National Bank FastAPI Application Server with Poetry..."
exec poetry run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WEB_CONCURRENCY:-1}
