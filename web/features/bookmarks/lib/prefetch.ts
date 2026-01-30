/**
 * Server-side prefetch utilities for bookmarks.
 * Use these in Server Components to prefetch data before rendering.
 */
import { QueryClient } from '@tanstack/react-query';

import { Bookmarks } from '@/client';
import { listBookmarksOptions } from '@/client/@tanstack/react-query.gen';
import { getServerClient } from '@/shared/lib/api/client';

/**
 * Prefetch the list of bookmarked projects on the server.
 * Returns a QueryClient with the prefetched data.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * const queryClient = await prefetchBookmarkList();
 * return (
 *   <HydrationBoundary state={dehydrate(queryClient)}>
 *     <BookmarksPageContent />
 *   </HydrationBoundary>
 * );
 * ```
 */
export async function prefetchBookmarkList(
  skip = 0,
  limit = 100
): Promise<QueryClient> {
  const queryClient = new QueryClient();
  const client = getServerClient();

  await queryClient.prefetchQuery({
    ...listBookmarksOptions({ query: { skip, limit } }),
    queryFn: async () => {
      const { data } = await Bookmarks.listBookmarks({
        client,
        query: { skip, limit },
        throwOnError: true,
      });
      return data;
    },
  });

  return queryClient;
}
