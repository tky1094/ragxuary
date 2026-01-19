import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface GroupsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function GroupsPage({ params }: GroupsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GroupsContent />;
}

function GroupsContent() {
  const t = useTranslations('admin.groups');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-4 text-gray-600">{t('list')}</p>
      {/* TODO: グループ一覧と管理機能を実装 */}
    </div>
  );
}
