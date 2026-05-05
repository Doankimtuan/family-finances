import { Skeleton } from "@/components/ui/skeleton";

export function TransactionsSkeleton() {
  return (
    <div className="space-y-6 pb-24">
      {/* Quick Add Skeleton */}
      <div className="sm:hidden space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>

      {/* Detailed Entry Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>

      {/* History List Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    </div>
  );
}
