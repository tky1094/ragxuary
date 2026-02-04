'use client';

import { useTranslations } from 'next-intl';

import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { useProjectListSuspense } from '@/features/projects/hooks/useProjects';
import { EmptyProjects } from '@/shared/components';

/**
 * Recent projects list component using Suspense.
 * Must be wrapped in Suspense boundary and data should be prefetched on server.
 */
export function RecentProjects() {
  const tProjects = useTranslations('projects');
  const { data: projects } = useProjectListSuspense(0, 3);

  if (!projects || projects.length === 0) {
    return <EmptyProjects action={{ type: 'link', href: '/projects' }} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          noDescription={tProjects('noDescription')}
          href={`/p/${project.slug}/docs`}
          className="transition-colors hover:bg-accent/50"
        />
      ))}
    </div>
  );
}
