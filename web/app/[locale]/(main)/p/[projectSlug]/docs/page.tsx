import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

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

  return <ProjectDocsContent projectSlug={projectSlug} />;
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
