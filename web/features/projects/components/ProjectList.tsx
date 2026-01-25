'use client';

import { useTranslations } from 'next-intl';

import { useProjectListSuspense } from '../hooks/useProjects';
import { ProjectCard } from './ProjectCard';

/**
 * Project list component using Suspense.
 * Must be wrapped in a Suspense boundary and data should be prefetched on the server.
 */
export function ProjectList() {
  const t = useTranslations('projects');
  const { data: projects } = useProjectListSuspense();

  if (!projects || projects.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {t('noProjects')}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          noDescription={t('noDescription')}
          href={`/p/${project.slug}/docs`}
        />
      ))}
    </div>
  );
}
