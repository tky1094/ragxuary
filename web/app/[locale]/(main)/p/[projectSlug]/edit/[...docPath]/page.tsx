import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/auth';

interface EditDocPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
    docPath: string[];
  }>;
}

export default async function EditDocPage({ params }: EditDocPageProps) {
  const { locale, projectSlug, docPath } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const path = docPath.join('/');

  return <EditDocContent projectSlug={projectSlug} path={path} />;
}

function EditDocContent({
  projectSlug,
  path,
}: {
  projectSlug: string;
  path: string;
}) {
  const t = useTranslations('docs');

  return (
    <div>
      <nav className="mb-4 text-gray-500 text-sm">
        {projectSlug} / {path}
      </nav>
      <h1 className="font-bold text-3xl">{t('edit')}</h1>
      <p className="mt-4 text-gray-600">{path}</p>
      {/* TODO: Implement document editor */}
    </div>
  );
}
