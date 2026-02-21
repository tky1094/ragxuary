'use client';

import { BookText } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import type { DocumentTreeNode } from '@/client/types.gen';
import { cn } from '@/shared/lib/utils';

import { useDocumentTreeSuspense } from '../hooks';
import { DocsSidebarItem } from './DocsSidebarItem';

export interface DocsSidebarProps {
  /** Project slug for fetching document tree and URL construction */
  slug: string;
  /** Project name displayed as sidebar header */
  projectName?: string;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Build the initial set of expanded folder paths so that the current document
 * is visible in the tree on first render.
 */
function buildInitialExpandedPaths(
  nodes: DocumentTreeNode[],
  currentPath?: string
): Set<string> {
  if (!currentPath) return new Set<string>();

  const expanded = new Set<string>();

  function findAndExpand(
    children: DocumentTreeNode[],
    ancestors: string[]
  ): boolean {
    for (const node of children) {
      if (node.path === currentPath) {
        for (const ancestor of ancestors) {
          expanded.add(ancestor);
        }
        return true;
      }
      if (node.is_folder && node.children) {
        if (findAndExpand(node.children, [...ancestors, node.path])) {
          return true;
        }
      }
    }
    return false;
  }

  findAndExpand(nodes, []);
  return expanded;
}

export function DocsSidebar({
  slug,
  projectName,
  className,
}: DocsSidebarProps) {
  const t = useTranslations('docs');
  const params = useParams();
  const pathname = usePathname();

  const headerTitle = projectName ?? t('title');

  const locale = params.locale as string;
  const docsBasePath = `/${locale}/p/${slug}/docs/`;
  const currentPath = pathname.startsWith(docsBasePath)
    ? pathname.slice(docsBasePath.length)
    : undefined;

  const { data: tree } = useDocumentTreeSuspense(slug);

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    buildInitialExpandedPaths(tree, currentPath)
  );

  // Expand ancestor folders when navigating to a new document
  useEffect(() => {
    if (!currentPath) return;
    setExpandedPaths((prev) => {
      const needed = buildInitialExpandedPaths(tree, currentPath);
      if ([...needed].every((p) => prev.has(p))) return prev;
      return new Set([...prev, ...needed]);
    });
  }, [currentPath, tree]);

  const handleToggle = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  if (!tree || tree.length === 0) {
    return (
      <nav className={cn('px-3 py-4', className)} aria-label={headerTitle}>
        <div className="mb-3 flex items-center gap-2 px-2">
          <BookText className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground text-sm">
            {headerTitle}
          </span>
        </div>
        <p className="px-2 text-muted-foreground text-sm">{t('noDocs')}</p>
      </nav>
    );
  }

  return (
    <nav className={cn('px-3 py-4', className)} aria-label={headerTitle}>
      <div className="mb-3 flex items-center gap-2 px-2">
        <BookText className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-foreground text-sm">
          {headerTitle}
        </span>
      </div>
      <div role="tree">
        {tree.map((node) => (
          <DocsSidebarItem
            key={node.id}
            node={node}
            slug={slug}
            currentPath={currentPath}
            depth={0}
            expandedPaths={expandedPaths}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </nav>
  );
}
