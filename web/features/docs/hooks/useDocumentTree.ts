'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

import { getDocumentTreeOptions } from '@/client/@tanstack/react-query.gen';

/**
 * Suspense-enabled hook for fetching the document tree.
 * Use with React Suspense and server-side prefetching via HydrationBoundary.
 *
 * @param slug - Project slug
 */
export function useDocumentTreeSuspense(slug: string) {
  return useSuspenseQuery(getDocumentTreeOptions({ path: { slug } }));
}
