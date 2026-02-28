"""Seed script to populate sample documents for development.

Usage:
    # Basic usage (uses defaults: localhost:8000)
    python scripts/seed_documents.py --email admin@example.com --password YourPass123

    # Specify API URL and project slug
    python scripts/seed_documents.py \
        --api-url http://localhost:8000 \
        --email admin@example.com \
        --password YourPass123 \
        --project-slug my-project

    # Create a new project automatically
    python scripts/seed_documents.py \
        --email admin@example.com \
        --password YourPass123 \
        --create-project
"""

import argparse
import sys
import time

import httpx

API_PREFIX = "/api/v1"

# Sample document tree structure
# Each entry: (path, title, is_folder, content)
SAMPLE_DOCUMENTS: list[tuple[str, str, bool, str | None]] = [
    # --- Top-level folders ---
    ("guides", "Guides", True, None),
    ("api-reference", "API Reference", True, None),
    ("examples", "Examples", True, None),
    # --- Root document ---
    (
        "introduction",
        "Introduction",
        False,
        """\
# Introduction

Welcome to the **ragxuary** documentation! This guide will help you get started
with building and deploying your own RAG-powered documentation platform.

## What is ragxuary?

ragxuary is a documentation tool that combines:

- **Markdown-based editing** with a VSCode-like interface
- **AI-powered search** using Retrieval-Augmented Generation (RAG)
- **Self-hosted deployment** for full data sovereignty

## Key Features

| Feature | Description |
|---------|-------------|
| Markdown Editor | CodeMirror 6 based editor with live preview |
| Document Viewer | VitePress-like 3-column layout |
| RAG Chat | AI chat grounded in your documentation |
| Access Control | Role-based permissions (viewer/editor/admin) |

## Quick Links

- [Getting Started](./guides/getting-started) - Set up your first project
- [Installation](./guides/installation) - Install and configure ragxuary
- [API Reference](./api-reference/overview) - REST API documentation
""",
    ),
    # --- Guides ---
    (
        "guides/getting-started",
        "Getting Started",
        False,
        """\
# Getting Started

This guide walks you through creating your first project and writing documentation.

## Prerequisites

Before you begin, make sure you have:

- [ ] Docker and Docker Compose installed
- [ ] A modern web browser (Chrome, Firefox, Safari, Edge)
- [ ] Basic familiarity with Markdown

## Step 1: Create a Project

1. Log in to your ragxuary instance
2. Click **"New Project"** on the dashboard
3. Fill in the project details:
   - **Name**: Your project name
   - **Slug**: URL-friendly identifier (e.g., `my-docs`)
   - **Visibility**: Public or Private

## Step 2: Write Your First Document

Navigate to the **Edit** tab and create a new document:

```markdown
# My First Document

Hello, world! This is my first document in ragxuary.

## Section 1

Content goes here...
```

## Step 3: Preview and Publish

Switch to the **Docs** tab to see your rendered documentation with:
- Automatic table of contents
- Syntax highlighting
- Navigation sidebar

## Next Steps

- Read the [Installation Guide](./installation) for self-hosting
- Learn about [Configuration](./configuration) options
- Explore the [API Reference](../api-reference/overview)
""",
    ),
    (
        "guides/installation",
        "Installation",
        False,
        """\
# Installation

ragxuary can be deployed using Docker Compose for both development and production.

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 10 GB | 50 GB |
| Docker | 24+ | Latest |

## Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/tky1094/ragxuary.git
cd ragxuary

# Copy environment file
cp .env.example .env

# Start all services
docker compose up -d
```

## Environment Variables

Key configuration options in `.env`:

```bash
# Database
POSTGRES_USER=ragxuary
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=ragxuary

# Application
SECRET_KEY=your_secret_key
API_URL=http://localhost:8000
WEB_URL=http://localhost:3000
```

## Verify Installation

After starting, verify all services are running:

```bash
# Check service health
docker compose ps

# Test API health endpoint
curl http://localhost:8000/api/v1/health
```

Expected response:

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

## Troubleshooting

### Port Conflicts

If ports 3000 or 8000 are already in use:

```bash
# Change ports in docker-compose.yml
ports:
  - "3001:3000"  # Web
  - "8001:8000"  # API
```

### Database Connection Issues

```bash
# Check database logs
docker compose logs postgres

# Reset database
docker compose down -v
docker compose up -d
```
""",
    ),
    (
        "guides/configuration",
        "Configuration",
        False,
        """\
# Configuration

ragxuary is configured through environment variables and project settings.

## Application Settings

### Authentication

```bash
# JWT settings
JWT_SECRET_KEY=your_jwt_secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

### File Upload

```bash
# Upload limits
MAX_UPLOAD_SIZE_MB=10
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_STORAGE_PATH=./storage/uploads
```

## Project-Level Settings

Each project can be configured independently:

### Visibility

| Setting | Description |
|---------|-------------|
| `private` | Only project members can access |
| `public` | Anyone can view (editing requires membership) |

### Chat Settings

> **Note**: RAG chat requires an LLM provider to be configured.

```yaml
chat_enabled: true
llm_provider: openai
llm_model: gpt-4o
```

## Advanced Configuration

### Redis Cache

```bash
REDIS_URL=redis://localhost:6379/0
CACHE_TTL_SECONDS=300
```

### Logging

```bash
LOG_LEVEL=INFO        # DEBUG, INFO, WARNING, ERROR
LOG_FORMAT=json       # json or text
```
""",
    ),
    # --- API Reference ---
    (
        "api-reference/overview",
        "API Overview",
        False,
        """\
# API Overview

ragxuary provides a RESTful API for managing projects, documents, and users.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All API requests (except public endpoints) require a Bearer token:

```bash
curl -H "Authorization: Bearer <access_token>" \\
  http://localhost:8000/api/v1/projects
```

### Obtain a Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "password123"}'
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

## Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login |
| `GET` | `/projects` | List projects |
| `POST` | `/projects` | Create project |
| `GET` | `/projects/{slug}` | Get project |
| `GET` | `/projects/{slug}/docs` | Get document tree |
| `PUT` | `/projects/{slug}/docs/{path}` | Create/update document |

## Rate Limiting

API requests are rate-limited to prevent abuse:

| Tier | Limit |
|------|-------|
| Anonymous | 60 req/min |
| Authenticated | 300 req/min |
| Admin | 1000 req/min |

## Error Responses

All errors follow a consistent format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

| Status Code | Meaning |
|-------------|---------|
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Missing or invalid token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `429` | Too Many Requests - Rate limit exceeded |
""",
    ),
    (
        "api-reference/authentication",
        "Authentication API",
        False,
        """\
# Authentication API

## POST /auth/register

Create a new user account.

### Request Body

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123"
}
```

### Validation Rules

| Field | Rules |
|-------|-------|
| `email` | Valid email format, unique |
| `name` | 1-100 characters, trimmed |
| `password` | Min 8 chars, at least 1 letter and 1 number |

### Response (201 Created)

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

---

## POST /auth/login

Authenticate an existing user.

### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Response (200 OK)

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | Invalid email or password |
| `403` | Account is deactivated |

---

## POST /auth/refresh

Refresh an expired access token.

### Request Body

```json
{
  "refresh_token": "eyJ..."
}
```

### Response (200 OK)

```json
{
  "access_token": "eyJ...(new)",
  "refresh_token": "eyJ...(new)",
  "token_type": "bearer"
}
```
""",
    ),
    (
        "api-reference/documents",
        "Documents API",
        False,
        """\
# Documents API

Manage documents within a project.

## GET /projects/{slug}/docs

Retrieve the document tree for a project.

### Response (200 OK)

```json
[
  {
    "id": "uuid",
    "slug": "guides",
    "path": "guides",
    "title": "Guides",
    "index": 0,
    "is_folder": true,
    "children": [
      {
        "id": "uuid",
        "slug": "getting-started",
        "path": "guides/getting-started",
        "title": "Getting Started",
        "index": 0,
        "is_folder": false,
        "children": []
      }
    ]
  }
]
```

---

## GET /projects/{slug}/docs/{path}

Retrieve a single document.

### Response (200 OK)

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "parent_id": "uuid or null",
  "slug": "getting-started",
  "path": "guides/getting-started",
  "index": 0,
  "is_folder": false,
  "title": "Getting Started",
  "content": "# Getting Started\\n\\nWelcome...",
  "created_at": "2026-01-28T12:00:00Z",
  "updated_at": "2026-01-28T12:00:00Z"
}
```

---

## PUT /projects/{slug}/docs/{path}

Create or update a document (upsert).

### Request Body

```json
{
  "title": "Getting Started",
  "content": "# Getting Started\\n\\nWelcome to the docs.",
  "is_folder": false,
  "message": "Update getting started guide"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Document title (1-200 chars) |
| `content` | string | No | Markdown content |
| `is_folder` | boolean | No | Whether this is a folder (default: false) |
| `message` | string | No | Commit message (max 500 chars) |

### Response (200 OK)

Returns the created/updated `DocumentRead` object.

---

## DELETE /projects/{slug}/docs/{path}

Delete a document and all its children.

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `message` | string | Optional deletion message |

### Response (204 No Content)

No response body.
""",
    ),
    # --- Examples ---
    (
        "examples/basic-usage",
        "Basic Usage",
        False,
        """\
# Basic Usage Examples

## Creating a Simple Documentation Site

### 1. Project Structure

A typical ragxuary project has this document structure:

```
introduction
guides/
  getting-started
  installation
  configuration
api-reference/
  overview
  endpoints
```

### 2. Writing Markdown

ragxuary supports **GitHub Flavored Markdown** (GFM):

#### Text Formatting

- **Bold text** with `**bold**`
- *Italic text* with `*italic*`
- ~~Strikethrough~~ with `~~strikethrough~~`
- `Inline code` with backticks

#### Task Lists

- [x] Create project
- [x] Write introduction
- [ ] Add API reference
- [ ] Configure RAG chat

#### Tables

| Syntax | Description | Example |
|--------|-------------|---------|
| `#` | Heading 1 | `# Title` |
| `##` | Heading 2 | `## Section` |
| `- [ ]` | Task item | `- [ ] Todo` |
| `` ``` `` | Code block | See below |

### 3. Code Blocks

Syntax highlighting is supported for many languages:

**Python:**
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello, World!"}
```

**TypeScript:**
```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

async function fetchDocument(path: string): Promise<Document> {
  const response = await fetch(`/api/v1/docs/${path}`);
  return response.json();
}
```

**Bash:**
```bash
#!/bin/bash
echo "Starting ragxuary..."
docker compose up -d
echo "Services are running!"
```
""",
    ),
    (
        "examples/diagrams",
        "Diagrams",
        False,
        """\
# Diagrams with Mermaid

ragxuary supports Mermaid diagrams in Markdown. Use fenced code blocks with
the `mermaid` language identifier.

## System Architecture

```mermaid
flowchart TB
  subgraph Frontend
    Web[Next.js Web App]
  end
  subgraph Backend
    API[FastAPI Server]
    Worker[Background Worker]
  end
  subgraph Storage
    DB[(PostgreSQL)]
    Redis[(Redis)]
  end

  Web --> API
  API --> DB
  API --> Redis
  Worker --> DB
  Worker --> Redis
```

## Authentication Flow

```mermaid
flowchart LR
  User -->|POST /auth/login| API
  API -->|Verify credentials| DB[(Database)]
  DB -->|User record| API
  API -->|JWT tokens| User
  User -->|Bearer token| ProtectedAPI[Protected Endpoint]
```

## Document Lifecycle

```mermaid
flowchart TB
  Create[Create Document] --> Draft[Draft]
  Draft -->|Edit| Draft
  Draft -->|Save| Published[Published]
  Published -->|Edit| NewRevision[New Revision]
  NewRevision -->|Save| Published
  Published -->|Delete| Archived[Archived]
```

## Non-Mermaid Code Block

Regular code blocks are still highlighted normally:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def health():
    return {"status": "ok"}
```
""",
    ),
    (
        "examples/advanced-usage",
        "Advanced Usage",
        False,
        """\
# Advanced Usage Examples

## Organizing Large Documentation

### Nested Folder Structure

For larger projects, organize documents into logical sections:

```
overview
architecture/
  system-design
  data-flow
  security
guides/
  user-guides/
    getting-started
    writing-docs
    collaboration
  admin-guides/
    setup
    user-management
    backup-restore
api/
  v1/
    auth
    projects
    documents
  webhooks
```

### Document Ordering

Documents are ordered by their `index` field within the same parent.
Drag and drop in the editor to reorder.

## Working with the API

### Bulk Document Creation

Use the batch update API to create multiple documents at once:

```python
import httpx

documents = [
    {"path": "guides/intro", "title": "Introduction", "content": "# Intro"},
    {"path": "guides/setup", "title": "Setup", "content": "# Setup"},
    {"path": "guides/usage", "title": "Usage", "content": "# Usage"},
]

response = httpx.put(
    "http://localhost:8000/api/v1/projects/my-project/docs/batch",
    json={"documents": documents, "message": "Add guide documents"},
    headers={"Authorization": f"Bearer {token}"},
)
```

### Document History

Track changes over time using the revision history:

```bash
# Get document history
curl -H "Authorization: Bearer $TOKEN" \\
  "http://localhost:8000/api/v1/projects/my-project/docs/guides/intro/history"
```

Response includes all revisions with change types:

```json
[
  {
    "id": "rev-uuid",
    "change_type": "update",
    "title": "Introduction",
    "created_at": "2026-02-01T10:00:00Z",
    "user_name": "Admin",
    "message": "Fix typo in introduction"
  }
]
```
""",
    ),
]


