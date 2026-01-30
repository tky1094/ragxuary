import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { auth } from '@/auth';
import {
  BookmarksPageContent,
  prefetchBookmarkList,
} from '@/features/bookmarks';
import { ProjectListSkeleton } from '@/features/projects';

interface BookmarksPageProps {
  params: Promise<{ locale: string }>;
}

export default async function BookmarksPage({ params }: BookmarksPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Prefetch bookmarks on the server for faster initial render
  const queryClient = await prefetchBookmarkList();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ProjectListSkeleton />}>
        <BookmarksPageContent />
      </Suspense>
    </HydrationBoundary>
  );
}
