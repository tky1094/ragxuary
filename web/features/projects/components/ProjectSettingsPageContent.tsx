'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { useProject } from '../hooks/useProjects';
import { ProjectSettingsForm } from './ProjectSettingsForm';

interface ProjectSettingsPageContentProps {
  projectSlug: string;
}

export function ProjectSettingsPageContent({
  projectSlug,
}: ProjectSettingsPageContentProps) {
  const t = useTranslations('projects');
  const { data: project, isLoading, error } = useProject(projectSlug);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="py-8 text-center text-destructive">
        {t('projectNotFound')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToProjects')}
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-bold text-2xl">{project.name}</h1>
        <p className="text-muted-foreground">{t('settings')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('generalSettings')}</CardTitle>
          <CardDescription>{t('generalSettingsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectSettingsForm project={project} />
        </CardContent>
      </Card>
    </div>
  );
}
