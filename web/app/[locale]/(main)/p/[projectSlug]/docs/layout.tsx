import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { Projects } from '@/client';
import {
  DocsSidebar,
  DocsSidebarSkeleton,
  prefetchDocumentTree,
} from '@/features/docs';
import { getServerClient } from '@/shared/lib/api/client';

interface DocsLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
    projectSlug: string;
  }>;
}

export default async function DocsLayout({
  children,
  params,
}: DocsLayoutProps) {
  const { locale, projectSlug } = await params;
  setRequestLocale(locale);

  const [queryClient, { data: project }] = await Promise.all([
    prefetchDocumentTree(projectSlug),
    Projects.getProject({
      client: getServerClient(),
      path: { slug: projectSlug },
      throwOnError: true,
    }),
  ]);

  return (
    <div className="flex gap-0">
      <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-border border-r">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<DocsSidebarSkeleton />}>
            <DocsSidebar slug={projectSlug} projectName={project.name} />
          </Suspense>
        </HydrationBoundary>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
