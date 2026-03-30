import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { setRequestLocale } from 'next-intl/server';

import { ActivityPageContent } from '@/features/activity';
import { prefetchActivity } from '@/features/activity/lib/prefetch';

interface ActivityPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
  }>;
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { locale, projectSlug } = await params;
  setRequestLocale(locale);

  const queryClient = await prefetchActivity(projectSlug);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ActivityPageContent projectSlug={projectSlug} />
    </HydrationBoundary>
  );
}
