import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton({ statCards = 4 }: { statCards?: number }) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-${statCards}`}>
        {Array.from({ length: statCards }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-6 w-32 mt-6" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function OperatorDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
