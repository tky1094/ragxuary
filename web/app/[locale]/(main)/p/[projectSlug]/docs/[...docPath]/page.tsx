import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { auth } from '@/auth';
import { Documents } from '@/client';
import { DocsContent, DocsContentSkeleton } from '@/features/docs';
import { getServerClient } from '@/shared/lib/api/client';

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

  return (
    <Suspense fallback={<DocsContentSkeleton />}>
      <DocsContentLoader slug={projectSlug} path={path} />
    </Suspense>
  );
}

async function DocsContentLoader({
  slug,
  path,
}: {
  slug: string;
  path: string;
}) {
  const client = getServerClient();
  const { data: document } = await Documents.getDocument({
    client,
    path: { slug, path },
    throwOnError: true,
  });

  return <DocsContent document={document} />;
}
