/**
 * Server-side prefetch utilities for activity feed.
 * Use these in Server Components to prefetch data before rendering.
 */
import { QueryClient } from '@tanstack/react-query';

import { Documents } from '@/client';
import { getProjectActivityOptions } from '@/client/@tanstack/react-query.gen';
import { getServerClient } from '@/shared/lib/api/client';

/**
 * Prefetch project activity feed on the server.
 * Returns a QueryClient with the prefetched data.
 */
export async function prefetchActivity(
  slug: string,
  skip = 0,
  limit = 50
): Promise<QueryClient> {
  const queryClient = new QueryClient();
  const client = getServerClient();

  await queryClient.prefetchQuery({
    ...getProjectActivityOptions({ path: { slug }, query: { skip, limit } }),
    queryFn: async () => {
      const { data } = await Documents.getProjectActivity({
        client,
        path: { slug },
        query: { skip, limit },
        throwOnError: true,
      });
      return data;
    },
  });

  return queryClient;
}
