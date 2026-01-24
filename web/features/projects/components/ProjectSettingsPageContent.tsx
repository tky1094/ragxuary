'use client';

import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { useProjectSuspense } from '../hooks/useProjects';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import { ProjectSettingsForm } from './ProjectSettingsForm';
import { ProjectSettingsSkeleton } from './ProjectSettingsSkeleton';

interface ProjectSettingsProps {
  projectSlug: string;
}

function ProjectSettingsError() {
  const t = useTranslations('projects');
  return (
    <div className="py-8 text-center text-destructive">
      {t('projectNotFound')}
    </div>
  );
}

function ProjectSettings({ projectSlug }: ProjectSettingsProps) {
  const t = useTranslations('projects');
  const { data: project } = useProjectSuspense(projectSlug);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('generalSettings')}</CardTitle>
          <CardDescription>{t('generalSettingsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectSettingsForm project={project} />
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
          <CardDescription>{t('dangerZoneDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteProjectDialog project={project} />
        </CardContent>
      </Card>
    </div>
  );
}

interface ProjectSettingsPageContentProps {
  projectSlug: string;
}

export function ProjectSettingsPageContent({
  projectSlug,
}: ProjectSettingsPageContentProps) {
  return (
    <ErrorBoundary fallback={<ProjectSettingsError />}>
      <Suspense fallback={<ProjectSettingsSkeleton />}>
        <ProjectSettings projectSlug={projectSlug} />
      </Suspense>
    </ErrorBoundary>
  );
}
