import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface UsersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function UsersPage({ params }: UsersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UsersContent />;
}

function UsersContent() {
  const t = useTranslations('admin.users');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-4 text-gray-600">{t('list')}</p>
      {/* TODO: ユーザー一覧と管理機能を実装 */}
    </div>
  );
}
