import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface DocPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
    docPath: string[];
  }>;
}

export default async function DocPage({ params }: DocPageProps) {
  const { locale, projectSlug, docPath } = await params;
  setRequestLocale(locale);
  const path = docPath.join('/');

  return <DocContent projectSlug={projectSlug} path={path} />;
}

function DocContent({
  projectSlug,
  path,
}: {
  projectSlug: string;
  path: string;
}) {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-4 text-gray-500 text-sm">
        {projectSlug} / {path}
      </nav>
      <article className="prose max-w-none">
        <h1>
          {t('docs.title')}: {path}
        </h1>
        {/* TODO: ドキュメント内容を表示 */}
      </article>
    </div>
  );
}
