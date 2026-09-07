import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function InboxQueueSummarySkeleton() {
  return (
    <>
      <Card tone="soft" className="gap-(--space-3) p-(--space-4)">
        <div className="flex items-start justify-between gap-(--space-3)">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="size-10 rounded-(--radius-control)" />
        </div>
      </Card>

      <Card tone="elevated" className="gap-0 p-(--space-4)">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-(--space-2) h-4 w-32" />
      </Card>
    </>
  );
}

export function InboxQueueListSkeleton() {
  return (
    <>
      <Card tone="elevated" className="gap-(--space-3) p-(--space-3)">
        <div className="flex items-center gap-(--space-2)">
          <Skeleton className="size-8 rounded-(--radius-control)" />
          <Skeleton className="h-10 flex-1 rounded-(--radius-control)" />
        </div>
        <div className="flex gap-(--space-2) overflow-hidden border-t border-divider pt-(--space-3)">
          {[0, 1, 2, 3].map((chip) => (
            <Skeleton key={chip} className="h-9 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      </Card>

      <section className="flex flex-col gap-(--space-2)">
        <div className="flex flex-col gap-(--space-1)">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <div className="divide-y divide-divider">
            {[0, 1].map((row) => (
              <div
                key={row}
                className="flex items-start gap-(--space-3) px-(--space-4) py-(--space-3)"
              >
                <Skeleton className="size-8 rounded-(--radius-control)" />
                <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}
