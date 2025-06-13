# knowledge-assistant/backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
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

# --- Aplikacja FastAPI ---
app = FastAPI()

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
    title: str,
    content: str,
    tags: Optional[str] = None, # Tagi jako string rozdzielony przecinkami
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

@app.get("/api/knowledge_items/{item_id}", response_model=KnowledgeItem)
async def get_knowledge_item(item_id: int, session: Session = Depends(get_session)):
    item = session.get(KnowledgeItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    return item

# --- NOWOŚĆ: Endpoint do semantycznego wyszukiwania po tagach ---
@app.get("/api/knowledge_items/tags_semantic_search_results", response_model=List[KnowledgeItem])
async def search_by_tags_semantic(
    query_tags: str = Query(..., description="Tags to search for, comma-separated."),
    top_k: int = Query(5, description="Number of top similar items to return."),
    session: Session = Depends(get_session)
):
    # Generowanie embeddingu dla zapytania (tagów)
    query_tags_list = [tag.strip() for tag in query_tags.split(',')]
    query_tags_concatenated = " ".join(query_tags_list)

    if not query_tags_concatenated:
        raise HTTPException(status_code=400, detail="Please provide at least one tag for semantic search.")

    query_embedding = generate_embedding(query_tags_concatenated)

    # Zapytanie do bazy danych używające operatora odległości L2 (Euklidesowej) pgvector
    # 'embedding_vector <-> query_vector' -> odległość Euklidesowa
    # 'embedding_vector <-> query_vector' ORDER BY odległość LIMIT k -> najbliżsi sąsiedzi
    # Używamy operatora '<->' (L2 distance), pgvector obsługuje również '<=>' (cosinusowa) i '<#>' (wektor hamminga)
    # Dla embeddingów SentenceTransformer cosinusowa odległość jest często preferowana, ale L2 też działa.
    # Ważne: pgvector najlepiej działa, gdy operator jest na końcu (np. ORDER BY)
    # Oczywiście, możesz użyć cosinusowej odległości zamiast L2: `embedding <=> :query_embedding`
    # L2 distance jest często używana z ANN (Approximate Nearest Neighbor) indeksami.
    # Wartość `text()` jest potrzebna, ponieważ SQLAlchemy/SQLModel nie obsługują bezpośrednio operatora `<->`
    # dla ARRAY(Float) w ten sposób.
    # Pamiętaj, że :query_embedding to placeholder dla wartości przekazanej do zapytania.

    # Użyjemy odległości cosinusowej, która jest bardziej naturalna dla embeddingów ze SentenceTransformer.
    # W pgvector, operator `<=>` zwraca odległość cosinusową (1 - podobieństwo cosinusowe), więc
    # im mniejsza wartość, tym większe podobieństwo.
    # docs: https://github.com/pgvector/pgvector#distance-functions
    # A B <-> C D	L2 distance
    # A B <=> C D	cosine distance
    # A B <#> C D	inner product
    
    # Sortowanie po odległości cosinusowej:
    # W postgres: (1 - (a <-> b)) - to jest similarity score
    # Operator `<=>` w pgvector zwraca 1 - cosine_similarity.
    # więc, aby uzyskać najwyższe podobieństwo, szukamy najmniejszej wartości z `<=>`.

    try:
        # Konwertujemy query_embedding na string do zapytania SQL, np. '[1.2, 3.4, ...]'
        query_embedding_str = str(query_embedding).replace('array(', '').replace(')', '') # Czasem numpy array ma 'array()'

        # To jest surowe zapytanie SQL. Trzeba uważać na SQL Injection, ale `session.execute` z parametrami dba o to.
        # Wyszukujemy najbliższych sąsiadów w kolumnie `tags_embedding`
        results = session.exec(
            text(f"""
            SELECT *, tags_embedding <=> :query_embedding AS distance
            FROM knowledgeitem
            WHERE tags_embedding IS NOT NULL
            ORDER BY distance ASC
            LIMIT :limit
            """),
            {"query_embedding": query_embedding_str, "limit": top_k}
        ).all()

        # SQLModel zwraca tu listę słowników lub tuple. Musimy ręcznie je zmapować na KnowledgeItem
        # Lepszym podejściem jest użycie `session.query` z `func.max` lub innymi funkcjami pgvector
        # ale bezpośrednie zapytanie z `text()` jest prostsze do demonstracji.
        # Jeśli używasz SQLModel >= 0.0.14, możesz spróbować:
        # `query = select(KnowledgeItem).order_by(KnowledgeItem.tags_embedding.cosine_distance(query_embedding)).limit(top_k)`
        # Ale to wymaga, żeby `cosine_distance` było zaimplementowane w SQLModel/SQLAlchemy dla ARRAY(Float).
        # Dla bezpieczeństwa i jasności, użyjemy `text()` i ręcznego mapowania.

        # Mapowanie wyników z text() na obiekty SQLModel
        knowledge_items = []
        for row in results:
            # Row to zazwyczaj RowMapping, które działa jak słownik
            item_data = row._mapping
            # Konwertujemy listę floatów z powrotem na numpy array dla np. cosine_similarity jeśli chcemy
            # ale pgvector już obliczył odległość, więc nie musimy tego robić w Pythonie
            knowledge_items.append(KnowledgeItem(**item_data)) # Tworzymy obiekt KnowledgeItem z danych
        
        return knowledge_items

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Semantic tag search failed: {str(e)}")

# TODO: Dodaj endpointy PUT i DELETE w przyszłości