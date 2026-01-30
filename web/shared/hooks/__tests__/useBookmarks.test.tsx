import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useAddBookmark,
  useBookmarkStatus,
  useBookmarks,
  useRemoveBookmark,
} from '@/shared/hooks/useBookmarks';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    status: 'authenticated',
    data: { user: { id: '1', email: 'test@example.com' } },
  })),
}));

// Mock the generated API client
vi.mock('@/client/@tanstack/react-query.gen', () => ({
  listBookmarksOptions: vi.fn(({ query }) => ({
    queryKey: ['bookmarks', 'list', query],
    queryFn: vi.fn().mockResolvedValue([
      {
        id: 1,
        project_id: 1,
        user_id: 1,
        project: {
          id: 1,
          name: 'Test Project',
          slug: 'test-project',
          visibility: 'public',
        },
      },
    ]),
  })),
  listBookmarksQueryKey: vi.fn(() => ['bookmarks', 'list']),
  getBookmarkStatusOptions: vi.fn(({ path }) => ({
    queryKey: ['bookmarks', 'status', path.slug],
    queryFn: vi.fn().mockResolvedValue({ is_bookmarked: true }),
  })),
  getBookmarkStatusQueryKey: vi.fn(({ path }) => [
    'bookmarks',
    'status',
    path.slug,
  ]),
  addBookmarkMutation: vi.fn(() => ({
    mutationFn: vi.fn().mockResolvedValue({ success: true }),
  })),
  removeBookmarkMutation: vi.fn(() => ({
    mutationFn: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useBookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return bookmarks when authenticated', async () => {
    const { result } = renderHook(() => useBookmarks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });

  it('should accept skip and limit parameters', async () => {
    const { result } = renderHook(() => useBookmarks(10, 50), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('useBookmarkStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return bookmark status for a project', async () => {
    const { result } = renderHook(() => useBookmarkStatus('test-project'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.is_bookmarked).toBe(true);
  });

  it('should not fetch when slug is empty', () => {
    const { result } = renderHook(() => useBookmarkStatus(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useAddBookmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a mutation function', () => {
    const { result } = renderHook(() => useAddBookmark(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
  });

  it('should call mutate with project slug', async () => {
    const { result } = renderHook(() => useAddBookmark(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ path: { slug: 'test-project' } });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});

describe('useRemoveBookmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a mutation function', () => {
    const { result } = renderHook(() => useRemoveBookmark(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
  });

  it('should call mutate with project slug', async () => {
    const { result } = renderHook(() => useRemoveBookmark(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ path: { slug: 'test-project' } });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});