def login(client: httpx.Client, email: str, password: str) -> str:
    """Login and return access token."""
    resp = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": email, "password": password},
    )
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code} {resp.text}")
        sys.exit(1)
    token = resp.json()["access_token"]
    print(f"Logged in as {email}")
    return token


def get_or_create_project(
    client: httpx.Client, headers: dict, slug: str, create: bool
) -> str:
    """Get existing project or create a new one. Returns project slug."""
    resp = client.get(f"{API_PREFIX}/projects/{slug}", headers=headers)
    if resp.status_code == 200:
        print(f"Using existing project: {slug}")
        return slug

    if not create:
        print(f"Project '{slug}' not found. Use --create-project to create it.")
        sys.exit(1)

    resp = client.post(
        f"{API_PREFIX}/projects",
        headers=headers,
        json={
            "slug": slug,
            "name": slug.replace("-", " ").title(),
            "description": "Sample project with seed documentation",
            "visibility": "public",
        },
    )
    if resp.status_code == 201:
        print(f"Created project: {slug}")
        return slug

    print(f"Failed to create project: {resp.status_code} {resp.text}")
    sys.exit(1)


def seed_documents(client: httpx.Client, headers: dict, project_slug: str) -> None:
    """Create sample documents in the project."""
    total = len(SAMPLE_DOCUMENTS)
    success = 0
    skipped = 0

    for i, (path, title, is_folder, content) in enumerate(SAMPLE_DOCUMENTS, 1):
        payload: dict = {
            "title": title,
            "is_folder": is_folder,
            "message": f"Seed: add {title}",
        }
        if content is not None:
            payload["content"] = content

        resp = client.put(
            f"{API_PREFIX}/projects/{project_slug}/docs/{path}",
            headers=headers,
            json=payload,
        )

        status = resp.status_code
        if status == 200:
            icon = "+" if "created" not in resp.text.lower() else "+"
            print(f"  [{i:2d}/{total}] {icon} {path}")
            success += 1
        elif status == 409:
            print(f"  [{i:2d}/{total}] = {path} (already exists)")
            skipped += 1
        else:
            print(f"  [{i:2d}/{total}] ! {path} FAILED ({status}: {resp.text})")

        # Small delay to ensure ordering
        time.sleep(0.05)

    print(
        f"\nDone: {success} created, {skipped} skipped, {total - success - skipped} failed"
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed sample documents for development"
    )
    parser.add_argument(
        "--api-url",
        default="http://localhost:8000",
        help="API base URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--email",
        required=True,
        help="Login email address",
    )
    parser.add_argument(
        "--password",
        required=True,
        help="Login password",
    )
    parser.add_argument(
        "--project-slug",
        default="sample-docs",
        help="Project slug to seed documents into (default: sample-docs)",
    )
    parser.add_argument(
        "--create-project",
        action="store_true",
        help="Create the project if it doesn't exist",
    )
    args = parser.parse_args()

    client = httpx.Client(base_url=args.api_url, timeout=30.0)

    print(f"Connecting to {args.api_url}...")
    token = login(client, args.email, args.password)
    headers = {"Authorization": f"Bearer {token}"}

    slug = get_or_create_project(
        client, headers, args.project_slug, args.create_project
    )

    print(f"\nSeeding documents into project '{slug}'...")
    seed_documents(client, headers, slug)


if __name__ == "__main__":
    main()
