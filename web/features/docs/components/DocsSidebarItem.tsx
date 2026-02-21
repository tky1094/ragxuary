'use client';

import { ChevronRight, FileText, Folder } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import type { DocumentTreeNode } from '@/client/types.gen';
import { cn } from '@/shared/lib/utils';

export interface DocsSidebarItemProps {
  /** Tree node to render */
  node: DocumentTreeNode;
  /** Project slug for URL construction */
  slug: string;
  /** Current document path for active highlighting */
  currentPath?: string;
  /** Nesting depth for indentation (0-based) */
  depth?: number;
  /** Set of expanded folder paths */
  expandedPaths: Set<string>;
  /** Callback to toggle folder expand/collapse */
  onToggle: (path: string) => void;
}

function findNextVisibleItem(current: HTMLElement): HTMLElement | null {
  const tree = current.closest('[role="tree"]');
  if (!tree) return null;
  const items = Array.from(
    tree.querySelectorAll<HTMLElement>('[data-tree-item]')
  );
  const index = items.indexOf(current);
  return items[index + 1] ?? null;
}

function findPreviousVisibleItem(current: HTMLElement): HTMLElement | null {
  const tree = current.closest('[role="tree"]');
  if (!tree) return null;
  const items = Array.from(
    tree.querySelectorAll<HTMLElement>('[data-tree-item]')
  );
  const index = items.indexOf(current);
  return items[index - 1] ?? null;
}

export function DocsSidebarItem({
  node,
  slug,
  currentPath,
  depth = 0,
  expandedPaths,
  onToggle,
}: DocsSidebarItemProps) {
  const params = useParams();
  const locale = params.locale as string;

  const isFolder = node.is_folder;
  const isExpanded = isFolder && expandedPaths.has(node.path);

  const paddingLeft = 8 + depth * 16;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = findNextVisibleItem(e.currentTarget);
        next?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = findPreviousVisibleItem(e.currentTarget);
        prev?.focus();
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        if (isFolder) {
          if (!isExpanded) {
            onToggle(node.path);
          } else {
            // Move focus to first child
            const firstChild =
              e.currentTarget.parentElement?.querySelector<HTMLElement>(
                '[role="group"] [data-tree-item]'
              );
            firstChild?.focus();
          }
        }
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        if (isFolder && isExpanded) {
          onToggle(node.path);
        } else {
          // Move focus to parent folder
          const parentGroup = e.currentTarget
            .closest('[role="treeitem"]')
            ?.parentElement?.closest('[role="treeitem"]');
          const parentButton =
            parentGroup?.querySelector<HTMLElement>('[data-tree-item]');
          parentButton?.focus();
        }
        break;
      }
      case 'Enter':
      case ' ': {
        if (isFolder) {
          e.preventDefault();
          onToggle(node.path);
        }
        // For documents, let Link handle navigation
        break;
      }
    }
  };

  const itemClassName = cn(
    'flex w-full items-center gap-1.5 rounded-md py-1.5 text-sm transition-colors',
    'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  );

  if (isFolder) {
    return (
      <div role="treeitem" aria-expanded={isExpanded} tabIndex={-1}>
        <button
          type="button"
          data-tree-item
          tabIndex={-1}
          className={itemClassName}
          style={{ paddingLeft }}
          onClick={() => onToggle(node.path)}
          onKeyDown={handleKeyDown}
        >
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
              isExpanded && 'rotate-90'
            )}
          />
          <Folder className="h-4 w-4 shrink-0" />
          <span className="truncate">{node.title}</span>
        </button>
        {isExpanded && node.children && node.children.length > 0 && (
          // biome-ignore lint/a11y/useSemanticElements: role="group" is the correct WAI-ARIA TreeView pattern for nested tree items
          <div role="group">
            {node.children.map((child) => (
              <DocsSidebarItem
                key={child.id}
                node={child}
                slug={slug}
                currentPath={currentPath}
                depth={depth + 1}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = node.path === currentPath;
  const href = `/${locale}/p/${slug}/docs/${node.path}`;

  return (
    <div role="treeitem" tabIndex={-1}>
      <Link
        href={href}
        data-tree-item
        tabIndex={-1}
        className={cn(
          itemClassName,
          isActive && 'bg-accent font-medium text-accent-foreground'
        )}
        style={{ paddingLeft: paddingLeft + 18 }}
        onKeyDown={handleKeyDown}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="truncate">{node.title}</span>
      </Link>
    </div>
  );
}
