import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface EditProjectPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
  }>;
}

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  const { locale, projectSlug } = await params;
  setRequestLocale(locale);

  return <EditProjectContent projectSlug={projectSlug} />;
}

function EditProjectContent({ projectSlug }: { projectSlug: string }) {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-bold text-3xl">{t('common.edit')}</h1>
      <p className="mt-4 text-gray-600">{projectSlug}</p>
      {/* TODO: プロジェクト編集フォームを実装 */}
    </div>
  );
}
