'use client';

import type { ReactNode } from 'react';

import { PermissionGuard, ProjectTabs } from '@/features/projects/components';

interface ProjectLayoutContentProps {
  projectSlug: string;
  children: ReactNode;
}

/**
 * Client component wrapper for project layout.
 *
 * Provides VIEW permission check for all project pages.
 * Users without VIEW permission will see a 403 Forbidden page.
 */
export function ProjectLayoutContent({
  projectSlug,
  children,
}: ProjectLayoutContentProps) {
  return (
    <PermissionGuard projectSlug={projectSlug} requiredPermission="view">
      <div className="-my-8">
        <ProjectTabs />
        <div className="py-8">{children}</div>
      </div>
    </PermissionGuard>
  );
}
