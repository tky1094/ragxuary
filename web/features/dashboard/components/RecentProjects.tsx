'use client';

import { FolderPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useProjectListSuspense } from '@/features/projects/hooks/useProjects';
import { Link } from '@/i18n/routing';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

/**
 * Recent projects list component using Suspense.
 * Must be wrapped in Suspense boundary and data should be prefetched on server.
 */
export function RecentProjects() {
  const t = useTranslations('dashboard');
  const tProjects = useTranslations('projects');
  const { data: projects } = useProjectListSuspense(0, 3);

  if (!projects || projects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <FolderPlus className="mx-auto h-12 w-12 text-muted-foreground" />
          <CardTitle className="text-lg">{tProjects('noProjects')}</CardTitle>
          <CardDescription>{t('createFirstProject')}</CardDescription>
          <div className="pt-4">
            <Button asChild>
              <Link href="/projects">{tProjects('new')}</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="transition-colors hover:bg-accent/50">
          <Link href={`/p/${project.slug}/docs`}>
            <CardHeader>
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <CardDescription>
                {project.description || tProjects('noDescription')}
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      ))}
    </div>
  );
}
