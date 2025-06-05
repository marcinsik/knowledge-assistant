# knowledge-assistant/backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from sqlmodel import Field, SQLModel, create_engine, Session, select
from typing import Optional, List
import os
import time
from pypdf import PdfReader # Do ekstrakcji PDF
from sentence_transformers import SentenceTransformer # Do generowania embeddingów
import numpy as np # Do pracy z numpy array (embeddingami)
from sqlalchemy import Column, ARRAY, Float
from datetime import datetime
from sqlalchemy.sql import text

# --- Konfiguracja bazy danych ---
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/knowledge_db")
engine = None # Inicjalizacja engine na None
max_retries = 10
retry_delay = 5 # seconds

# --- Modele Danych (SQLModel) ---
class KnowledgeItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    text_content: str
    original_filename: Optional[str] = None
    tags: List[str] = Field(default_factory=list, sa_column_kwargs={"type": "text[]"}) # Lista stringów jako tablica tekstowa w PG
    # Embedding wektorowy: typ Array (np. 768 floatów) w PostgreSQL, Pythonowy numpy array
    # Musimy użyć Column(ARRAY(Float)) z SQLAlchemy, żeby pgvector to obsłużył
    embedding: Optional[List[float]] = Field(default=None, sa_column=Column(ARRAY(Float)))

    # Domyślne daty
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow}, nullable=False)

    # Konfiguracja dla SQLAlchemy (potrzebna dla ARRAY(Float))
    __tablename__ = "knowledgeitem" # Nazwa tabeli w bazie danych

# --- Inicjalizacja silnika bazy danych ---
def create_db_and_tables():
    # Upewniamy się, że engine jest zainicjalizowany przed użyciem
    if engine is None:
        print("Database engine not initialized. Retrying connection...")
        _init_db_connection() # Spróbuj ponownie nawiązać połączenie

    print("Creating database tables if they don't exist...")
    SQLModel.metadata.create_all(engine)
    print("Database tables created (or already exist).")


# Funkcja do nawiązania połączenia z bazą danych z ponawianiem
def _init_db_connection():
    global engine
    for i in range(max_retries):
        try:
            print(f"Attempting to connect to database ({i+1}/{max_retries})...")
            engine = create_engine(DATABASE_URL)
            # Testowe zapytanie aby sprawdzić połączenie
            with Session(engine) as session:
                session.execute(text("SELECT 1"))
            print("Successfully connected to the database!")
            return
        except Exception as e:
            print(f"Database connection failed: {e}")
            if i < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print("Max retries reached. Could not connect to database.")
                raise # Rzuć wyjątek, jeśli nie udało się połączyć po wielu próbach

# --- Funkcja do generowania embeddingów ---
model = None # Model do embeddingów
def get_embedding_model():
    global model
    if model is None:
        print("Loading Sentence Transformer model...")
        # Możesz wybrać inny model, np. 'all-MiniLM-L6-v2' (mniejszy, szybszy)
        # 'all-MiniLM-L12-v2' jest dobrym kompromisem
        model = SentenceTransformer('all-MiniLM-L12-v2')
        print("Sentence Transformer model loaded.")
    return model

def generate_embedding(text: str) -> List[float]:
    embedding_model = get_embedding_model()
    # Ensure input is a string
    if not isinstance(text, str):
        text = str(text) # Convert to string if not already
    embedding = embedding_model.encode(text)
    return embedding.tolist() # Zwracamy listę floatów, aby pasowało do typu w SQLModel/pgvector

# --- Zależność do sesji bazy danych ---
def get_session():
    with Session(engine) as session:
        yield session

# --- Aplikacja FastAPI ---
app = FastAPI()

# Zdarzenia startu/stopu aplikacji
@app.on_event("startup")
def on_startup():
    _init_db_connection() # Nawiąż połączenie przy starcie
    create_db_and_tables() # Utwórz tabele
    # TODO: W przyszłości uruchom model do generowania embeddingów tutaj asynchronicznie, jeśli jest duży

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running!"}

@app.get("/")
async def root():
    return {"message": "Welcome to Knowledge Assistant Backend! Access /health to check status."}

# --- Endpointy CRUD dla KnowledgeItem ---

@app.post("/api/knowledge_items/upload_text", response_model=KnowledgeItem)
async def upload_text_note(
    title: str,
    content: str,
    tags: Optional[str] = None, # Tagi jako string rozdzielony przecinkami
    session: Session = Depends(get_session)
):
    item_tags = [tag.strip() for tag in tags.split(',')] if tags else []

    # Generowanie embeddingu
    embedding = generate_embedding(content)

    knowledge_item = KnowledgeItem(
        title=title,
        text_content=content,
        tags=item_tags,
        embedding=embedding
    )
    session.add(knowledge_item)
    session.commit()
    session.refresh(knowledge_item)
    return knowledge_item

@app.post("/api/knowledge_items/upload_pdf", response_model=KnowledgeItem)
async def upload_pdf_file(
    title: str = File(...), # Title from form data
    pdf_file: UploadFile = File(...),
    tags: Optional[str] = File(None), # Tags from form data
    session: Session = Depends(get_session)
):
    try:
        # Ekstrakcja tekstu z PDF
        reader = PdfReader(pdf_file.file)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() or "" # Użyj .extract_text()

        if not full_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF or PDF is empty.")

        item_tags = [tag.strip() for tag in tags.split(',')] if tags else []

        # Generowanie embeddingu
        embedding = generate_embedding(full_text)

        knowledge_item = KnowledgeItem(
            title=title,
            text_content=full_text,
            original_filename=pdf_file.filename,
            tags=item_tags,
            embedding=embedding
        )
        session.add(knowledge_item)
        session.commit()
        session.refresh(knowledge_item)
        return knowledge_item
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@app.get("/api/knowledge_items", response_model=List[KnowledgeItem])
async def get_all_knowledge_items(session: Session = Depends(get_session)):
    items = session.exec(select(KnowledgeItem)).all()
    return items

@app.get("/api/knowledge_items/{item_id}", response_model=KnowledgeItem)
async def get_knowledge_item(item_id: int, session: Session = Depends(get_session)):
    item = session.get(KnowledgeItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    return item

# TODO: Dodaj endpointy PUT i DELETE w przyszłości