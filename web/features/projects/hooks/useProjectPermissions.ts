'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import { getProjectPermissionsOptions } from '@/client/@tanstack/react-query.gen';
import { type ApiError, isApiError } from '@/shared/lib/api/errors';

/**
 * Permission types that can be checked on a project.
 */
export type Permission =
  | 'view'
  | 'edit'
  | 'manage_members'
  | 'manage_settings'
  | 'delete_project';

/**
 * Role types for project members.
 */
export type Role = 'viewer' | 'editor' | 'admin' | 'owner' | null;

/**
 * Return type for the useProjectPermissions hook.
 */
interface UseProjectPermissionsResult {
  /** Set of permissions the user has on the project */
  permissions: Set<Permission>;
  /** User's role on the project (null if not a member) */
  role: Role;
  /** Check if user has a specific permission */
  hasPermission: (permission: Permission) => boolean;
  /** Shorthand for hasPermission('edit') */
  canEdit: boolean;
  /** Shorthand for hasPermission('manage_settings') */
  canManageSettings: boolean;
  /** Whether the data is still loading */
  isLoading: boolean;
  /** Error if the request failed */
  error: ApiError | null;
  /** True if the error is a 404 Not Found */
  isNotFound: boolean;
}

/**
 * Hook for fetching user's permissions on a project.
 *
 * Uses the GET /projects/{slug}/permissions endpoint to get the current
 * user's permissions and role on the specified project.
 *
 * @param slug - The project slug
 * @returns Object containing permissions, role, and helper functions
 *
 * @example
 * ```tsx
 * function EditButton({ projectSlug }: { projectSlug: string }) {
 *   const { canEdit, isLoading } = useProjectPermissions(projectSlug);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!canEdit) return null;
 *
 *   return <Button>Edit</Button>;
 * }
 * ```
 */
export function useProjectPermissions(
  slug: string
): UseProjectPermissionsResult {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isAuthLoading = status === 'loading';

  const query = useQuery({
    ...getProjectPermissionsOptions({ path: { slug } }),
    enabled: isAuthenticated && !!slug,
    // Skip retry for 4xx client errors (404, 403, etc.)
    retry: (failureCount, error) => {
      if (isApiError(error) && error.isClientError) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const permissions = new Set<Permission>(
    (query.data?.permissions ?? []) as Permission[]
  );
  const role = (query.data?.role ?? null) as Role;

  const hasPermission = (permission: Permission): boolean =>
    permissions.has(permission);

  // Extract ApiError from query error
  const error = query.error
    ? isApiError(query.error)
      ? query.error
      : null
    : null;

  return {
    permissions,
    role,
    hasPermission,
    canEdit: hasPermission('edit'),
    canManageSettings: hasPermission('manage_settings'),
    isLoading: isAuthLoading || query.isPending,
    error,
    isNotFound: error?.isNotFound ?? false,
  };
}
