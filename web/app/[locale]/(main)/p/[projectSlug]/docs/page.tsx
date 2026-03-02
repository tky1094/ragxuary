import { FileText } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Documents } from '@/client';
import { findFirstDocument } from '@/features/docs/lib/tree-utils';
import { getServerClient } from '@/shared/lib/api/client';

interface ProjectDocsPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
  }>;
}

export default async function ProjectDocsPage({
  params,
}: ProjectDocsPageProps) {
  const { locale, projectSlug } = await params;
  setRequestLocale(locale);

  const client = getServerClient();
  const { data: tree } = await Documents.getDocumentTree({
    client,
    path: { slug: projectSlug },
    throwOnError: true,
  });

  const firstDoc = findFirstDocument(tree);

  if (firstDoc) {
    redirect(`/${locale}/p/${projectSlug}/docs/${firstDoc.path}`);
  }

  const t = await getTranslations('docs.empty');

  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="font-semibold text-foreground text-xl">{t('title')}</h2>
      <p className="mt-2 max-w-sm text-muted-foreground text-sm">
        {t('description')}
      </p>
    </div>
  );
}
