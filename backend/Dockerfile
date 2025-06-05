# knowledge-assistant/backend/Dockerfile

# Używamy oficjalnego obrazu Pythona w wersji 3.10 opartego na Debianie (slim-buster jest lekki).
FROM python:3.10-slim-buster

# Ustawiamy katalog roboczy w kontenerze. Cały kod będzie kopiowany do tego katalogu.
WORKDIR /app

# Kopiujemy plik requirements.txt do katalogu roboczego.
# Ważne: Kopiujemy tylko ten plik na początku, aby warstwa z instalacją zależności
# mogła być buforowana przez Dockera, jeśli requirements.txt się nie zmieni.
COPY requirements.txt .

# Instalujemy zależności npm.
# Użycie `pip install --upgrade pip` zapewnia, że używasz najnowszej wersji pip.
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Kopiujemy resztę kodu aplikacji do katalogu roboczego.
# Kropka na końcu oznacza "skopiuj całą zawartość bieżącego katalogu (czyli 'backend') do WORKDIR /app".
COPY . .

# Wystawiamy port, na którym nasłuchuje FastAPI. Informuje Dockera, że aplikacja używa tego portu.
EXPOSE 8000

# Komenda do uruchomienia aplikacji.
# Uvicorn to serwer ASGI dla FastAPI.
# `app.main:app` oznacza moduł `main.py` w pakiecie `app` i instancję FastAPI o nazwie `app`.
# `--host 0.0.0.0` sprawia, że serwer nasłuchuje na wszystkich interfejsach sieciowych w kontenerze.
# `--port 8000` to port, na którym serwer nasłuchuje.
# UWAGA: `--reload` jest świetne do developmentu (automatyczny restart serwera przy zmianach kodu),
# ale NIE NALEŻY go używać w produkcji, gdyż jest nieefektywne.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]