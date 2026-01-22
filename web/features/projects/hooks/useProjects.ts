'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProjectMutation,
  deleteProjectMutation,
  getProjectOptions,
  listProjectsOptions,
  listProjectsQueryKey,
  updateProjectMutation,
} from '@/client/@tanstack/react-query.gen';
import { useApiClient } from '@/shared/hooks/useApiClient';

/**
 * Hook for fetching the list of projects
 */
export function useProjectList(skip = 0, limit = 100) {
  const { client, isAuthenticated, isLoading: isAuthLoading } = useApiClient();

  const query = useQuery({
    ...listProjectsOptions({
      client,
      query: { skip, limit },
    }),
    enabled: isAuthenticated,
  });

  return {
    ...query,
    // Treat authentication checking or data fetching as loading
    isLoading: isAuthLoading || query.isPending,
  };
}

/**
 * Hook for fetching a single project by slug
 */
export function useProject(slug: string) {
  const { client, isAuthenticated, isLoading: isAuthLoading } = useApiClient();

  const query = useQuery({
    ...getProjectOptions({
      client,
      path: { slug },
    }),
    enabled: isAuthenticated && !!slug,
  });

  return {
    ...query,
    // Treat authentication checking or data fetching as loading
    isLoading: isAuthLoading || query.isPending,
  };
}

/**
 * Hook for creating a new project
 */
export function useCreateProject() {
  const { client } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    ...createProjectMutation({ client }),
    onSuccess: () => {
      // Invalidate the projects list to refetch
      // Pass client to ensure baseURL in queryKey matches
      queryClient.invalidateQueries({
        queryKey: listProjectsQueryKey({ client }),
      });
    },
  });
}

/**
 * Hook for updating a project
 */
export function useUpdateProject() {
  const { client } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    ...updateProjectMutation({ client }),
    onSuccess: () => {
      // Pass client to ensure baseURL in queryKey matches
      queryClient.invalidateQueries({
        queryKey: listProjectsQueryKey({ client }),
      });
    },
  });
}

/**
 * Hook for deleting a project
 */
export function useDeleteProject() {
  const { client } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteProjectMutation({ client }),
    onSuccess: () => {
      // Pass client to ensure baseURL in queryKey matches
      queryClient.invalidateQueries({
        queryKey: listProjectsQueryKey({ client }),
      });
    },
  });
}
