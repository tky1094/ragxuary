import type { DocumentTreeNode } from '@/client/types.gen';

export interface FlatDocumentNode {
  path: string;
  title: string;
  slug: string;
  /** Ancestor folder segments for breadcrumb */
  ancestors: Array<{ path: string; title: string }>;
}

/**
 * Flatten a document tree into an ordered list of leaf documents (non-folders).
 * Preserves the visual order from the tree for prev/next navigation.
 */
export function flattenDocumentTree(
  nodes: DocumentTreeNode[]
): FlatDocumentNode[] {
  const result: FlatDocumentNode[] = [];

  function walk(
    children: DocumentTreeNode[],
    ancestors: Array<{ path: string; title: string }>
  ) {
    for (const node of children) {
      if (node.is_folder) {
        if (node.children) {
          walk(node.children, [
            ...ancestors,
            { path: node.path, title: node.title },
          ]);
        }
      } else {
        result.push({
          path: node.path,
          title: node.title,
          slug: node.slug,
          ancestors,
        });
      }
    }
  }

  walk(nodes, []);
  return result;
}

/**
 * Find prev/next documents relative to the current path.
 */
export function findAdjacentDocuments(
  flatDocs: FlatDocumentNode[],
  currentPath: string
): { prev: FlatDocumentNode | null; next: FlatDocumentNode | null } {
  const index = flatDocs.findIndex((d) => d.path === currentPath);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? flatDocs[index - 1] : null,
    next: index < flatDocs.length - 1 ? flatDocs[index + 1] : null,
  };
}

/**
 * Find the first leaf document (non-folder) in the tree.
 * Used for redirecting from docs home page.
 */
export function findFirstDocument(
  nodes: DocumentTreeNode[]
): DocumentTreeNode | null {
  for (const node of nodes) {
    if (!node.is_folder) return node;
    if (node.children) {
      const found = findFirstDocument(node.children);
      if (found) return found;
    }
  }
  return null;
}
