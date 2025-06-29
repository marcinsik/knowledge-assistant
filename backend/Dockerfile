# knowledge-assistant/backend/Dockerfile

# Używamy oficjalnego obrazu Pythona w wersji 3.10 opartego na Debianie (slim-buster jest lekki).
FROM python:3.10-slim-buster

# Ustawiamy katalog roboczy w kontenerze. Cały kod będzie kopiowany do tego katalogu.
WORKDIR /app

# Kopiujemy plik requirements.txt do katalogu roboczego.
# Ważne: Kopiujemy tylko ten plik na początku, aby warstwa z instalacją zależności
# mogła być buforowana przez Dockera, jeśli requirements.txt się nie zmieni.
COPY requirements.txt .

# Instalujemy zależności Python
RUN pip install --upgrade pip && pip install --no-cache-dir --resume-retries 5 -r requirements.txt

# Kopiujemy resztę kodu aplikacji do katalogu roboczego.
COPY . .

# Tworzenie i ustawienie uprawnień dla katalogu na pliki PDF
RUN mkdir -p /app/app/uploaded_pdfs && \
    chmod -R 777 /app/app/uploaded_pdfs

# Wystawiamy port, na którym nasłuchuje FastAPI.
EXPOSE 8000

# Inicjalizacja bazy danych i uruchomienie serwera
CMD python -c "from app.main import create_db_and_tables; create_db_and_tables()" && \
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload