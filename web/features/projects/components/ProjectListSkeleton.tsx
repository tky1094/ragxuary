import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

const SKELETON_ITEMS = [
  'skeleton-1',
  'skeleton-2',
  'skeleton-3',
  'skeleton-4',
  'skeleton-5',
  'skeleton-6',
] as const;

/**
 * Loading skeleton for the project list.
 * Used as Suspense fallback while data is loading.
 */
export function ProjectListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {SKELETON_ITEMS.map((id) => (
        <Card
          key={id}
          className="rounded-md border-border/60 bg-card/80 py-1.5 shadow-none"
        >
          <div className="flex flex-col gap-3 p-4">
            {/* Header: Icon + Name + Badge */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
