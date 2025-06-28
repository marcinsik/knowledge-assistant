#!/usr/bin/env python3
"""
Skrypt do uruchamiania migracji Alembic w kontenerze Docker.
Ten skrypt sprawdza czy baza danych jest dostępna i uruchamia migracje.
"""
import os
import sys
import time
import subprocess
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

# Dodaj ścieżkę do aplikacji
sys.path.append('/app')

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/knowledge_db")

def wait_for_db():
    """Czeka aż baza danych będzie dostępna."""
    print("Czekam na dostępność bazy danych...")
    max_retries = 30
    retry_delay = 2
    
    for i in range(max_retries):
        try:
            engine = create_engine(DATABASE_URL)
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            print("✅ Baza danych jest dostępna!")
            return True
        except OperationalError as e:
            print(f"⏳ Próba {i+1}/{max_retries}: Baza danych niedostępna - {e}")
            time.sleep(retry_delay)
    
    print("❌ Nie udało się połączyć z bazą danych!")
    return False

def run_alembic_command(command_args):
    """Uruchamia komendę Alembic."""
    try:
        # Zmień katalog roboczy na /app/app (gdzie jest alembic.ini)
        os.chdir('/app/app')
        
        # Parsuj argumenty komendy
        if isinstance(command_args, str):
            args = command_args.split()
        else:
            args = command_args
        
        print(f"🚀 Uruchamiam: alembic {' '.join(args)}")
        result = subprocess.run(
            ['alembic'] + args,
            capture_output=True,
            text=True,
            check=True
        )
        print(f"✅ Sukces: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Błąd podczas wykonywania 'alembic {' '.join(args)}':")
        print(f"Kod wyjścia: {e.returncode}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        return False
    except Exception as e:
        print(f"❌ Nieoczekiwany błąd: {e}")
        return False

def main():
    """Główna funkcja uruchamiająca migracje."""
    print("🔧 Inicjalizacja migracji bazy danych...")
    
    # Sprawdź dostępność bazy danych
    if not wait_for_db():
        sys.exit(1)
    
    # Sprawdź czy są już migracje
    print("📁 Sprawdzam czy istnieją migracje...")
    versions_dir = "/app/app/alembic/versions"
    
    if not os.path.exists(versions_dir):
        os.makedirs(versions_dir, exist_ok=True)
    
    migration_files = [f for f in os.listdir(versions_dir) if f.endswith('.py')]
    
    if not migration_files:
        print("📝 Tworzę pierwszą migrację...")
        if not run_alembic_command(["revision", "--autogenerate", "-m", "Initial_migration"]):
            sys.exit(1)
    else:
        print(f"📋 Znaleziono {len(migration_files)} istniejących migracji")
    
    # Uruchom migracje
    print("⬆️ Uruchamiam migracje...")
    if not run_alembic_command(["upgrade", "head"]):
        sys.exit(1)
    
    print("🎉 Migracje zakończone pomyślnie!")

if __name__ == "__main__":
    main()
