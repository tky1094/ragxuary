import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginContent />;
}

function LoginContent() {
  const t = useTranslations('auth');

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('signInTitle')}</h1>
          <p className="mt-2 text-gray-600">{t('signInDescription')}</p>
        </div>
        {/* TODO: ログインフォームを実装 */}
      </div>
    </div>
  );
}
