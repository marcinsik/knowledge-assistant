# Knowledge Assistant

**Knowledge Assistant** to aplikacja webowa do przechowywania, wyszukiwania i zarządzania osobistą bazą wiedzy. Możesz dodawać notatki jako tekst lub przesyłać pliki PDF, oznaczać je tagami i szybko wyszukiwać w elementach bazy wiedzy.

## Funkcje

- Dodawanie, usuwanie elementów wiedzy (notatki lub PDF)
- Oznaczanie notatek tagami dla łatwej organizacji
- Wyszukiwanie pełnotekstowe i wyszukiwanie semantyczne
- Filtrowanie według tagów
- Responsywny, przyjazny dla użytkownika interfejs
- Powiadomienia toast dla akcji i błędów

## Technologia

- **Frontend:** React + TypeScript
- **Backend:** FastAPI (Python) + Alembic (migracje bazy danych)
- **Baza danych:** PostgreSQL z pgvector (wektory embeddingów)
- **Wyszukiwanie:** Wyszukiwanie semantyczne z Sentence Transformers
- **Ikony UI:** [Lucide React](https://lucide.dev/)
- **Konteneryzacja:** Docker & Docker Compose

## Wymagania

- [Docker](https://www.docker.com/) i [Docker Compose](https://docs.docker.com/compose/) (v2 lub nowszy)

## Uruchomienie aplikacji

### Pierwsze uruchomienie

```bash
# Sklonuj repozytorium
git clone https://github.com/username/knowledge-assistant.git
cd knowledge-assistant

# Kopiuj przykładowy plik .env (opcjonalne)
cp backend/.env.example backend/.env

# Zbuduj i uruchom aplikację w trybie deweloperskim
docker compose up --build
```

### Wersja deweloperska (z hot-reloadingiem)

```bash
# Zbuduj i uruchom wszystkie serwisy
docker compose up
```

### Wersja produkcyjna

```bash
# Zbuduj i uruchom wersję produkcyjną
docker compose -f docker-compose.prod.yml up --build
```

### Dostęp do aplikacji

- **Deweloperska:** [http://localhost:3000](http://localhost:3000)
- **Produkcyjna:** [http://localhost](http://localhost)
- **API Backend:** [http://localhost:8000](http://localhost:8000)

### Zarządzanie bazą danych

Aplikacja automatycznie tworzy tabele w bazie danych przy pierwszym uruchomieniu. Aby zresetować dane:

```bash
# Zatrzymaj i usuń wszystkie kontenery wraz z wolumenami
docker compose down -v
```

## Konfiguracja

Wszystkie zmienne konfiguracyjne są ustawione w plikach `docker-compose.yml` i `docker-compose.prod.yml`.

### Migracje bazy danych

Migracje bazy danych są wykonywane automatycznie podczas uruchamiania kontenera backend.

Aby ręcznie wykonać operacje na migracjach:

```bash
# Uruchom shell w kontenerze backend
docker compose exec backend bash

# Wewnątrz kontenera, przejdź do katalogu z alembic.ini
cd /app/app

# Sprawdź aktualną wersję migracji
alembic current

# Sprawdź historię migracji
alembic history

# Utwórz nową migrację
alembic revision --autogenerate -m "opis_migracji"

# Zastosuj migracje
alembic upgrade head
```

## Struktura projektu

```
knowledge-assistant/
├── docker-compose.yml         # Konfiguracja Docker dla środowiska dev
├── docker-compose.prod.yml    # Konfiguracja Docker dla środowiska produkcyjnego
├── backend/                   # Kod backendu FastAPI
│   ├── Dockerfile             # Obraz Docker dla backendu
│   ├── requirements.txt       # Zależności Pythona
│   ├── app/                   # Moduł aplikacji
│   │   ├── alembic/           # Migracje bazy danych
│   │   ├── uploaded_pdfs/     # Katalog na przesłane pliki PDF
│   │   ├── main.py            # Główny plik aplikacji
│   │   └── ...
├── frontend/                  # Kod frontendu React
│   ├── Dockerfile.dev         # Obraz Docker dla środowiska dev
│   ├── Dockerfile.prod        # Obraz Docker dla środowiska produkcyjnego
│   ├── nginx.conf             # Konfiguracja Nginx dla produkcji
│   ├── package.json           # Zależności npm
│   ├── src/                   # Kod źródłowy React
│   └── ...
```

---

## Development (without Docker)

### Backend (FastAPI)

1. **Zainstaluj zależności:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Uruchom serwer backend:**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

### Frontend (React)

1. **Zainstaluj zależności:**
   ```bash
   cd frontend
   npm install
   ```

2. **Uruchom serwer deweloperski:**
   ```bash
   cd frontend
   npm start
   ```

## Struktura projektu

```
knowledge-assistant/
├── backend/                # Kod backendu FastAPI
│   ├── app/                # Moduł aplikacji
│   │   ├── alembic/        # Migracje bazy danych
│   │   ├── uploaded_pdfs/  # Katalog na przesłane PDF
│   │   ├── main.py         # Główny plik aplikacji
│   │   └── alembic.ini     # Konfiguracja migracji
│   ├── Dockerfile          # Konfiguracja kontenera backend
│   └── requirements.txt    # Zależności Pythona
├── frontend/               # Kod frontendu React
│   ├── src/                # Kod źródłowy React
│   ├── DockerFile.dev      # Konfiguracja kontenera dev
│   ├── Dockerfile.prod     # Konfiguracja kontenera prod
│   └── nginx.conf          # Konfiguracja serwera Nginx
├── docker-compose.yml      # Konfiguracja dev
└── docker-compose.prod.yml # Konfiguracja produkcyjna
```

- The backend API URL is set to `http://localhost:8000` by default in the frontend code.  
  If you need to change it, edit the `API_BASE_URL` constant in `frontend/src/App.tsx`.

---


**Enjoy
