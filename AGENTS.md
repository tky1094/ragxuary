# AGENTS.md

## Project Overview

ragxuary is a RAG-native documentation tool.

- **Self-hosting support** - Avoid the risk of entrusting confidential documents to external SaaS
- **Project-level access control** - Flexibly configure members and groups for sharing
- **Permission-aware RAG** - References and cites only information within the user's viewing permissions

---

## Technology Stack Overview

| Area | Technology |
|------|------------|
| Frontend | Next.js 14+, TypeScript, TailwindCSS, shadcn/ui |
| Backend | FastAPI, Python 3.11+, SQLAlchemy 2.0+ |
| Database | PostgreSQL 16+ (pgvector) |
| Cache | Redis 7+ |
| Infrastructure | Docker Compose |

See the `AGENTS.md` in each directory for details.

---

## Directory Structure

```
ragxuary/
├── web/                   # Next.js frontend
│   └── AGENTS.md          # Frontend conventions
├── api/                   # FastAPI backend
│   └── AGENTS.md          # Backend conventions
├── docs/
│   ├── REQUIREMENTS.md    # Requirements specification
│   └── DEVELOPMENT.md     # Development workflow
└── docker-compose.yml
```

---

## Git Conventions

### Branch Naming

```
feature/<issue_number>-<short_description>
fix/<issue_number>-<short_description>
docs/<short_description>

# Examples
feature/25-test-foundation
fix/30-login-redirect
```

### Commit Messages

```
<type>: <description> (#<issue_number>)

# type
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Formatting (no functional changes)
refactor: Refactoring
test:     Add or modify tests
chore:    Build or auxiliary tools

# Examples
feat: Add user authentication (#25)
fix: Resolve login redirect issue (#30)
```

---

## Docker Compose

### Startup

```bash
# Start services
docker compose up -d --build

# Check status
docker compose ps
```

### Migration

```bash
docker compose exec api alembic upgrade head
```

### Verification

```bash
# Backend health check
curl http://localhost:8000/api/v1/health

# Frontend check
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ja/login
```

### Cleanup

```bash
docker compose down -v
```

---

## Verification Flow (Overall)

After code changes, run the following:

### 1. Run Tests

```bash
# Backend
cd api && source .venv/bin/activate && pytest --cov=app

# Frontend
cd web && npm run test:run
```

### 2. Lint Check

```bash
# Backend
cd api && ruff check . && ruff format --check .

# Frontend
cd web && npm run lint && npm run format:check
```

### 3. Docker Compose Verification (for major changes)

```bash
docker compose up -d --build
docker compose exec api alembic upgrade head
curl http://localhost:8000/api/v1/health
```

See the `AGENTS.md` in each directory for details.

---

## Common Guidelines

### Prohibited

- Committing sensitive information to `.env` files
- Direct changes to production environment
- Merging without tests

### Recommended

- Keep commits small
- Include issue numbers in commit messages
- Follow existing code patterns

---

## Reference Documentation

- [Requirements Specification](docs/REQUIREMENTS.md) - Functional requirements, API design, DB design
- [Development Workflow](docs/DEVELOPMENT.md) - Issue-driven development, verification flow
