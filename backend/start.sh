#!/bin/bash
set -e

echo "🔧 Uruchamiam migracje bazy danych..."
python3 run_migrations.py

echo "🚀 Uruchamiam serwer FastAPI..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
