# Contributing to ragxuary

Thank you for your interest in contributing to ragxuary! This guide will help you get started with development.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+ (via corepack)
- Python 3.11+
- Docker and Docker Compose
- Git
- GitHub CLI (`gh`)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/tky1094/ragxuary.git
   cd ragxuary
   ```

2. **Start infrastructure services**
   ```bash
   docker compose up -d postgres redis
   ```

3. **Set up the backend**
   ```bash
   cd api
   python -m venv .venv
   source .venv/bin/activate
   pip install -e ".[dev]"
   alembic upgrade head
   ```

4. **Set up the frontend**
   ```bash
   cd web
   corepack enable
   pnpm install
   ```

5. **Create environment files**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Development Workflow

### 1. Find or Create an Issue

All work should be tied to a GitHub Issue.

```bash
# View available issues
gh issue list

# Create a new issue (if needed)
gh issue create
```

### 2. Create a Branch

```bash
# Feature
git checkout -b feature/<issue_number>-<short_description>

# Bug fix
git checkout -b fix/<issue_number>-<short_description>

# Examples
git checkout -b feature/25-user-authentication
git checkout -b fix/30-login-redirect
```

### 3. Implement Your Changes

- Keep commits small and focused
- Include the issue number in commit messages
- Write tests for new functionality

### 4. Run Tests

**Backend:**
```bash
cd api
source .venv/bin/activate
pytest --cov=app --cov-report=term-missing
```

**Frontend:**
```bash
cd web
pnpm run test:run
pnpm run test:coverage  # For coverage report
```

### 5. Run Linters

**Backend:**
```bash
cd api
ruff check .
ruff format --check .

# Auto-fix
ruff check --fix .
ruff format .
```

**Frontend:**
```bash
cd web
pnpm run check

# Auto-fix
pnpm run check:fix
```

### 6. Create a Pull Request

```bash
git push -u origin <branch-name>
gh pr create
```

## Code Style

### Pre-commit Hooks

We recommend setting up pre-commit hooks to automatically check code before commits:

```bash
# Install pre-commit
pip install pre-commit
pre-commit install
```

### Commit Message Format

```
<type>: <description> (#<issue_number>)

# Types
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Formatting (no functional changes)
refactor: Refactoring
test:     Add or modify tests
chore:    Build or auxiliary tools
```

**Examples:**
```
feat: Add user authentication (#25)
fix: Resolve login redirect issue (#30)
test: Add unit tests for auth service (#25)
```

## Testing Requirements

### Coverage Targets

| Area | Minimum (MUST) | Target (SHOULD) |
|------|----------------|-----------------|
| Backend | 70% | 80%+ |
| Frontend | 60% | 70%+ |
| Critical business logic | 80% | 90%+ |

### Running Tests

**Backend:**
```bash
cd api && pytest --cov=app --cov-report=term-missing
```

**Frontend:**
```bash
cd web && pnpm run test:run
```

### Docker Compose Verification

For major changes, verify with Docker Compose:

```bash
docker compose down -v
docker compose up -d --build
docker compose exec api alembic upgrade head
curl http://localhost:8000/api/v1/health
```

## Project Structure

```
ragxuary/
├── web/              # Next.js frontend (see web/README.md)
├── api/              # FastAPI backend (see api/README.md)
├── docs/             # Documentation
└── docker-compose.yml
```

## API Client Generation

When backend API changes, regenerate the frontend client:

```bash
./scripts/generate-client.sh
```

This generates TypeScript types and API functions in `web/client/`.

## Need Help?

- Check existing issues and discussions
- Read the [Requirements](docs/REQUIREMENTS.md) for detailed specifications
- Review `web/AGENTS.md` and `api/AGENTS.md` for coding conventions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
