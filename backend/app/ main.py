# knowledge-assistant/backend/app/main.py
from fastapi import FastAPI
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import time

app = FastAPI()

# Zmienna środowiskowa do połączenia z bazą danych
# Odwołujemy się do nazwy serwisu 'db' z docker-compose.yml, nie 'localhost'
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/knowledge_db")

# Próbujemy połączyć się z bazą danych przy starcie
# Często kontener bazy danych startuje trochę wolniej, więc spróbujemy kilka razy
engine = None
max_retries = 10
retry_delay = 5 # seconds

for i in range(max_retries):
    try:
        print(f"Attempting to connect to database ({i+1}/{max_retries})...")
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        with SessionLocal() as db:
            db.execute(text("SELECT 1")) # Proste zapytanie, aby sprawdzić połączenie
        print("Successfully connected to the database!")
        break
    except Exception as e:
        print(f"Database connection failed: {e}")
        if i < max_retries - 1:
            print(f"Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
        else:
            print("Max retries reached. Exiting.")
            raise # Rzuć wyjątek, jeśli nie udało się połączyć po wielu próbach

@app.get("/health")
async def health_check():
    """Sprawdza, czy backend działa."""
    return {"status": "ok", "message": "Backend is running!"}

@app.get("/")
async def root():
    """Główny endpoint."""
    return {"message": "Welcome to Knowledge Assistant Backend! Access /health to check status."}