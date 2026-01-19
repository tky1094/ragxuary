import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminContent />;
}

function AdminContent() {
  const t = useTranslations('admin');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-4 text-gray-600">{t('title')}</p>
      {/* TODO: 管理ダッシュボードを実装 */}
    </div>
  );
}
