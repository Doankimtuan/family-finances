import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { INBOX_TEST_ID } from "@/modules/inbox/application/inbox-constants";

const FILTER_CHIP_COUNT = 4;
const QUEUE_ROW_COUNT = 3;

export function InboxQueueSummarySkeleton() {
  return (
    <Card
      tone="elevated"
      className="gap-(--space-3) p-(--space-4)"
      data-testid={INBOX_TEST_ID.LOADING_SUMMARY}
    >
      <div className="flex min-w-0 flex-col gap-(--space-2)">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-7 w-40 rounded-full" />
    </Card>
  );
}

export function InboxQueueTabsSkeleton() {
  return (
    <div
      className="flex gap-(--space-1) rounded-full bg-surface-muted"
      data-testid={INBOX_TEST_ID.LOADING_TABS}
    >
      <Skeleton className="h-11 flex-1 rounded-full" />
      <Skeleton className="h-11 flex-1 rounded-full" />
    </div>
  );
}

function InboxQueueRowSkeleton() {
  return (
    <div
      className="flex flex-col gap-(--space-2) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-3)"
      data-testid={INBOX_TEST_ID.LOADING_ROW}
    >
      <div className="flex items-center gap-(--space-3)">
        <Skeleton className="size-8 shrink-0 rounded-(--radius-control)" />
        <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <Skeleton className="size-2 rounded-full" />
      </div>
      <div className="flex items-center justify-between border-t border-divider pt-(--space-2)">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function InboxQueueListSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-4)">
      <div className="flex flex-col gap-(--space-2)">
        <div className="flex h-11 items-center gap-(--space-2) rounded-(--radius-control) bg-surface-muted/70 px-(--space-3)">
          <Skeleton className="size-5 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div
          className="flex gap-(--space-2) overflow-hidden"
          data-testid={INBOX_TEST_ID.LOADING_FILTERS}
        >
          {Array.from({ length: FILTER_CHIP_COUNT }, (_, chip) => (
            <Skeleton key={chip} className="h-11 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      </div>

      <section className="flex flex-col gap-(--space-3)">
        <div className="flex items-end justify-between gap-(--space-3)">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="flex flex-col gap-(--space-2)">
          {Array.from({ length: QUEUE_ROW_COUNT }, (_, row) => (
            <InboxQueueRowSkeleton key={row} />
          ))}
        </div>
      </section>
    </div>
  );
}
