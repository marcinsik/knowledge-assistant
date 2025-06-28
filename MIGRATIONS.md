# Migracje bazy danych - Alembic

Ten projekt używa Alembic do zarządzania migracjami bazy danych w środowisku Docker.

## Automatyczne migracje

Migracje uruchamiają się automatycznie przy starcie kontenera backend:

```bash
docker-compose up backend
```

## Manualne zarządzanie migracjami

### 1. Uruchomienie migracji
```bash
./migrate.sh
```

### 2. Tworzenie nowej migracji
```bash
./create_migration.sh "nazwa migracji"
```
Przykład:
```bash
./create_migration.sh "dodaj kolumnę kategorie"
```

### 3. Sprawdzenie statusu migracji
```bash
docker-compose run --rm backend bash -c "cd /app/app && alembic current"
```

### 4. Historia migracji
```bash
docker-compose run --rm backend bash -c "cd /app/app && alembic history"
```

### 5. Cofnięcie migracji
```bash
docker-compose run --rm backend bash -c "cd /app/app && alembic downgrade -1"
```

## Workflow przy zmianie modeli

1. **Zmodyfikuj model** w `backend/app/main.py`
2. **Utwórz migrację**:
   ```bash
   ./create_migration.sh "opis zmian"
   ```
3. **Sprawdź wygenerowaną migrację** w `backend/app/alembic/versions/`
4. **Zastosuj migrację**:
   ```bash
   ./migrate.sh
   ```

## Przenoszenie na nowy komputer

1. **Sklonuj repozytorium**
2. **Uruchom projekt**:
   ```bash
   docker-compose up --build
   ```
3. **Migracje uruchomią się automatycznie** przy pierwszym starcie

## Struktura plików migracji

```
backend/
├── run_migrations.py          # Skrypt automatycznych migracji
├── app/
│   ├── alembic.ini           # Konfiguracja Alembic
│   ├── alembic/
│   │   ├── env.py            # Środowisko migracji
│   │   └── versions/         # Pliki migracji
├── migrate.sh                # Skrypt manualnych migracji
└── create_migration.sh       # Skrypt tworzenia migracji
```

## Rozwiązywanie problemów

### Problem: Baza danych niedostępna
```bash
# Sprawdź status kontenerów
docker-compose ps

# Sprawdź logi bazy danych
docker-compose logs db
```

### Problem: Konflikt migracji
```bash
# Sprawdź aktualny stan
docker-compose run --rm backend bash -c "cd /app/app && alembic current"

# Sprawdź historię
docker-compose run --rm backend bash -c "cd /app/app && alembic history"

# W razie potrzeby cofnij migrację
docker-compose run --rm backend bash -c "cd /app/app && alembic downgrade <revision>"
```

### Problem: Potrzebujesz czystej bazy danych
```bash
# Usuń wolumen bazy danych
docker-compose down -v

# Uruchom ponownie
docker-compose up --build
```
