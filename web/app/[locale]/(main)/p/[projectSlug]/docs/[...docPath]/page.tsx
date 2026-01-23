import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/auth';

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

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

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
    <div>
      <nav className="mb-4 text-gray-500 text-sm">
        {projectSlug} / {path}
      </nav>
      <article className="prose max-w-none">
        <h1>
          {t('docs.title')}: {path}
        </h1>
        {/* TODO: Display document content */}
      </article>
    </div>
  );
}
