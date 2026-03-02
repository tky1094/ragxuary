import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { Projects } from '@/client';
import {
  DocsSidebar,
  DocsSidebarSkeleton,
  MobileSidebarToggle,
  prefetchDocumentTree,
  ScrollToTop,
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
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ScrollToTop />
      <div className="-mx-6 -my-8">
        {/* Mobile sidebar toggle bar */}
        <div className="sticky top-16 z-30 flex h-12 items-center border-border border-b bg-background px-4 xl:hidden">
          <Suspense fallback={null}>
            <MobileSidebarToggle>
              <DocsSidebar slug={projectSlug} projectName={project.name} />
            </MobileSidebarToggle>
          </Suspense>
        </div>

        <div className="flex gap-0">
          {/* Desktop sidebar */}
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-border border-r xl:block">
            <Suspense fallback={<DocsSidebarSkeleton />}>
              <DocsSidebar slug={projectSlug} projectName={project.name} />
            </Suspense>
          </aside>

          {/* Main content area (page renders Content + TOC here) */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </HydrationBoundary>
  );
}
