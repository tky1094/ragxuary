import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/auth';
import { PageContainer } from '@/shared/components/layout';

interface ProjectDocsPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
  }>;
}

export default async function ProjectDocsPage({
  params,
}: ProjectDocsPageProps) {
  const { locale, projectSlug } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <PageContainer>
      <ProjectDocsContent projectSlug={projectSlug} />
    </PageContainer>
  );
}

function ProjectDocsContent({ projectSlug }: { projectSlug: string }) {
  const t = useTranslations();

  return (
    <div>
      <h1 className="font-bold text-3xl">
        {projectSlug} {t('docs.title')}
      </h1>
      <p className="mt-4 text-gray-600">{t('docs.noDocs')}</p>
      {/* TODO: Implement document list */}
    </div>
  );
}
