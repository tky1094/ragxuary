import { Card, CardDescription, CardHeader } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

/**
 * Loading skeleton for the dashboard recent projects section.
 * Used as Suspense fallback while data is loading.
 */
const SKELETON_ITEMS = ['skeleton-1', 'skeleton-2', 'skeleton-3'] as const;

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {SKELETON_ITEMS.map((id) => (
        <Card key={id}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <CardDescription>
              <Skeleton className="h-4 w-full" />
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
