import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { auth } from '@/auth';
import { Documents } from '@/client';
import {
  DocsBreadcrumb,
  DocsContent,
  DocsContentSkeleton,
  DocsPagination,
  TableOfContents,
} from '@/features/docs';
import { getServerClient } from '@/shared/lib/api/client';
import { extractHeadings } from '@/shared/lib/markdown';

interface DocPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
    docPath: string[];
  }>;
}

export default async function DocPage({ params }: DocPageProps) {
  const [{ locale, projectSlug, docPath }, session] = await Promise.all([
    params,
    auth(),
  ]);
  setRequestLocale(locale);

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

  const headings = document.content ? extractHeadings(document.content) : [];

  return (
    <div className="flex gap-0">
      {/* Content area */}
      <div className="min-w-0 flex-1">
        {/* Breadcrumb */}
        <div className="border-border border-b px-6 py-3 xl:px-8">
          <Suspense fallback={null}>
            <DocsBreadcrumb
              slug={slug}
              currentPath={path}
              documentTitle={document.title}
            />
          </Suspense>
        </div>

        {/* Document content */}
        <DocsContent document={document} />

        {/* Prev/Next pagination */}
        <div className="px-6 pb-8 sm:px-8">
          <Suspense fallback={null}>
            <DocsPagination currentPath={path} slug={slug} />
          </Suspense>
        </div>
      </div>

      {/* Desktop TOC */}
      {headings.length > 0 && (
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto border-border border-l px-4 py-8 xl:block">
          <TableOfContents headings={headings} />
        </aside>
      )}
    </div>
  );
}
