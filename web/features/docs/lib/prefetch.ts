/**
 * Server-side prefetch utilities for documents.
 * Use these in Server Components to prefetch data before rendering.
 */
import { QueryClient } from '@tanstack/react-query';

import { Documents } from '@/client';
import {
  getDocumentOptions,
  getDocumentTreeOptions,
} from '@/client/@tanstack/react-query.gen';
import { getServerClient } from '@/shared/lib/api/client';

/**
 * Prefetch a single document on the server.
 * Returns a QueryClient with the prefetched data.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * const queryClient = await prefetchDocument('my-project', 'docs/intro');
 * return (
 *   <HydrationBoundary state={dehydrate(queryClient)}>
 *     <DocsContent slug="my-project" path="docs/intro" />
 *   </HydrationBoundary>
 * );
 * ```
 */
export async function prefetchDocument(
  slug: string,
  path: string
): Promise<QueryClient> {
  const queryClient = new QueryClient();
  const client = getServerClient();

  await queryClient.prefetchQuery({
    ...getDocumentOptions({ path: { slug, path } }),
    queryFn: async () => {
      const { data } = await Documents.getDocument({
        client,
        path: { slug, path },
        throwOnError: true,
      });
      return data;
    },
  });

  return queryClient;
}

/**
 * Prefetch document tree for a project on the server.
 * Returns a QueryClient with the prefetched data.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * const queryClient = await prefetchDocumentTree('my-project');
 * return (
 *   <HydrationBoundary state={dehydrate(queryClient)}>
 *     <DocsSidebar slug="my-project" />
 *   </HydrationBoundary>
 * );
 * ```
 */
export async function prefetchDocumentTree(slug: string): Promise<QueryClient> {
  const queryClient = new QueryClient();
  const client = getServerClient();

  await queryClient.prefetchQuery({
    ...getDocumentTreeOptions({ path: { slug } }),
    queryFn: async () => {
      const { data } = await Documents.getDocumentTree({
        client,
        path: { slug },
        throwOnError: true,
      });
      return data;
    },
  });

  return queryClient;
}
