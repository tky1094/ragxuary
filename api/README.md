# ragxuary Backend

FastAPI backend for ragxuary - a RAG-native documentation tool.

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 16+ with pgvector extension
- Redis 7+

### Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Create environment file
cp .env.example .env
```

### Database Setup

```bash
# Run migrations
alembic upgrade head
```

### Development

```bash
# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000

API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Testing

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=term-missing

# Run specific test file
pytest tests/test_auth.py

# Run specific test function
pytest tests/test_auth.py::test_register_user
```

### Linting

```bash
# Check for issues
ruff check .
ruff format --check .

# Auto-fix issues
ruff check --fix .
ruff format .
```

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **ORM**: SQLAlchemy 2.0+ (async)
- **Validation**: Pydantic 2.0+
- **Migrations**: Alembic
- **Testing**: pytest + pytest-asyncio + httpx
- **Linting**: ruff

## Project Structure

```
api/
├── app/
│   ├── api/           # API routes and dependencies
│   │   └── v1/        # Version 1 endpoints
│   ├── core/          # Core configuration (DB, Redis, security)
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── repositories/  # Data access layer
│   ├── services/      # Business logic
│   └── main.py        # Application entry point
├── alembic/           # Database migrations
└── tests/             # Test files
```

## Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

## Detailed Documentation

For detailed coding conventions, architecture decisions, and development guidelines, see [AGENTS.md](./AGENTS.md).
