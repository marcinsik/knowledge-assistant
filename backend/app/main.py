# knowledge-assistant/backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, SQLModel, create_engine, Session, select
from typing import Optional, List
import os
import time
from pypdf import PdfReader # Do ekstrakcji PDF
from sentence_transformers import SentenceTransformer # Do generowania embeddingów
import numpy as np # Do pracy z numpy array (embeddingami)
from sqlalchemy import Column, ARRAY, Float, String, text # Dodaj String tutaj
from datetime import datetime
from sklearn.metrics.pairwise import cosine_similarity # Do obliczania podobieństwa cosinusowego
from fastapi.responses import FileResponse, StreamingResponse
from fpdf import FPDF
import shutil

# --- Aplikacja FastAPI ---
app = FastAPI()

# --- Konfiguracja CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

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

    # Zmieniona definicja tags: teraz używamy Column(ARRAY(String))
    # Należy zaimportować String z sqlalchemy.
    # Field() w SQLModel nie zawsze dobrze współpracuje z List[str] i sa_column_kwargs={"type": "text[]"}
    # Jawne użycie Column(ARRAY(String)) jest bardziej klarowne i niezawodne.
    tags: List[str] = Field(default_factory=list, sa_column=Column(ARRAY(String))) # <- ZMIANA TUTAJ

    # Embedding wektorowy dla treści (zostaje)
    embedding: Optional[List[float]] = Field(default=None, sa_column=Column(ARRAY(Float)))

    # NOWOŚĆ: Embedding wektorowy dla skonsolidowanych tagów (zostaje)
    tags_embedding: Optional[List[float]] = Field(default=None, sa_column=Column(ARRAY(Float)))

    # Domyślne daty
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow}, nullable=False)

    __tablename__ = "knowledgeitem"

# --- Inicjalizacja silnika bazy danych ---
def create_db_and_tables():
    # Upewniamy się, że engine jest zainicjalizowany przed użyciem
    if engine is None:
        print("Database engine not initialized. Retrying connection...")
        _init_db_connection() # Spróbuj ponownie nawiązać połączenie

    print("Creating database tables if they don't exist...")
    SQLModel.metadata.create_all(engine)
    print("Database tables created (or already exist).")
    # NOWOŚĆ: Upewniamy się, że pgvector jest włączony
    try:
        with Session(engine) as session:
            session.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            session.commit()
            print("pgvector extension ensured.")
    except Exception as e:
        print(f"Failed to ensure pgvector extension: {e}")
        # Nie rzucamy wyjątku, jeśli to nie jest krytyczne dla startu, ale logujemy.

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

# Ścieżka do katalogu na pliki PDF
PDF_UPLOAD_DIR = os.getenv("PDF_UPLOAD_DIR", "uploaded_pdfs")
os.makedirs(PDF_UPLOAD_DIR, exist_ok=True)

# Zdarzenia startu/stopu aplikacji
@app.on_event("startup")
def on_startup():
    _init_db_connection() # Nawiąż połączenie przy starcie
    create_db_and_tables() # Utwórz tabele i włącz pgvector
    # W przyszłości uruchom model do generowania embeddingów tutaj asynchronicznie, jeśli jest duży
    # Upewnij się, że model jest załadowany przy starcie dla lepszej wydajności
    get_embedding_model()


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running!"}

@app.get("/")
async def root():
    return {"message": "Welcome to Knowledge Assistant Backend! Access /health to check status."}

# --- Endpointy CRUD dla KnowledgeItem ---

@app.post("/api/knowledge_items/upload_text", response_model=KnowledgeItem)
async def upload_text_note(
    title: str = Form(...), # Użyj Form do oznaczenia, że to pole formularza
    content: str = Form(...), # Użyj Form do oznaczenia, że to pole formularza
    tags: Optional[str] = Form(None), # Opcjonalne pole formularza
    session: Session = Depends(get_session)
):
    item_tags = [tag.strip() for tag in tags.split(',')] if tags else []
    # Generowanie embeddingu dla treści
    content_embedding = generate_embedding(content)

    # NOWOŚĆ: Generowanie embeddingu dla skonsolidowanych tagów
    # Łączymy wszystkie tagi w jeden string, aby wygenerować jeden embedding dla całej "kategorii"
    tags_concatenated = " ".join(item_tags)
    tags_embedding = generate_embedding(tags_concatenated) if tags_concatenated else None


    knowledge_item = KnowledgeItem(
        title=title,
        text_content=content,
        tags=item_tags,
        embedding=content_embedding,
        tags_embedding=tags_embedding # Przypisujemy embedding tagów
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
        # Zapisz oryginalny plik PDF na dysku
        pdf_path = os.path.join(PDF_UPLOAD_DIR, pdf_file.filename)
        with open(pdf_path, "wb") as f:
            shutil.copyfileobj(pdf_file.file, f)
        pdf_file.file.seek(0)  # Reset do ekstrakcji tekstu
        # Ekstrakcja tekstu z PDF
        reader = PdfReader(pdf_file.file)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() or ""

        if not full_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF or PDF is empty.")

        item_tags = [tag.strip() for tag in tags.split(',')] if tags else []

        # Generowanie embeddingu dla treści
        content_embedding = generate_embedding(full_text)

        # NOWOŚĆ: Generowanie embeddingu dla skonsolidowanych tagów
        tags_concatenated = " ".join(item_tags)
        tags_embedding = generate_embedding(tags_concatenated) if tags_concatenated else None

        knowledge_item = KnowledgeItem(
            title=title,
            text_content=full_text,
            original_filename=pdf_file.filename,
            tags=item_tags,
            embedding=content_embedding,
            tags_embedding=tags_embedding # Przypisujemy embedding tagów
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

@app.get("/api/knowledge_items/pdf/{item_id}")
def download_pdf(item_id: int, session: Session = Depends(get_session)):
    item = session.get(KnowledgeItem, item_id)
    if not item or not item.original_filename:
        raise HTTPException(status_code=404, detail="PDF not found for this item.")
    
    pdf_path = os.path.join(PDF_UPLOAD_DIR, item.original_filename)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found on server.")
    
    return FileResponse(
        pdf_path, 
        media_type="application/pdf", 
        filename=item.original_filename,
        headers={"Content-Disposition": f"attachment; filename={item.original_filename}"}
    )

@app.get("/api/knowledge_items/note_pdf/{item_id}")
def download_note_as_pdf(item_id: int, session: Session = Depends(get_session)):
    item = session.get(KnowledgeItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Note not found.")
    
    # Create PDF from note text
    pdf = FPDF()
    pdf.add_page()
    
    # Add content with proper encoding
    title_text = f"Tytuł: {item.title}"
    content_text = f"\n\n{item.text_content}"
    
    pdf.multi_cell(0, 10, title_text)
    pdf.multi_cell(0, 10, content_text)
    
    # Generate PDF as bytes
    pdf_bytes = BytesIO()
    pdf_output = pdf.output(dest='S').encode('latin1')
    pdf_bytes.write(pdf_output)
    pdf_bytes.seek(0)
    
    filename = f"note_{item_id}.pdf"
    
    return StreamingResponse(
        BytesIO(pdf_output),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# TODO: Dodaj endpointy PUT i DELETE w przyszłości
