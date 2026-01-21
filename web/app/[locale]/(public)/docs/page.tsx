import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface DocsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DocsContent />;
}

function DocsContent() {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-bold text-3xl">{t('docs.title')}</h1>
      <p className="mt-4 text-gray-600">{t('projects.noProjects')}</p>
      {/* TODO: プロジェクト一覧を実装 */}
    </div>
  );
}
