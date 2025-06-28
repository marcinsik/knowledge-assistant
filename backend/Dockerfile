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

# Kopiowanie skryptu entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Wystawiamy port, na którym nasłuchuje FastAPI.
EXPOSE 8000
EXPOSE 8000

# Komenda do uruchomienia aplikacji
CMD ["/app/docker-entrypoint.sh"]