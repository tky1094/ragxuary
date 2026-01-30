'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import {
  addBookmarkMutation,
  getBookmarkStatusOptions,
  getBookmarkStatusQueryKey,
  listBookmarksOptions,
  listBookmarksQueryKey,
  removeBookmarkMutation,
} from '@/client/@tanstack/react-query.gen';

/**
 * Hook for fetching the list of bookmarked projects.
 */
export function useBookmarks(skip = 0, limit = 100) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isAuthLoading = status === 'loading';

  const query = useQuery({
    ...listBookmarksOptions({ query: { skip, limit } }),
    enabled: isAuthenticated,
  });

  return {
    ...query,
    isLoading: isAuthLoading || query.isPending,
  };
}

/**
 * Suspense-enabled hook for fetching bookmarked projects.
 * Use with React Suspense and server-side prefetching via HydrationBoundary.
 */
export function useBookmarksSuspense(skip = 0, limit = 100) {
  return useSuspenseQuery(listBookmarksOptions({ query: { skip, limit } }));
}

/**
 * Hook for checking if a project is bookmarked.
 */
export function useBookmarkStatus(slug: string) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return useQuery({
    ...getBookmarkStatusOptions({ path: { slug } }),
    enabled: isAuthenticated && !!slug,
  });
}

/**
 * Hook for adding a bookmark.
 */
export function useAddBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    ...addBookmarkMutation(),
    onSuccess: (_data, variables) => {
      // Invalidate bookmark list
      queryClient.invalidateQueries({
        queryKey: listBookmarksQueryKey(),
      });
      // Invalidate specific bookmark status
      queryClient.invalidateQueries({
        queryKey: getBookmarkStatusQueryKey({
          path: { slug: variables.path.slug },
        }),
      });
    },
  });
}

/**
 * Hook for removing a bookmark.
 */
export function useRemoveBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    ...removeBookmarkMutation(),
    onSuccess: (_data, variables) => {
      // Invalidate bookmark list
      queryClient.invalidateQueries({
        queryKey: listBookmarksQueryKey(),
      });
      // Invalidate specific bookmark status
      queryClient.invalidateQueries({
        queryKey: getBookmarkStatusQueryKey({
          path: { slug: variables.path.slug },
        }),
      });
    },
  });
}
