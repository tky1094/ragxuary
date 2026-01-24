import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { auth } from '@/auth';
import { ProjectsPageContent } from '@/features/projects';
import { prefetchProjectList } from '@/features/projects/lib/prefetch';

interface ProjectsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Prefetch project list on the server for SEO and faster initial render
  const queryClient = await prefetchProjectList();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectsPageContent />
    </HydrationBoundary>
  );
}
