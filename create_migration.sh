#!/bin/bash
# Skrypt do tworzenia nowych migracji w kontenerze Docker

if [ -z "$1" ]; then
    echo "❌ Użycie: ./create_migration.sh \"nazwa migracji\""
    echo "Przykład: ./create_migration.sh \"dodaj kolumnę kategorie\""
    exit 1
fi

MIGRATION_NAME="$1"

echo "📝 Tworzę nową migrację: $MIGRATION_NAME"

# Uruchom kontener i utwórz migrację
docker-compose run --rm backend bash -c "cd /app/app && alembic revision --autogenerate -m \"$MIGRATION_NAME\""

echo "✅ Migracja utworzona!"
echo "💡 Aby zastosować migrację, uruchom: ./migrate.sh"
