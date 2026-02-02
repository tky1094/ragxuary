import { setRequestLocale } from 'next-intl/server';

import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { SetupForm } from '@/features/setup';

interface SetupPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SetupPage({ params }: SetupPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthLayout
      quote={{
        text: 'The beginning is the most important part of the work.',
        author: 'Plato',
      }}
    >
      <SetupForm />
    </AuthLayout>
  );
}
