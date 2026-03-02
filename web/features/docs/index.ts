// Components

export type {
  DocsBreadcrumbProps,
  DocsContentProps,
  DocsContentSkeletonProps,
  DocsPaginationProps,
  DocsSidebarProps,
  DocsSidebarSkeletonProps,
  MobileSidebarToggleProps,
  TableOfContentsProps,
} from './components';
export {
  DocsBreadcrumb,
  DocsContent,
  DocsContentSkeleton,
  DocsPagination,
  DocsSidebar,
  DocsSidebarSkeleton,
  MobileSidebarToggle,
  ScrollToTop,
  TableOfContents,
} from './components';

// Hooks
export {
  useActiveHeading,
  useDocumentSuspense,
  useDocumentTreeSuspense,
  useSidebarPersistence,
} from './hooks';

// Prefetch utilities (for Server Components)
export { prefetchDocument, prefetchDocumentTree } from './lib/prefetch';

// Tree utilities (for app/ layer usage)
export {
  findAdjacentDocuments,
  findFirstDocument,
  flattenDocumentTree,
} from './lib/tree-utils';
