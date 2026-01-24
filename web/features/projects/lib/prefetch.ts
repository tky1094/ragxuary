/**
 * Server-side prefetch utilities for projects.
 * Use these in Server Components to prefetch data before rendering.
 */
import { QueryClient } from '@tanstack/react-query';

import { Projects } from '@/client';
import {
  getProjectOptions,
  listProjectsOptions,
} from '@/client/@tanstack/react-query.gen';
import { getServerClient } from '@/shared/lib/api/client';

/**
 * Prefetch the list of projects on the server.
 * Returns a QueryClient with the prefetched data.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * const queryClient = await prefetchProjectList();
 * return (
 *   <HydrationBoundary state={dehydrate(queryClient)}>
 *     <ProjectList />
 *   </HydrationBoundary>
 * );
 * ```
 */
export async function prefetchProjectList(
  skip = 0,
  limit = 100
): Promise<QueryClient> {
  const queryClient = new QueryClient();
  const client = getServerClient();

  await queryClient.prefetchQuery({
    ...listProjectsOptions({ query: { skip, limit } }),
    queryFn: async () => {
      const { data } = await Projects.listProjects({
        client,
        query: { skip, limit },
        throwOnError: true,
      });
      return data;
    },
  });

  return queryClient;
}

/**
 * Prefetch a single project by slug on the server.
 * Returns a QueryClient with the prefetched data.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * const queryClient = await prefetchProject('my-project');
 * return (
 *   <HydrationBoundary state={dehydrate(queryClient)}>
 *     <ProjectSettings />
 *   </HydrationBoundary>
 * );
 * ```
 */
export async function prefetchProject(slug: string): Promise<QueryClient> {
  const queryClient = new QueryClient();
  const client = getServerClient();

  await queryClient.prefetchQuery({
    ...getProjectOptions({ path: { slug } }),
    queryFn: async () => {
      const { data } = await Projects.getProject({
        client,
        path: { slug },
        throwOnError: true,
      });
      return data;
    },
  });

  return queryClient;
}
