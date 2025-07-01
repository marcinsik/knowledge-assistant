# Knowledge Assistant WORK IN PROGRESS

**Knowledge Assistant** is a web application for storing, searching, and managing your personal knowledge base. You can add notes as text or upload PDF files, tag them for easy organization, and quickly search through your knowledge items.

## Features

- Add and delete knowledge items (notes or PDFs)
- Tag notes for easy organization
- Full-text and semantic search
- Filter by tags
- Responsive, user-friendly interface
- Toast notifications for actions and errors

## Technology Stack

- **Frontend:** React + TypeScript
- **Backend:** FastAPI (Python) + Alembic (database migrations)
- **Database:** PostgreSQL with pgvector (embedding vectors)
- **Cache:** Redis (sessions and temporary data)
- **Search:** Semantic search with Sentence Transformers
- **UI Icons:** [Lucide React](https://lucide.dev/)
- **Containerization:** Docker & Docker Compose

## Requirements

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) (v2 or newer)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/username/knowledge-assistant.git
cd knowledge-assistant

# Build and run the application
docker compose up --build
```

## Running the Application

### Development version (with hot-reloading)

```bash
docker compose up
```

### Production version

```bash
docker compose -f docker-compose.prod.yml up --build
```

### Application Access

- **Development:** [http://localhost:3000](http://localhost:3000)
- **Production:** [http://localhost](http://localhost) (port 80)
- **API Backend:** [http://localhost:8000](http://localhost:8000)


## Development (without Docker)

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

The backend API URL is set via `REACT_APP_API_URL` environment variable and defaults to `http://localhost:8000`.
