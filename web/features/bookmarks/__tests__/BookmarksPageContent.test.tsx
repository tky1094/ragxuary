import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BookmarksPageContent } from '@/features/bookmarks/components/BookmarksPageContent';
import { TooltipProvider } from '@/shared/components/ui/tooltip';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    status: 'authenticated',
    data: { user: { id: '1', email: 'test@example.com' } },
  })),
}));

// Mock next-intl/navigation
vi.mock('@/i18n/routing', () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const mockBookmarks = [
  {
    id: 1,
    project_id: 1,
    user_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    project: {
      id: 1,
      name: 'Test Project 1',
      slug: 'test-project-1',
      description: 'First test project',
      visibility: 'public',
      owner_id: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 2,
    project_id: 2,
    user_id: 1,
    created_at: '2024-01-02T00:00:00Z',
    project: {
      id: 2,
      name: 'Test Project 2',
      slug: 'test-project-2',
      description: 'Second test project',
      visibility: 'private',
      owner_id: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
];

// Mock the bookmark hooks with different data for each test
const mockUseBookmarksSuspense = vi.fn();
vi.mock('@/shared/hooks', () => ({
  useBookmarksSuspense: () => mockUseBookmarksSuspense(),
  useBookmarkStatus: vi.fn(() => ({
    data: { is_bookmarked: true },
    isLoading: false,
  })),
  useAddBookmark: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useRemoveBookmark: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

const messages = {
  bookmarks: {
    title: 'Bookmarks',
    noBookmarks: 'No bookmarks',
    noBookmarksDescription: 'Projects you bookmark will appear here.',
    addBookmark: 'Add to bookmarks',
    removeBookmark: 'Remove from bookmarks',
  },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={messages}>
          <TooltipProvider>{children}</TooltipProvider>
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
  };
}

describe('BookmarksPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no bookmarks', () => {
    mockUseBookmarksSuspense.mockReturnValue({ data: [] });

    render(<BookmarksPageContent />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('No bookmarks')).toBeInTheDocument();
    expect(
      screen.getByText('Projects you bookmark will appear here.')
    ).toBeInTheDocument();
  });

  it('should render empty state when bookmarks is null', () => {
    mockUseBookmarksSuspense.mockReturnValue({ data: null });

    render(<BookmarksPageContent />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('No bookmarks')).toBeInTheDocument();
  });

  it('should render bookmarked projects', () => {
    mockUseBookmarksSuspense.mockReturnValue({ data: mockBookmarks });

    render(<BookmarksPageContent />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    expect(screen.getByText('First test project')).toBeInTheDocument();
    expect(screen.getByText('Second test project')).toBeInTheDocument();
  });

  it('should render project cards with correct links', () => {
    mockUseBookmarksSuspense.mockReturnValue({ data: mockBookmarks });

    render(<BookmarksPageContent />, {
      wrapper: createWrapper(),
    });

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/p/test-project-1/docs');
    expect(links[1]).toHaveAttribute('href', '/p/test-project-2/docs');
  });

  it('should render visibility badges correctly', () => {
    mockUseBookmarksSuspense.mockReturnValue({ data: mockBookmarks });

    render(<BookmarksPageContent />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
  });
});
