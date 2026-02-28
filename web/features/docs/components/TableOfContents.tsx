'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';

import type { Heading } from '@/shared/lib/markdown/types';
import { cn } from '@/shared/lib/utils';

import { useActiveHeading } from '../hooks/useActiveHeading';

export interface TableOfContentsProps {
  /** Heading list extracted from the document */
  headings: Heading[];
  /** Additional CSS class names */
  className?: string;
}

const INDENT: Record<Heading['level'], string> = {
  2: 'pl-0',
  3: 'pl-4',
  4: 'pl-8',
};

/**
 * Table of Contents with scroll-spy highlighting.
 * Receives headings as props — does NOT call extractHeadings directly.
 */
export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const t = useTranslations('docs');

  const headingIds = useMemo(() => headings.map((h) => h.id), [headings]);
  const activeId = useActiveHeading(headingIds);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.replaceState(null, '', `#${id}`);
      }
    },
    []
  );

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav aria-label={t('onThisPage')} className={cn('text-sm', className)}>
      <h2 className="mb-4 font-semibold text-foreground text-xs uppercase tracking-widest">
        {t('onThisPage')}
      </h2>

      <ul className="space-y-0.5">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;

          return (
            <li key={heading.id} className={INDENT[heading.level]}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleClick(e, heading.id)}
                className={cn(
                  'block border-l-2 py-1.5 pl-3 leading-snug transition-colors duration-150',
                  isActive
                    ? 'border-primary font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                )}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
