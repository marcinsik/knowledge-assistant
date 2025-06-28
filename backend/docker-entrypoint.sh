#!/bin/sh
# Script to initialize database and start FastAPI server

# Check if tables exist
echo "Initializing database..."
python -c "from app.main import create_db_and_tables; create_db_and_tables()"

# Start the server
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
