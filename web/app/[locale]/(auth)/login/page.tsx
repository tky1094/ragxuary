import { setRequestLocale } from 'next-intl/server';

import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthLayout
      quote={{
        text: 'Knowledge is the eye of desire and can become the pilot of the soul.',
        author: 'Will Durant',
      }}
    >
      <LoginForm />
    </AuthLayout>
  );
}
