# Migracje bazy danych - Alembic

Ten projekt używa Alembic do zarządzania migracjami bazy danych w środowisku Docker.

## Automatyczne migracje

Migracje uruchamiają się automatycznie przy starcie kontenera backend. Skrypt inicjalizujący w pliku `backend/Dockerfile` tworzy niezbędne tabele w bazie danych.

## Manualne zarządzanie migracjami

### 1. Uruchomienie shella w kontenerze
```bash
docker compose exec backend bash
```

### 2. Tworzenie nowej migracji
```bash
cd /app/app
alembic revision --autogenerate -m "nazwa migracji"
```
Przykład:
```bash
alembic revision --autogenerate -m "dodaj kolumnę kategorie"
```

### 3. Sprawdzenie statusu migracji
```bash
cd /app/app
alembic current
```

### 4. Historia migracji
```bash
cd /app/app
alembic history
```

### 5. Zastosowanie migracji
```bash
cd /app/app
alembic upgrade head
```

### 6. Cofnięcie migracji
```bash
cd /app/app
alembic downgrade -1
```

## Workflow przy zmianie modeli

1. **Zmodyfikuj model** w `backend/app/main.py`
2. **Uruchom shell w kontenerze**:
   ```bash
   docker compose exec backend bash
   ```
3. **Utwórz migrację**:
   ```bash
   cd /app/app
   alembic revision --autogenerate -m "opis zmian"
   ```
4. **Sprawdź wygenerowaną migrację** w `backend/app/alembic/versions/`
5. **Zastosuj migrację**:
   ```bash
   alembic upgrade head
   ```

## Przenoszenie na nowy komputer

1. **Sklonuj repozytorium**
2. **Uruchom projekt**:
   ```bash
   docker compose up --build
   ```
3. **Migracje uruchomią się automatycznie** przy pierwszym starcie

## Struktura plików migracji

```
backend/
├── app/
│   ├── alembic.ini           # Konfiguracja Alembic
│   ├── alembic/
│   │   ├── env.py            # Środowisko migracji
│   │   └── versions/         # Pliki migracji
```

## Rozwiązywanie problemów

### Problem: Baza danych niedostępna
```bash
# Sprawdź status kontenerów
docker compose ps

# Sprawdź logi bazy danych
docker compose logs db
```

### Problem: Konflikt migracji
```bash
# Sprawdź aktualny stan
docker compose exec backend bash -c "cd /app/app && alembic current"

# Sprawdź historię
docker compose exec backend bash -c "cd /app/app && alembic history"

# W razie potrzeby cofnij migrację
docker compose exec backend bash -c "cd /app/app && alembic downgrade <revision>"
```

### Problem: Potrzebujesz czystej bazy danych
```bash
# Usuń wolumen bazy danych
docker-compose down -v

# Uruchom ponownie
docker-compose up --build
```
