'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';

import { MarkdownRenderer } from '@/shared/components/markdown';
import { extractHeadings } from '@/shared/lib/markdown/extract-headings';
import type { Heading } from '@/shared/lib/markdown/types';
import { cn } from '@/shared/lib/utils';

import { useDocumentSuspense } from '../hooks/useDocument';

export interface DocsContentProps {
  /** Project slug */
  slug: string;
  /** Document path */
  path: string;
  /** Additional CSS class names */
  className?: string;
  /** Callback when headings are extracted (for TOC in #124) */
  onHeadingsExtracted?: (headings: Heading[]) => void;
}

/**
 * Main documentation content viewer.
 * Fetches a document and renders it with MarkdownRenderer.
 * Extracts headings for table-of-contents integration.
 */
export function DocsContent({
  slug,
  path,
  className,
  onHeadingsExtracted,
}: DocsContentProps) {
  const t = useTranslations('docs');
  const { data: document } = useDocumentSuspense(slug, path);

  const headings = useMemo(() => {
    if (!document.content) return [];
    return extractHeadings(document.content);
  }, [document.content]);

  useEffect(() => {
    onHeadingsExtracted?.(headings);
  }, [headings, onHeadingsExtracted]);

  const lastUpdated = useMemo(() => {
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(document.updated_at));
  }, [document.updated_at]);

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
          className="prose-lg prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-headings:font-serif prose-headings:tracking-tight"
        />
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          {t('noDocs')}
        </div>
      )}
    </article>
  );
}
