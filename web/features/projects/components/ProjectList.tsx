'use client';

import { useTranslations } from 'next-intl';

import { EmptyProjects } from '@/shared/components';

import { useProjectListSuspense } from '../hooks/useProjects';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
  onCreateClick?: () => void;
}

/**
 * Project list component using Suspense.
 * Must be wrapped in a Suspense boundary and data should be prefetched on the server.
 */
export function ProjectList({ onCreateClick }: ProjectListProps) {
  const t = useTranslations('projects');
  const { data: projects } = useProjectListSuspense();

  if (!projects || projects.length === 0) {
    return onCreateClick ? (
      <EmptyProjects action={{ type: 'button', onClick: onCreateClick }} />
    ) : (
      <EmptyProjects action={{ type: 'link', href: '/projects' }} />
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
