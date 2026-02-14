'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

import { getDocumentOptions } from '@/client/@tanstack/react-query.gen';

/**
 * Suspense-enabled hook for fetching a single document.
 * Use with React Suspense and server-side prefetching via HydrationBoundary.
 *
 * @param slug - Project slug
 * @param path - Document path within the project
 */
export function useDocumentSuspense(slug: string, path: string) {
  return useSuspenseQuery(getDocumentOptions({ path: { slug, path } }));
}
