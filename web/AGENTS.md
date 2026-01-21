# Frontend AGENTS.md

Next.js frontend development conventions using **Feature-Driven Architecture**.

---

## Technology Stack

| Technology            | Version | Purpose              |
| --------------------- | ------- | -------------------- |
| Next.js               | 14+     | App Router, RSC      |
| React                 | 18+     | UI                   |
| TypeScript            | 5+      | Type safety          |
| TailwindCSS           | 3+      | Styling              |
| shadcn/ui             | latest  | UI components        |
| pnpm                  | 9+      | Package manager      |
| Biome                 | 2+      | Linter/Formatter     |
| NextAuth.js           | 5+      | Authentication       |
| next-intl             | 3+      | Internationalization |
| Vitest                | 3+      | Unit testing         |
| React Testing Library | 16+     | Component testing    |
| Playwright            | 1.50+   | E2E testing          |

---

## Directory Structure (Feature-Driven Architecture)

```
web/
├── app/                             # Next.js App Router (routing only)
│   ├── [locale]/                    # Internationalization routes (ja/en)
│   │   ├── (auth)/                  # Auth pages (Route Group)
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (public)/                # Public pages (Route Group)
│   │   │   └── docs/
│   │   ├── admin/                   # Admin panel
│   │   ├── chat/                    # RAG chat
│   │   ├── projects/                # Project management
│   │   ├── layout.tsx               # Locale layout
│   │   └── page.tsx                 # Dashboard
│   ├── api/                         # API Routes
│   │   └── auth/[...nextauth]/
│   └── layout.tsx                   # Root layout
│
├── features/                        # Feature modules
│   └── auth/                        # Authentication feature (example)
│       ├── components/              # Feature-specific components
│       │   ├── LoginForm.tsx
│       │   ├── RegisterForm.tsx
│       │   └── index.ts
│       ├── lib/                     # Feature-specific utilities
│       │   └── validations.ts
│       ├── __tests__/               # Feature tests
│       │   ├── LoginForm.test.tsx
│       │   └── RegisterForm.test.tsx
│       └── index.ts                 # Public API (barrel export)
│       # Note: Features may also contain hooks/, stores/, types/ as needed
│
├── shared/                          # Shared code across features
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── __tests__/
│   │   │   │   └── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── LanguageSwitcher.tsx
│   │   └── index.ts
│   └── lib/
│       ├── api/
│       │   └── client.ts            # API client configuration
│       ├── utils.ts                 # Utilities (cn, etc.)
│       ├── __tests__/
│       │   └── utils.test.ts
│       └── index.ts
│
├── client/                          # Auto-generated API client (hey-api)
├── i18n/                            # Internationalization config
├── messages/                        # Translation files
├── types/                           # Global type definitions
├── middleware.ts                    # Locale redirect
├── auth.ts                          # NextAuth configuration
└── package.json
```

---

## Feature-Driven Architecture

### Import Rules

| From         | To           | Allowed |
| ------------ | ------------ | ------- |
| `app/`       | `features/*` | ✅      |
| `app/`       | `shared/*`   | ✅      |
| `features/*` | `shared/*`   | ✅      |
| `features/*` | `client/`    | ✅      |
| `features/A` | `features/B` | ❌      |
| `shared/`    | `features/*` | ❌      |

> **Important:** Features must be independent. If two features need shared code, move it to `shared/`.

### Feature Structure

Each feature can contain the following directories (all optional except `index.ts`):

```
features/{feature-name}/
├── components/        # UI components for this feature
│   └── index.ts       # Barrel export
├── hooks/             # Custom hooks
├── stores/            # Zustand stores for feature-specific state
├── lib/               # Utilities, validations, helpers
├── types/             # Type definitions
├── __tests__/         # Tests for this feature
└── index.ts           # Public API (barrel export) - REQUIRED
```

> **Note:** Only create directories that are needed. For example, the `auth` feature currently has only `components/`, `lib/`, and `__tests__/`.

### Adding a New Feature

1. Create `features/{feature-name}/` directory
2. Export only public API from `index.ts`
3. Import from feature root: `import { Component } from '@/features/auth'`
4. Do NOT import internal files: `import { x } from '@/features/auth/lib/internal'` ❌

### Where Should Code Go?

| Code Type                 | Location                    |
| ------------------------- | --------------------------- |
| Used by single feature    | `features/{name}/`          |
| Used by multiple features | `shared/`                   |
| shadcn/ui components      | `shared/components/ui/`     |
| Global utilities (cn)     | `shared/lib/`               |
| API client configuration  | `shared/lib/api/`           |
| Layout components         | `shared/components/layout/` |

---

## Coding Conventions

### Naming Rules

| Target         | Convention             | Example                              |
| -------------- | ---------------------- | ------------------------------------ |
| Component      | PascalCase             | `Button.tsx`, `LanguageSwitcher.tsx` |
| Utility        | camelCase              | `utils.ts`, `useAuth.ts`             |
| Hook           | camelCase (use prefix) | `useAuth.ts`, `useProject.ts`        |
| Constant       | SCREAMING_SNAKE_CASE   | `MAX_FILE_SIZE`                      |
| Type/Interface | PascalCase             | `UserResponse`, `ProjectData`        |

### Component Placement

| Type                 | Location                      |
| -------------------- | ----------------------------- |
| shadcn/ui            | `shared/components/ui/`       |
| Shared components    | `shared/components/`          |
| Feature-specific     | `features/{name}/components/` |
| Page-specific (rare) | Respective page directory     |

