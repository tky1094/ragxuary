import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  redirect(`/${locale}/settings/personal`);
}
