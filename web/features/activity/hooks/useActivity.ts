'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

import { getProjectActivityOptions } from '@/client/@tanstack/react-query.gen';

/**
 * Suspense-enabled hook for fetching project activity feed.
 * Use with React Suspense and server-side prefetching via HydrationBoundary.
 *
 * @param slug - Project slug
 * @param skip - Number of records to skip (pagination)
 * @param limit - Maximum number of records to return
 */
export function useActivitySuspense(slug: string, skip = 0, limit = 50) {
  return useSuspenseQuery(
    getProjectActivityOptions({ path: { slug }, query: { skip, limit } })
  );
}
