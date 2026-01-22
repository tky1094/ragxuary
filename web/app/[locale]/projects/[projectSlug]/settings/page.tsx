import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/auth';
import { ProjectSettingsPageContent } from '@/features/projects';
import { PageContainer } from '@/shared/components/layout';

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

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <PageContainer>
      <ProjectSettingsPageContent projectSlug={projectSlug} />
    </PageContainer>
  );
}
