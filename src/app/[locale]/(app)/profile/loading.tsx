import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-[200px] rounded-xl" />
      <Skeleton className="h-6 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-[100px] rounded-xl" />
        <Skeleton className="h-[100px] rounded-xl" />
        <Skeleton className="h-[100px] rounded-xl" />
      </div>
    </div>
  );
}
