import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

export interface DocsContentSkeletonProps {
  className?: string;
}

/**
 * Loading skeleton for DocsContent.
 * Mirrors the layout structure of the actual component.
 */
export function DocsContentSkeleton({ className }: DocsContentSkeletonProps) {
  return (
    <article
      className={cn('mx-auto max-w-4xl px-6 py-8 sm:px-8 sm:py-12', className)}
    >
      {/* Header */}
      <header className="mb-8 border-border border-b pb-6">
        <Skeleton className="h-12 w-3/4 sm:h-14" />
        <Skeleton className="mt-4 h-5 w-48" />
      </header>

      {/* Content paragraphs */}
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
        </div>

        <Skeleton className="mt-8 h-8 w-2/3" />

        <div className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    </article>
  );
}
