'use client';

import { useTranslations } from 'next-intl';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { useProjectListSuspense } from '../hooks/useProjects';

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
        <Card key={project.id}>
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {project.description || t('noDescription')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
