import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { auth } from '@/auth';
import { DashboardContent } from '@/features/dashboard';
import { prefetchProjectList } from '@/features/projects/lib/prefetch';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const [{ locale }, session] = await Promise.all([params, auth()]);
  setRequestLocale(locale);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Prefetch recent projects (limit 3 for dashboard)
  const queryClient = await prefetchProjectList(0, 3);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent />
    </HydrationBoundary>
  );
}
