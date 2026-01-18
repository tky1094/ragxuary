# Backend AGENTS.md

FastAPI backend development conventions.

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.110+ | REST API |
| SQLAlchemy | 2.0+ | ORM (async) |
| Pydantic | 2.0+ | Validation |
| Alembic | latest | Migrations |
| pytest | 8+ | Testing |
| pytest-asyncio | 0.25+ | Async testing |
| httpx | 0.28+ | API test client |
| uv | latest | Package management |
| ruff | latest | Linter/Formatter |

---

## Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py              # Dependency injection
│   │   └── v1/
│   │       ├── router.py        # Router aggregation
│   │       └── endpoints/       # Individual endpoints
│   │           ├── auth.py
│   │           └── health.py
│   ├── core/
│   │   ├── database.py          # DB connection
│   │   ├── redis.py             # Redis connection
│   │   └── security.py          # Authentication & security
│   ├── models/                  # SQLAlchemy models
│   │   ├── base.py
│   │   ├── user.py
│   │   └── project.py
│   ├── schemas/                 # Pydantic schemas
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── project.py
│   ├── repositories/            # Data access layer
│   │   └── user.py
│   ├── services/                # Business logic
│   ├── config.py                # Configuration
│   └── main.py                  # Application entry point
├── alembic/                     # Migrations
│   └── versions/
├── tests/                       # Tests
│   ├── conftest.py
│   └── test_*.py
└── pyproject.toml
```

---

## Coding Conventions

### Naming Rules

| Target | Convention | Example |
|--------|------------|---------|
| Module | snake_case | `user_service.py` |
| Function | snake_case | `get_user_by_id()` |
| Class | PascalCase | `UserRepository` |
| Constant | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |

### Layer Structure

```
endpoints → services → repositories → models
    ↓           ↓            ↓
 schemas     schemas      SQLAlchemy
(Request)   (Business)    (Database)
```

- **endpoints**: HTTP request handling, validation
- **services**: Business logic
- **repositories**: Data access (CRUD operations)
- **models**: Database schema definitions
- **schemas**: Request/response definitions

### Type Hints

```python
# Required: Add type hints to all functions
from uuid import UUID
from app.models.user import User

async def get_user(user_id: UUID) -> User | None:
    ...

# Be explicit with collection types
async def get_users(skip: int = 0, limit: int = 100) -> list[User]:
    ...
```

### Pydantic Schemas

```python
from pydantic import BaseModel, EmailStr

# Request schema
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

# Response schema
class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str

    model_config = ConfigDict(from_attributes=True)
```

### Async Processing

```python
from sqlalchemy.ext.asyncio import AsyncSession

# Execute DB operations asynchronously
async def create_user(db: AsyncSession, user: UserCreate) -> User:
    db_user = User(**user.model_dump())
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user
```

### Dependency Injection

```python
from fastapi import Depends
from app.api.deps import get_db

@router.post("/users")
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    ...
```

---

## Development Commands

### Setup

```bash
# Activate virtual environment
source .venv/bin/activate

# Install dependencies (using uv)
uv pip install -e ".[dev]"
```

### Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app --cov-report=term-missing

# Specific test file
pytest tests/test_auth.py

# Specific test function
pytest tests/test_auth.py::test_register_user
```

### Lint

```bash
# Check
ruff check .
ruff format --check .

# Auto-fix
ruff check --fix .
ruff format .
```

---

## Testing Conventions

### Target Coverage

| Level | Coverage |
|-------|----------|
| SHOULD | 80%+ |
| MUST | 70% |

### Directory Structure

```
tests/
├── conftest.py              # Shared fixtures
├── unit/                    # Unit tests
│   ├── services/
│   │   └── test_user_service.py
│   └── repositories/
│       └── test_user_repository.py
└── integration/             # Integration tests
    └── api/
        ├── test_auth.py
        └── test_health.py
```

### Test Patterns

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "name": "Test User",
            "password": "TestPassword123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
```

### Fixture Usage

```python
# Utilize fixtures from conftest.py
@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    user = User(email="test@example.com", name="Test")
    db_session.add(user)
    await db_session.commit()
    return user

# Use in tests
async def test_get_user(client: AsyncClient, test_user: User):
    response = await client.get(f"/api/v1/users/{test_user.id}")
    assert response.status_code == 200
```

---

## Migrations

### Create New Migration

```bash
alembic revision --autogenerate -m "Add new_table"
```

### Run Migrations

```bash
# Apply to latest
alembic upgrade head

# Advance by one
alembic upgrade +1

# Rollback by one
alembic downgrade -1

# Check history
alembic history
```

### Migration File Naming

```
YYYYMMDD_<revision_hash>_<description>.py

# Example
20260117_382d1adc3c37_create_users_and_projects_tables.py
```

---

## API Design

### Endpoint Naming

```
GET    /api/v1/{resource}           # List
POST   /api/v1/{resource}           # Create
GET    /api/v1/{resource}/{id}      # Detail
PATCH  /api/v1/{resource}/{id}      # Update
DELETE /api/v1/{resource}/{id}      # Delete
```

### Response Format

```python
# Success: 200, 201
{"id": "...", "name": "..."}

# List: 200
[{"id": "...", "name": "..."}, ...]

# Error: 400, 401, 403, 404, 500
{"detail": "Error message"}
```

### Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (retrieve, update) |
| 201 | Success (create) |
| 204 | Success (delete, no content) |
| 400 | Validation error |
| 401 | Authentication error |
| 403 | Authorization error |
| 404 | Resource not found |
| 500 | Server error |

---

## Guidelines

### Prohibited

- Omitting type hints
- Direct DB operations in the endpoints layer (use repositories)
- Hardcoding sensitive information
- Merging without tests

### Recommended

- Prefer async processing
- Validate with Pydantic
- Implement proper exception handling
- Add logging (for critical operations)