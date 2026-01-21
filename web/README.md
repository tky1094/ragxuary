# ragxuary Frontend

Next.js frontend for ragxuary - a RAG-native documentation tool.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+ (via corepack)

### Setup

```bash
# Enable corepack (if not already enabled)
corepack enable

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local
```

### Development

```bash
# Start development server
pnpm run dev
```

The app will be available at http://localhost:3000

### Testing

```bash
# Run tests in watch mode
pnpm run test

# Run tests once
pnpm run test:run

# Run tests with coverage
pnpm run test:coverage

# Run E2E tests
pnpm exec playwright test
```

### Building

```bash
# Build for production
pnpm run build

# Start production server
pnpm run start
```

### Linting and Formatting

```bash
# Check for issues (lint + format)
pnpm run check

# Auto-fix issues
pnpm run check:fix

# Lint only
pnpm run lint
pnpm run lint:fix

# Format only
pnpm run format
pnpm run format:check
```

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Package Manager**: pnpm
- **Linter/Formatter**: Biome
- **State Management**: TanStack Query + Zustand
- **Testing**: Vitest + React Testing Library + Playwright
- **i18n**: next-intl

## Project Structure

```
web/
├── app/           # Next.js App Router (pages and layouts)
├── features/      # Feature modules (auth, projects, etc.)
├── shared/        # Shared components and utilities
├── client/        # Auto-generated API client
├── messages/      # Translation files (ja.json, en.json)
└── i18n/          # Internationalization config
```

## API Client

The API client is auto-generated from the backend OpenAPI schema:

```bash
# Regenerate client (from project root)
./scripts/generate-client.sh

# Or from web directory
pnpm run openapi-ts
```

## Detailed Documentation

For detailed coding conventions, architecture decisions, and development guidelines, see [AGENTS.md](./AGENTS.md).
