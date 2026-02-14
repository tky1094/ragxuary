import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { auth } from '@/auth';
import { DocsContent, DocsContentSkeleton } from '@/features/docs';
import { prefetchDocument } from '@/features/docs/lib/prefetch';

interface DocPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
    docPath: string[];
  }>;
}

export default async function DocPage({ params }: DocPageProps) {
  const { locale, projectSlug, docPath } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const path = docPath.join('/');
  const queryClient = await prefetchDocument(projectSlug, path);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<DocsContentSkeleton />}>
        <DocsContent slug={projectSlug} path={path} />
      </Suspense>
    </HydrationBoundary>
  );
}
