// Components

export type { DocsContentProps, DocsContentSkeletonProps } from './components';
export { DocsContent, DocsContentSkeleton } from './components';

// Hooks
export { useDocumentSuspense } from './hooks';

// Prefetch utilities (for Server Components)
export { prefetchDocument, prefetchDocumentTree } from './lib/prefetch';
