import { Skeleton } from '@/shared/components/ui/skeleton';

export function ActivityFeedSkeleton() {
  return (
    <div className="relative">
      {/* Timeline connector line */}
      <div
        className="absolute top-0 bottom-0 left-5 w-px bg-border"
        aria-hidden="true"
      />
      <div className="space-y-0">
        {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((id) => (
          <div key={id} className="relative pb-8 pl-12">
            {/* Timeline dot */}
            <div className="absolute left-[15px] top-1.5 h-2.5 w-2.5 rounded-full bg-muted" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-48" />
              <div className="ml-1 space-y-1.5 border-border border-l-2 pl-3">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3.5 w-36" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
