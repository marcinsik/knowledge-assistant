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
RUN pip install --upgrade pip && pip install --no-cache-dir --resume-retries 5 -r requirements.txt
# Kopiujemy resztę kodu aplikacji do katalogu roboczego.
# Kropka na końcu oznacza "skopiuj całą zawartość bieżącego katalogu (czyli 'backend') do WORKDIR /app".
COPY . .

# Uczyń skrypty wykonywalne
RUN chmod +x run_migrations.py start.sh

# Wystawiamy port, na którym nasłuchuje FastAPI. Informuje Dockera, że aplikacja używa tego portu.
EXPOSE 8000

# Komenda do uruchomienia aplikacji z migracjami
CMD ["/app/start.sh"]