### Styling

```tsx
// Use TailwindCSS utility classes
// Combine classes with cn()
import { cn } from '@/shared/lib/utils';

interface ButtonProps {
  className?: string;
  children: React.ReactNode;
}

export function Button({ className, children }: ButtonProps) {
  return (
    <button className={cn('flex items-center px-4 py-2', className)}>
      {children}
    </button>
  );
}
```

### Server Components vs Client Components

```tsx
// Default is Server Component (RSC)
// Prefer using Server Components

// Add 'use client' only when client features are needed
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Cases requiring 'use client':**

- Using hooks like useState, useEffect, useRef, etc.
- Event handlers (onClick, onChange, etc.)
- Using browser APIs (window, document)

---

## Internationalization (i18n)

### Supported Languages

| Language | Code | Notes   |
| -------- | ---- | ------- |
| Japanese | ja   | Default |
| English  | en   | -       |

### Using Translations

```tsx
// Server Component
import { getTranslations } from 'next-intl/server';

export default async function LoginPage() {
  const t = await getTranslations('auth');
  return <h1>{t('login.title')}</h1>;
}

// Client Component
('use client');
import { useTranslations } from 'next-intl';

export function LoginForm() {
  const t = useTranslations('auth');
  return <button>{t('login.submit')}</button>;
}
```

### Translation Files

```json
// messages/ja.json
{
  "auth": {
    "login": {
      "title": "ログイン",
      "submit": "ログインする"
    }
  }
}

// messages/en.json
{
  "auth": {
    "login": {
      "title": "Login",
      "submit": "Sign in"
    }
  }
}
```

### Routing

```
/{locale}/...

# Examples
/ja/login      → Japanese login page
/en/login      → English login page
/ja/docs/...   → Japanese documentation
```

---

## Development Commands

### Setup

```bash
# Install dependencies (requires pnpm via corepack)
corepack enable
pnpm install
```

### Development Server

```bash
pnpm run dev
```

### Build

```bash
pnpm run build
pnpm run start
```

### Testing

```bash
# Watch mode
pnpm run test

# Single run
pnpm run test:run

# Coverage
pnpm run test:coverage

# E2E tests
pnpm exec playwright test
```

### Lint and Format

```bash
# Check (lint + format)
pnpm run check

# Auto-fix
pnpm run check:fix

# Lint only
pnpm run lint
pnpm run lint:fix

# Format only
pnpm run format
pnpm run format:check
```

---

## Testing Conventions

### Target Coverage

| Level  | Coverage |
| ------ | -------- |
| SHOULD | 70%+     |
| MUST   | 60%      |

### Directory Structure

Tests are co-located with the code they test:

```
features/auth/
├── components/
│   └── LoginForm.tsx
├── __tests__/
│   └── LoginForm.test.tsx      # Feature tests
└── index.ts

shared/
├── components/ui/
│   ├── button.tsx
│   └── __tests__/
│       └── Button.test.tsx     # Shared component tests
└── lib/
    ├── utils.ts
    └── __tests__/
        └── utils.test.ts       # Utility tests
```

### Test Patterns

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/shared/components/ui/button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Hook Testing

```tsx
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter', () => {
  it('increments count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

---

## shadcn/ui Components

### Adding New Components

```bash
pnpm dlx shadcn@latest add <component-name>

# Examples
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add input
```

### Usage Example

```tsx
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/shared/components/ui/card';

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Click me</Button>
      </CardContent>
    </Card>
  );
}
```

---

## API Client (hey-api)

### Overview

Backend API client is auto-generated from OpenAPI schema using `@hey-api/openapi-ts`.

```
web/client/
├── sdk.gen.ts              # API service classes
├── types.gen.ts            # TypeScript types
├── @tanstack/
│   └── react-query.gen.ts  # React Query hooks
└── client/
    └── client.gen.ts       # Axios client wrapper
```

### Usage

```tsx
// Server-side (API routes, Server Components)
import { AuthService } from '@/client';
import { getServerClient } from '@/shared/lib/api/client';

const { data, error } = await AuthService.login({
  client: getServerClient(),
  body: { email, password },
});

// Client-side (with React Query)
import { authLoginOptions } from '@/client/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';

const mutation = useMutation(authLoginOptions());
mutation.mutate({ body: { email, password } });
```

### Regenerating Client

```bash
# From project root
./scripts/generate-client.sh

# Or from web directory
pnpm run openapi-ts
```

> **Note:** CI automatically creates a PR when API schema changes in `api/app/`.

---

## Path Aliases

```tsx
// Configured in tsconfig.json
// @ → web/

// Shared components
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

// Feature components (prefer barrel export)
import { LoginForm } from '@/features/auth';

// Or direct import if needed
import { LoginForm } from '@/features/auth/components/LoginForm';

// External libraries
import { useTranslations } from 'next-intl';
```

---

## Guidelines

### Prohibited

- Hardcoding UI text (use translation files)
- Using `any` type
- Adding unnecessary `'use client'`
- Merging without tests

### Recommended

- Prefer Server Components
- Maintain type safety
- Consider accessibility (semantic HTML, ARIA attributes)
- Responsive design (TailwindCSS breakpoints)

### TypeScript

```tsx
// Define types explicitly
interface Props {
  title: string;
  count: number;
  onClick?: () => void;
}

// Do not use React.FC
export function MyComponent({ title, count, onClick }: Props) {
  return (
    <div>
      {title}: {count}
    </div>
  );
}
```
