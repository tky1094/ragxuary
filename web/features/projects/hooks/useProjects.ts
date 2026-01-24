'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import {
  createProjectMutation,
  deleteProjectMutation,
  getProjectOptions,
  listProjectsOptions,
  listProjectsQueryKey,
  updateProjectMutation,
} from '@/client/@tanstack/react-query.gen';

/**
 * Hook for fetching the list of projects.
 * Uses the global API client configured in setupClient.ts.
 */
export function useProjectList(skip = 0, limit = 100) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isAuthLoading = status === 'loading';

  const query = useQuery({
    ...listProjectsOptions({ query: { skip, limit } }),
    enabled: isAuthenticated,
  });

  return {
    ...query,
    isLoading: isAuthLoading || query.isPending,
  };
}

/**
 * Hook for fetching a single project by slug.
 * Uses the global API client configured in setupClient.ts.
 */
export function useProject(slug: string) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isAuthLoading = status === 'loading';

  const query = useQuery({
    ...getProjectOptions({ path: { slug } }),
    enabled: isAuthenticated && !!slug,
  });

  return {
    ...query,
    isLoading: isAuthLoading || query.isPending,
  };
}

/**
 * Hook for creating a new project.
 * Uses the global API client configured in setupClient.ts.
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    ...createProjectMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listProjectsQueryKey(),
      });
    },
  });
}

/**
 * Hook for updating a project.
 * Uses the global API client configured in setupClient.ts.
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateProjectMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listProjectsQueryKey(),
      });
    },
  });
}

/**
 * Hook for deleting a project.
 * Uses the global API client configured in setupClient.ts.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteProjectMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listProjectsQueryKey(),
      });
    },
  });
}
