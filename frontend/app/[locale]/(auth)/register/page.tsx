import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RegisterContent />;
}

function RegisterContent() {
  const t = useTranslations('auth');

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('signUpTitle')}</h1>
          <p className="mt-2 text-gray-600">{t('signUpDescription')}</p>
        </div>
        {/* TODO: 登録フォームを実装 */}
      </div>
    </div>
  );
}
