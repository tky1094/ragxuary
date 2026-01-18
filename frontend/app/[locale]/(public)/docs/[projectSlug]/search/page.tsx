import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface DocsSearchPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
  }>;
}

export default async function DocsSearchPage({ params }: DocsSearchPageProps) {
  const { locale, projectSlug } = await params;
  setRequestLocale(locale);

  return <DocsSearchContent projectSlug={projectSlug} />;
}

function DocsSearchContent({ projectSlug }: { projectSlug: string }) {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">
        {projectSlug} {t('docs.search')}
      </h1>
      <p className="mt-4 text-gray-600">{t('common.noResults')}</p>
      {/* TODO: 検索フォームと結果表示を実装 */}
    </div>
  );
}
