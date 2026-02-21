import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDocumentTreeSuspense } from '../useDocumentTree';

vi.mock('@/client/@tanstack/react-query.gen', () => ({
  getDocumentTreeOptions: vi.fn(({ path }) => ({
    queryKey: ['documents', 'tree', path.slug],
    queryFn: vi.fn().mockResolvedValue([
      {
        id: '1',
        slug: 'guides',
        path: 'guides',
        title: 'Guides',
        index: 0,
        is_folder: true,
        children: [
          {
            id: '2',
            slug: 'quick-start',
            path: 'guides/quick-start',
            title: 'Quick Start',
            index: 0,
            is_folder: false,
          },
        ],
      },
      {
        id: '3',
        slug: 'api-reference',
        path: 'api-reference',
        title: 'API Reference',
        index: 1,
        is_folder: false,
      },
    ]),
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

describe('useDocumentTreeSuspense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return document tree data', async () => {
    const { result } = renderHook(
      () => useDocumentTreeSuspense('test-project'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].title).toBe('Guides');
    expect(result.current.data[0].is_folder).toBe(true);
    expect(result.current.data[0].children).toHaveLength(1);
    expect(result.current.data[1].title).toBe('API Reference');
  });

  it('should pass slug to getDocumentTreeOptions', async () => {
    const { getDocumentTreeOptions } = await import(
      '@/client/@tanstack/react-query.gen'
    );

    renderHook(() => useDocumentTreeSuspense('another-project'), {
      wrapper: createWrapper(),
    });

    expect(getDocumentTreeOptions).toHaveBeenCalledWith({
      path: { slug: 'another-project' },
    });
  });
});
