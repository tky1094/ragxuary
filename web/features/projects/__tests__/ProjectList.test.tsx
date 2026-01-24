import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectList } from '../components/ProjectList';
import * as useProjectsModule from '../hooks/useProjects';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      noProjects: 'No projects found',
      loadError: 'Failed to load projects',
      noDescription: 'No description',
    };
    return translations[key] || key;
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock i18n routing
vi.mock('@/i18n/routing', () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithProviders(ui: ReactNode) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>{ui}</Suspense>
    </QueryClientProvider>
  );
}

describe('ProjectList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state when no projects', () => {
    vi.spyOn(useProjectsModule, 'useProjectListSuspense').mockReturnValue({
      data: [],
    } as unknown as ReturnType<
      typeof useProjectsModule.useProjectListSuspense
    >);

    renderWithProviders(<ProjectList />);

    expect(screen.getByText('No projects found')).toBeInTheDocument();
  });

  it('should render project list', () => {
    const mockProjects = [
      {
        id: '1',
        name: 'Project 1',
        slug: 'project-1',
        description: 'Description 1',
        visibility: 'private',
        chat_enabled: true,
        owner_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Project 2',
        slug: 'project-2',
        description: null,
        visibility: 'public',
        chat_enabled: false,
        owner_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    vi.spyOn(useProjectsModule, 'useProjectListSuspense').mockReturnValue({
      data: mockProjects,
    } as unknown as ReturnType<
      typeof useProjectsModule.useProjectListSuspense
    >);

    renderWithProviders(<ProjectList />);

    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('should render project cards with correct structure', () => {
    const mockProjects = [
      {
        id: '1',
        name: 'Test Project',
        slug: 'test-project',
        description: 'Test description',
        visibility: 'private',
        chat_enabled: true,
        owner_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    vi.spyOn(useProjectsModule, 'useProjectListSuspense').mockReturnValue({
      data: mockProjects,
    } as unknown as ReturnType<
      typeof useProjectsModule.useProjectListSuspense
    >);

    const { container } = renderWithProviders(<ProjectList />);

    // Check that project cards are rendered in a grid
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();

    // Check project name is in a CardTitle
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });
});
