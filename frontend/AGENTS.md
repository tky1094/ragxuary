# Frontend AGENTS.md

Next.js frontend development conventions.

---

## Technology Stack

| Technology            | Version | Purpose              |
| --------------------- | ------- | -------------------- |
| Next.js               | 14+     | App Router, RSC      |
| React                 | 18+     | UI                   |
| TypeScript            | 5+      | Type safety          |
| TailwindCSS           | 3+      | Styling              |
| shadcn/ui             | latest  | UI components        |
| NextAuth.js           | 5+      | Authentication       |
| next-intl             | 3+      | Internationalization |
| Vitest                | 3+      | Unit testing         |
| React Testing Library | 16+     | Component testing    |
| Playwright            | 1.50+   | E2E testing          |

---

## Directory Structure

```
frontend/
├── app/
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
├── components/
│   ├── ui/                          # shadcn/ui components
│   │   └── button.tsx
│   └── LanguageSwitcher.tsx         # Shared components
├── lib/
│   └── utils.ts                     # Utilities
├── i18n/
│   ├── config.ts                    # Locale configuration
│   ├── request.ts                   # next-intl configuration
│   └── routing.ts                   # Routing configuration
├── messages/
│   ├── ja.json                      # Japanese translations
│   └── en.json                      # English translations
├── types/
│   └── next-auth.d.ts               # Type definition extensions
├── __tests__/                       # Tests
│   ├── components/
│   ├── hooks/
│   └── lib/
├── middleware.ts                    # Locale redirect
├── auth.ts                          # NextAuth configuration
└── package.json
```

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

| Type              | Location                  |
| ----------------- | ------------------------- |
| shadcn/ui         | `components/ui/`          |
| Shared components | `components/`             |
| Page-specific     | Respective page directory |

### Styling

```tsx
// Use TailwindCSS utility classes
// Combine classes with cn()
import { cn } from '@/lib/utils';

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
# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
npm run start
```

### Testing

```bash
# Watch mode
npm run test

# Single run
npm run test:run

# Coverage
npm run test:coverage

# E2E tests
npx playwright test
```

### Lint

```bash
# Check
npm run lint
npm run format:check

# Auto-fix
npm run format
```

---

## Testing Conventions

### Target Coverage

| Level  | Coverage |
| ------ | -------- |
| SHOULD | 70%+     |
| MUST   | 60%      |

### Directory Structure

```
__tests__/
├── components/
│   └── ui/
│       └── Button.test.tsx
├── hooks/
│   └── useAuth.test.ts
└── lib/
    └── utils.test.ts
```

### Test Patterns

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

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
npx shadcn@latest add <component-name>

# Examples
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add input
```

### Usage Example

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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

## Path Aliases

```tsx
// Configured in tsconfig.json
// @ → frontend/

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
