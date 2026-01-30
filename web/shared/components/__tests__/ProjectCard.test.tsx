import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProjectRead } from '@/client';
import { ProjectCard } from '@/shared/components/ProjectCard';
import { TooltipProvider } from '@/shared/components/ui/tooltip';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    status: 'authenticated',
    data: { user: { id: '1', email: 'test@example.com' } },
  })),
}));

// Mock the bookmark hooks
vi.mock('@/shared/hooks', () => ({
  useBookmarkStatus: vi.fn(() => ({
    data: { is_bookmarked: false },
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

const messages = {
  bookmarks: {
    addBookmark: 'Add to bookmarks',
    removeBookmark: 'Remove from bookmarks',
  },
};

const mockProject: ProjectRead = {
  id: 1,
  name: 'Test Project',
  slug: 'test-project',
  description: 'A test project description',
  visibility: 'public',
  owner_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockPrivateProject: ProjectRead = {
  ...mockProject,
  id: 2,
  name: 'Private Project',
  slug: 'private-project',
  visibility: 'private',
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

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render project name', () => {
    render(<ProjectCard project={mockProject} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should render project description', () => {
    render(<ProjectCard project={mockProject} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('A test project description')).toBeInTheDocument();
  });

  it('should render noDescription when project has no description', () => {
    const projectWithoutDesc = { ...mockProject, description: null };

    render(
      <ProjectCard
        project={projectWithoutDesc}
        noDescription="No description"
      />,
      {
        wrapper: createWrapper(),
      }
    );

    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('should render Public badge for public projects', () => {
    render(<ProjectCard project={mockProject} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Public')).toBeInTheDocument();
  });

  it('should render Private badge for private projects', () => {
    render(<ProjectCard project={mockPrivateProject} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('should render as a link when href is provided', () => {
    render(<ProjectCard project={mockProject} href="/p/test-project/docs" />, {
      wrapper: createWrapper(),
    });

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/p/test-project/docs');
  });

  it('should not render as a link when href is not provided', () => {
    render(<ProjectCard project={mockProject} />, {
      wrapper: createWrapper(),
    });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should show bookmark button by default', () => {
    render(<ProjectCard project={mockProject} />, {
      wrapper: createWrapper(),
    });

    const bookmarkButton = screen.getByRole('button', {
      name: /bookmark/i,
    });
    expect(bookmarkButton).toBeInTheDocument();
  });

  it('should hide bookmark button when showBookmark is false', () => {
    render(<ProjectCard project={mockProject} showBookmark={false} />, {
      wrapper: createWrapper(),
    });

    const bookmarkButton = screen.queryByRole('button', {
      name: /bookmark/i,
    });
    expect(bookmarkButton).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ProjectCard project={mockProject} className="custom-class" />,
      {
        wrapper: createWrapper(),
      }
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });
});
