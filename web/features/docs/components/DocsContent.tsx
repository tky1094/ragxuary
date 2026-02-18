import { getTranslations } from 'next-intl/server';

import { MarkdownRenderer } from '@/shared/components/markdown';
import { cn } from '@/shared/lib/utils';

export interface DocsContentProps {
  /** Document data fetched on the server */
  document: {
    title: string;
    content: string | null;
    updated_at: string;
  };
  /** Additional CSS class names */
  className?: string;
}

/**
 * Main documentation content viewer (Server Component).
 * Receives pre-fetched document data and renders it with MarkdownRenderer.
 */
export async function DocsContent({ document, className }: DocsContentProps) {
  const t = await getTranslations('docs');

  const lastUpdated = new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(document.updated_at));

  return (
    <article
      className={cn('mx-auto max-w-4xl px-6 py-8 sm:px-8 sm:py-12', className)}
    >
      <header className="mb-8 border-border border-b pb-6">
        <h1 className="font-bold font-serif text-4xl text-foreground tracking-tight sm:text-5xl">
          {document.title}
        </h1>
        <div className="mt-4 flex items-center gap-2 text-muted-foreground text-sm">
          <time dateTime={document.updated_at}>
            {t('lastUpdated')}: {lastUpdated}
          </time>
        </div>
      </header>

      {document.content ? (
        <MarkdownRenderer
          content={document.content}
          className="prose-lg prose-headings:font-serif prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-headings:tracking-tight"
        />
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          {t('noDocs')}
        </div>
      )}
    </article>
  );
}
