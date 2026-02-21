// Components

export type {
  DocsContentProps,
  DocsContentSkeletonProps,
  DocsSidebarProps,
  DocsSidebarSkeletonProps,
} from './components';
export {
  DocsContent,
  DocsContentSkeleton,
  DocsSidebar,
  DocsSidebarSkeleton,
} from './components';

// Hooks
export { useDocumentSuspense, useDocumentTreeSuspense } from './hooks';

// Prefetch utilities (for Server Components)
export { prefetchDocument, prefetchDocumentTree } from './lib/prefetch';
