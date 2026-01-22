import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/auth';
import { ProjectsPageContent } from '@/features/projects';
import { PageContainer } from '@/shared/components/layout';

interface ProjectsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <PageContainer>
      <ProjectsPageContent />
    </PageContainer>
  );
}
