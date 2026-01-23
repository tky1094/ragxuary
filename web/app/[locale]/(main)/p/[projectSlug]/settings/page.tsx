import { setRequestLocale } from 'next-intl/server';
import { ProjectSettingsPageContent } from '@/features/projects';

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

  return <ProjectSettingsPageContent projectSlug={projectSlug} />;
}
