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
- **Database:** localhost:5432 (PostgreSQL)
- **Redis Cache:** localhost:6379

## Data Storage

The application uses Docker volumes for data persistence:
- **Database data:** Stored in `./database/pgdata/` directory
- **Uploaded PDFs:** Stored in `backend_uploads` Docker volume

To reset all data:

```bash
# Stop containers
docker compose down

# Remove database data
sudo rm -rf database/pgdata

# Remove uploaded files volume
docker volume rm knowledge-assistant_backend_uploads

# Restart application (will recreate everything)
docker compose up --build
```

## Project Structure

```
knowledge-assistant/
├── docker-compose.yml         # Docker configuration for development
├── docker-compose.prod.yml    # Docker configuration for production
├── package.json               # Root package.json for shared dependencies
├── database/                  # Database data directory
│   └── pgdata/                # PostgreSQL data (persistent)
├── backend/                   # FastAPI backend code
│   ├── Dockerfile             # Docker image for backend
│   ├── requirements.txt       # Python dependencies
│   └── app/                   # Application module
│       ├── alembic/           # Database migrations
│       ├── uploaded_pdfs/     # Directory for uploaded PDF files
│       ├── main.py            # Main application file
│       └── users.py           # User management
└── frontend/                  # React frontend code
    ├── Dockerfile.dev         # Docker image for development
    ├── Dockerfile.prod        # Docker image for production
    ├── nginx.conf             # Nginx configuration for production
    ├── package.json           # npm dependencies
    └── src/                   # React source code
        ├── components/        # React components
        ├── hooks/             # Custom React hooks
        ├── services/          # API services
        └── utils/             # Utility functions
```

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
