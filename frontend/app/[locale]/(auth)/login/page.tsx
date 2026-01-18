import { setRequestLocale } from 'next-intl/server';

import { LoginForm } from '@/components/auth/LoginForm';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
