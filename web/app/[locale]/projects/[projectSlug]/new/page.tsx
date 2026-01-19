import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface NewDocPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
  }>;
}

export default async function NewDocPage({ params }: NewDocPageProps) {
  const { locale, projectSlug } = await params;
  setRequestLocale(locale);

  return <NewDocContent projectSlug={projectSlug} />;
}

function NewDocContent({ projectSlug }: { projectSlug: string }) {
  const t = useTranslations('docs');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">{t('new')}</h1>
      <p className="mt-4 text-gray-600">{projectSlug}</p>
      {/* TODO: ドキュメント作成フォームを実装 */}
    </div>
  );
}
