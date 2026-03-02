'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Fragment, useMemo } from 'react';

import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb';

import { useDocumentTreeSuspense } from '../hooks';
import { flattenDocumentTree } from '../lib/tree-utils';

export interface DocsBreadcrumbProps {
  /** Project slug */
  slug: string;
  /** Current document path */
  currentPath: string;
  /** Current document title */
  documentTitle: string;
}

/**
 * Docs-specific breadcrumb using document tree for ancestor titles.
 * Shows: Documentation > Folder > ... > Current Document
 */
export function DocsBreadcrumb({
  slug,
  currentPath,
  documentTitle,
}: DocsBreadcrumbProps) {
  const t = useTranslations('docs');
  const params = useParams();
  const locale = params.locale as string;

  const { data: tree } = useDocumentTreeSuspense(slug);

  const ancestors = useMemo(() => {
    const flat = flattenDocumentTree(tree);
    const doc = flat.find((d) => d.path === currentPath);
    return doc?.ancestors ?? [];
  }, [tree, currentPath]);

  return (
    <BreadcrumbRoot>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/${locale}/p/${slug}/docs`}>{t('title')}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {ancestors.map((segment) => (
          <Fragment key={segment.path}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground">{segment.title}</span>
            </BreadcrumbItem>
          </Fragment>
        ))}

        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{documentTitle}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
}
