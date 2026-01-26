import { setRequestLocale } from 'next-intl/server';

import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthLayout
      quote={{
        text: 'The beginning is the most important part of the work.',
        author: 'Plato',
      }}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
