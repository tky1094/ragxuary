'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

import { listProjectsOptions } from '@/client/@tanstack/react-query.gen';

/**
 * Suspense-enabled hook for fetching the list of projects.
 * Use with React Suspense and server-side prefetching via HydrationBoundary.
 * Data must be prefetched on the server, otherwise this will suspend indefinitely.
 */
export function useProjectListSuspense(skip = 0, limit = 100) {
  return useSuspenseQuery(listProjectsOptions({ query: { skip, limit } }));
}
