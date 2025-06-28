# Knowledge Assistant

**Knowledge Assistant** is a web application for storing, searching, and managing your personal knowledge base. You can add notes as text or upload PDF files, tag them, and quickly search through your knowledge items.

## Working Features

- Add, delete knowledge items (notes or PDFs)
- Tag your notes for easy organization
- Full-text search and filtering
- Responsive, user-friendly interface
- Toast notifications for actions and errors

## Technology Stack

- **Frontend:** React + TypeScript
- **Backend:** FastAPI (Python) + Alembic (database migrations)
- **Database:** PostgreSQL with pgvector (vector embeddings)
- **Search:** Semantic search with Sentence Transformers
- **UI Icons:** [Lucide React](https://lucide.dev/)
- **Containerization:** Docker & Docker Compose

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

---

## Running with Docker

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/knowledge-assistant.git
   cd knowledge-assistant
   ```

2. **Build and start all services:**
   ```bash
   docker compose up --build
   ```
   This will build and start both the backend and frontend containers.

3. **Access the application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)

4. **Database migrations:**
   Migrations run automatically on container startup. For manual migration management, see [MIGRATIONS.md](MIGRATIONS.md).

---

## Development (without Docker)

### Backend (FastAPI)

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run the backend server:**
   ```bash
   uvicorn main:app --reload
   ```

### Frontend (React)

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   # or
   yarn install
   ```

2. **Start the frontend development server:**
   ```bash
   npm start
   # or
   yarn start
   ```

---

## Database Migrations

This project uses Alembic for database schema management. Migrations run automatically when you start the application with Docker.

For detailed migration management, see [MIGRATIONS.md](MIGRATIONS.md).

### Quick Migration Commands

- **Create new migration:** `./create_migration.sh "migration name"`
- **Run migrations manually:** `./migrate.sh`

---

## Configuration

- The backend API URL is set to `http://localhost:8000` by default in the frontend code.  
  If you need to change it, edit the `API_BASE_URL` constant in `frontend/src/App.tsx`.

---


**Enjoy
