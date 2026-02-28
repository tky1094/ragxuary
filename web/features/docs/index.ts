// Components

export type {
  DocsContentProps,
  DocsContentSkeletonProps,
  DocsSidebarProps,
  DocsSidebarSkeletonProps,
  TableOfContentsProps,
} from './components';
export {
  DocsContent,
  DocsContentSkeleton,
  DocsSidebar,
  DocsSidebarSkeleton,
  TableOfContents,
} from './components';

// Hooks
export {
  useActiveHeading,
  useDocumentSuspense,
  useDocumentTreeSuspense,
} from './hooks';

// Prefetch utilities (for Server Components)
export { prefetchDocument, prefetchDocumentTree } from './lib/prefetch';
