import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDocumentSuspense } from '../useDocument';

vi.mock('@/client/@tanstack/react-query.gen', () => ({
  getDocumentOptions: vi.fn(({ path }) => ({
    queryKey: ['documents', 'get', path.slug, path.path],
    queryFn: vi.fn().mockResolvedValue({
      id: '1',
      project_id: '1',
      parent_id: null,
      slug: 'intro',
      path: path.path,
      index: 0,
      is_folder: false,
      title: 'Test Document',
      content: '# Hello\n\nThis is test content.',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    }),
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

describe('useDocumentSuspense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return document data', async () => {
    const { result } = renderHook(
      () => useDocumentSuspense('test-project', 'docs/intro'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data.title).toBe('Test Document');
    expect(result.current.data.content).toBe(
      '# Hello\n\nThis is test content.'
    );
  });

  it('should pass slug and path to getDocumentOptions', async () => {
    const { getDocumentOptions } = await import(
      '@/client/@tanstack/react-query.gen'
    );

    renderHook(() => useDocumentSuspense('another-project', 'guides/setup'), {
      wrapper: createWrapper(),
    });

    expect(getDocumentOptions).toHaveBeenCalledWith({
      path: { slug: 'another-project', path: 'guides/setup' },
    });
  });
});
