'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { useProjectList } from '../hooks/useProjects';

export function ProjectList() {
  const t = useTranslations('projects');
  const { data: projects, isLoading, error } = useProjectList();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive text-center py-8">{t('loadError')}</div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
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
