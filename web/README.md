# ragxuary Frontend

Next.js frontend for ragxuary - a RAG-native documentation tool.

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Development

```bash
# Start development server
npm run dev
```

The app will be available at http://localhost:3000

### Testing

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npx playwright test
```

### Building

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Linting

```bash
# Check for issues
npm run lint
npm run format:check

# Auto-fix issues
npm run format
```

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
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
npm run openapi-ts
```

## Detailed Documentation

For detailed coding conventions, architecture decisions, and development guidelines, see [AGENTS.md](./AGENTS.md).
