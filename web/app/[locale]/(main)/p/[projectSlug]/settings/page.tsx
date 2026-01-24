import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { setRequestLocale } from 'next-intl/server';

import { ProjectSettingsPageContent } from '@/features/projects';
import { prefetchProject } from '@/features/projects/lib/prefetch';

interface ProjectSettingsPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
  }>;
}

export default async function ProjectSettingsPage({
  params,
}: ProjectSettingsPageProps) {
  const { locale, projectSlug } = await params;
  setRequestLocale(locale);

  // Prefetch project data on the server
  const queryClient = await prefetchProject(projectSlug);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectSettingsPageContent projectSlug={projectSlug} />
    </HydrationBoundary>
  );
}
