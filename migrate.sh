#!/bin/bash
# Skrypt do manualnego uruchamiania migracji w kontenerze Docker

echo "🔧 Uruchamiam migracje bazy danych..."

# Uruchom kontener z migracjami
docker-compose run --rm backend python3 run_migrations.py

echo "✅ Migracje zakończone!"
