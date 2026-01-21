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
| Frontend | Next.js 16+, TypeScript, TailwindCSS, shadcn/ui |
| Package Manager | pnpm 9+ (via corepack) |
| Linter/Formatter | Biome |
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
│   └── REQUIREMENTS.md    # Requirements specification
├── scripts/
│   └── generate-client.sh # API client generation
└── docker-compose.yml
```

---

## Issue-Driven Development

All development follows a GitHub Issue-driven workflow:

```
Issue → Branch → Implement → Test → Verification → Merge → Close Issue
```

### Issue Guidelines

- Use labels: `frontend`, `backend`, `infra`, `documentation`, `bug`, `enhancement`
- Include task checklist and acceptance criteria
- Reference related issues

### Development Flow

1. Check issue: `gh issue view <number>`
2. Create branch: `git checkout -b feature/<issue_number>-<short_description>`
3. Implement with small commits (include issue number)
4. Run verification flow before PR

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

## Verification Flow

Before declaring an issue complete, run the following verification flow:

### Step 1: Update Dependencies

```bash
# Backend
cd api && source .venv/bin/activate && uv pip install -e ".[dev]"

# Frontend
cd web && pnpm install
```

### Step 2: Run Tests

```bash
# Backend (target: 70% MUST, 80% SHOULD)
cd api && source .venv/bin/activate && pytest --cov=app --cov-report=term-missing

# Frontend (target: 60% MUST, 70% SHOULD)
cd web && pnpm run test:run
cd web && pnpm run test:coverage  # For coverage report
```

### Step 3: Lint Check

```bash
# Backend
cd api && ruff check . && ruff format --check .

# Frontend
cd web && pnpm run check
```

### Step 4: Docker Compose Verification (for major changes)

```bash
docker compose down -v
docker compose up -d --build
docker compose exec api alembic upgrade head
curl -s http://localhost:8000/api/v1/health | jq .
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ja/login  # Should return 200
```

### Verification Checklist

```markdown
### Tests
- [ ] Backend tests pass
- [ ] Frontend tests pass
- [ ] Coverage meets targets

### Lint
- [ ] Backend lint passes
- [ ] Frontend lint passes

### Docker Compose (if applicable)
- [ ] Build succeeds
- [ ] All services healthy
- [ ] Migrations succeed
- [ ] Health check passes
- [ ] Frontend pages accessible

### Issue
- [ ] All tasks completed
- [ ] Acceptance criteria met
```

---

## API Client Regeneration

When backend API schema changes, regenerate the frontend client:

```bash
# From project root
./scripts/generate-client.sh
```

This script:
1. Extracts OpenAPI schema from backend
2. Generates client code using `@hey-api/openapi-ts`
3. Outputs to `web/client/`

**Generated files:**
| File | Content |
|------|---------|
| `sdk.gen.ts` | API call functions |
| `types.gen.ts` | TypeScript types |
| `zod.gen.ts` | Zod validation schemas |
| `@tanstack/react-query.gen.ts` | React Query hooks |

> **Note:** CI automatically creates a PR when API schema changes in `api/app/` are merged to main.

---

## Test Coverage Targets

| Area | SHOULD | MUST |
|------|--------|------|
| Backend | 80%+ | 70% |
| Frontend | 70%+ | 60% |
| Critical business logic | 90%+ | 80% |

---

## Quick Command Reference

| Operation | Command |
|-----------|---------|
| Issue list | `gh issue list` |
| Issue detail | `gh issue view <number>` |
| Backend test | `cd api && pytest --cov=app` |
| Frontend test | `cd web && pnpm run test:run` |
| Frontend check | `cd web && pnpm run check` |
| Docker build | `docker compose up -d --build` |
| Docker status | `docker compose ps` |
| Migration | `docker compose exec api alembic upgrade head` |
| Health check | `curl http://localhost:8000/api/v1/health` |

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
