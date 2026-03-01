import { Skeleton } from "@/components/ui/skeleton";

export function DebtsSkeleton() {
  return (
    <div className="space-y-6 pb-24">
      <section className="grid grid-cols-2 gap-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </section>

      <Skeleton className="h-64 rounded-2xl" />

      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
