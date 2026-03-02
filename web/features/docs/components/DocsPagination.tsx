'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { cn } from '@/shared/lib/utils';

import { useDocumentTreeSuspense } from '../hooks';
import { findAdjacentDocuments, flattenDocumentTree } from '../lib/tree-utils';

export interface DocsPaginationProps {
  /** Current document path */
  currentPath: string;
  /** Project slug */
  slug: string;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Previous/Next document navigation at the bottom of the content area.
 * VitePress-style card layout with hover transitions.
 */
export function DocsPagination({
  currentPath,
  slug,
  className,
}: DocsPaginationProps) {
  const t = useTranslations('docs.pagination');
  const params = useParams();
  const locale = params.locale as string;

  const { data: tree } = useDocumentTreeSuspense(slug);

  const { prev, next } = useMemo(() => {
    const flat = flattenDocumentTree(tree);
    return findAdjacentDocuments(flat, currentPath);
  }, [tree, currentPath]);

  if (!prev && !next) return null;

  const basePath = `/${locale}/p/${slug}/docs`;

  const cardClass = cn(
    'group flex flex-1 flex-col gap-1.5 rounded-lg border border-border p-4',
    'transition-colors duration-200',
    'hover:border-foreground/20 hover:bg-accent'
  );

  return (
    <nav
      aria-label={t('label')}
      className={cn(
        'mt-12 flex items-stretch gap-4 border-border border-t pt-6',
        className
      )}
    >
      {prev ? (
        <Link
          href={`${basePath}/${prev.path}`}
          className={cn(cardClass, 'items-start')}
        >
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <ChevronLeft className="h-3 w-3" />
            {t('previous')}
          </span>
          <span className="font-medium text-foreground text-sm">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link
          href={`${basePath}/${next.path}`}
          className={cn(cardClass, 'items-end')}
        >
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            {t('next')}
            <ChevronRight className="h-3 w-3" />
          </span>
          <span className="font-medium text-foreground text-sm">
            {next.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
