'use client';

import type { ReactNode } from 'react';

import { ForbiddenPage } from '@/shared/components';
import { Skeleton } from '@/shared/components/ui/skeleton';

import { type Permission, useProjectPermissions } from '../hooks';

interface PermissionGuardProps {
  /** The project slug to check permissions for */
  projectSlug: string;
  /** The permission required to access the content */
  requiredPermission: Permission;
  /** Content to render if user has permission */
  children: ReactNode;
  /** Custom loading fallback. Defaults to LoadingSkeleton. */
  fallback?: ReactNode;
}

/**
 * Guard component that checks user permission before rendering children.
 *
 * Shows a loading skeleton while permissions are being fetched.
 * Shows a 403 Forbidden page if the user lacks the required permission.
 * Renders children if the user has the required permission.
 *
 * @example
 * ```tsx
 * <PermissionGuard projectSlug="my-project" requiredPermission="edit">
 *   <EditProjectContent />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  projectSlug,
  requiredPermission,
  children,
  fallback,
}: PermissionGuardProps) {
  const { hasPermission, isLoading, error } =
    useProjectPermissions(projectSlug);

  if (isLoading) {
    return fallback ?? <LoadingSkeleton />;
  }

  if (error || !hasPermission(requiredPermission)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
