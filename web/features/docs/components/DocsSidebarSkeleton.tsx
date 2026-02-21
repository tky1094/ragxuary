import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

export interface DocsSidebarSkeletonProps {
  className?: string;
}

/**
 * Loading skeleton for DocsSidebar.
 * Mirrors the layout structure of the actual component.
 */
export function DocsSidebarSkeleton({ className }: DocsSidebarSkeletonProps) {
  return (
    <nav className={cn('px-3 py-4', className)} aria-hidden="true">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2 px-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Tree items */}
      <div className="space-y-1">
        {/* Folder 1 (expanded) */}
        <Skeleton className="ml-2 h-7 w-3/4 rounded-md" />
        <Skeleton className="ml-8 h-7 w-2/3 rounded-md" />
        <Skeleton className="ml-8 h-7 w-1/2 rounded-md" />
        <Skeleton className="ml-8 h-7 w-3/5 rounded-md" />

        {/* Folder 2 (collapsed) */}
        <Skeleton className="ml-2 h-7 w-1/2 rounded-md" />

        {/* Folder 3 (expanded) */}
        <Skeleton className="ml-2 h-7 w-2/3 rounded-md" />
        <Skeleton className="ml-8 h-7 w-3/5 rounded-md" />
        <Skeleton className="ml-8 h-7 w-1/2 rounded-md" />
      </div>
    </nav>
  );
}
