import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface AdminSettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminSettingsPage({
  params,
}: AdminSettingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminSettingsContent />;
}

function AdminSettingsContent() {
  const t = useTranslations('admin.settings');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-bold text-3xl">{t('title')}</h1>
      <p className="mt-4 text-gray-600">{t('title')}</p>
      {/* TODO: システム設定フォームを実装 */}
    </div>
  );
}
