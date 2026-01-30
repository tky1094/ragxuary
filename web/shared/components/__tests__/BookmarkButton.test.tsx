import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BookmarkButton } from '@/shared/components/BookmarkButton';
import { TooltipProvider } from '@/shared/components/ui/tooltip';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    status: 'authenticated',
    data: { user: { id: '1', email: 'test@example.com' } },
  })),
}));

const mockAddBookmark = vi.fn();
const mockRemoveBookmark = vi.fn();
let mockIsBookmarked = false;
let mockIsLoading = false;

// Mock the bookmark hooks
vi.mock('@/shared/hooks', () => ({
  useBookmarkStatus: vi.fn(() => ({
    data: { is_bookmarked: mockIsBookmarked },
    isLoading: mockIsLoading,
  })),
  useAddBookmark: vi.fn(() => ({
    mutate: mockAddBookmark,
    isPending: false,
  })),
  useRemoveBookmark: vi.fn(() => ({
    mutate: mockRemoveBookmark,
    isPending: false,
  })),
}));

const messages = {
  bookmarks: {
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

describe('BookmarkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBookmarked = false;
    mockIsLoading = false;
  });

  it('should render with default props', () => {
    render(<BookmarkButton projectSlug="test-project" />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAttribute('aria-label', 'Add to bookmarks');
  });

  it('should render with small size', () => {
    render(<BookmarkButton projectSlug="test-project" size="sm" />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should render without tooltip when showTooltip is false', () => {
    render(<BookmarkButton projectSlug="test-project" showTooltip={false} />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should call addBookmark when clicked and not bookmarked', async () => {
    const user = userEvent.setup();

    render(<BookmarkButton projectSlug="test-project" />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockAddBookmark).toHaveBeenCalledWith({
      path: { slug: 'test-project' },
    });
  });

  it('should apply custom className', () => {
    render(
      <BookmarkButton projectSlug="test-project" className="custom-class" />,
      {
        wrapper: createWrapper(),
      }
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});

describe('BookmarkButton - bookmarked state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBookmarked = true;
    mockIsLoading = false;
  });

  it('should show bookmarked state', () => {
    render(<BookmarkButton projectSlug="test-project" />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('aria-label', 'Remove from bookmarks');
  });

  it('should call removeBookmark when clicked and bookmarked', async () => {
    const user = userEvent.setup();

    render(<BookmarkButton projectSlug="test-project" />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockRemoveBookmark).toHaveBeenCalledWith({
      path: { slug: 'test-project' },
    });
  });
});

describe('BookmarkButton - loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBookmarked = false;
    mockIsLoading = true;
  });

  it('should be disabled when loading', () => {
    render(<BookmarkButton projectSlug="test-project" />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
