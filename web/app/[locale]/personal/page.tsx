import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/auth';
import { PageContainer } from '@/shared/components/layout';

interface PersonalPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PersonalPage({ params }: PersonalPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <PageContainer>
      <PersonalContent />
    </PageContainer>
  );
}

function PersonalContent() {
  const t = useTranslations('personal');

  return (
    <div>
      <h1 className="font-bold text-3xl">{t('title')}</h1>
      <p className="mt-4 text-gray-600">{t('description')}</p>
      {/* TODO: Implement personal settings */}
    </div>
  );
}
