import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface NewProjectPageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewProjectPage({ params }: NewProjectPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NewProjectContent />;
}

function NewProjectContent() {
  const t = useTranslations('projects');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-bold text-3xl">{t('new')}</h1>
      <p className="mt-4 text-gray-600">{t('new')}</p>
      {/* TODO: プロジェクト作成フォームを実装 */}
    </div>
  );
}
