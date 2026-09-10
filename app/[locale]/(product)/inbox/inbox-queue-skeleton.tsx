import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { INBOX_TEST_ID } from "@/modules/inbox/application/inbox-constants";

const FILTER_CHIP_COUNT = 4;
const PRIMARY_GROUP_ROW_COUNT = 3;
const SECONDARY_GROUP_ROW_COUNT = 2;

export function InboxQueueSummarySkeleton() {
  return (
    <div
      className="flex flex-col gap-(--space-3)"
      data-testid={INBOX_TEST_ID.LOADING_SUMMARY}
    >
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
    </div>
  );
}

export function InboxQueueTabsSkeleton() {
  return (
    <div
      className="flex gap-(--space-1) rounded-full bg-surface-muted p-(--space-1)"
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
      className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-3)"
      data-testid={INBOX_TEST_ID.LOADING_ROW}
    >
      <Skeleton className="size-8 shrink-0 rounded-(--radius-control)" />
      <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <div className="flex shrink-0 items-center gap-(--space-2)">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="size-2 rounded-full" />
      </div>
    </div>
  );
}

function InboxQueueGroupSkeleton({
  rows,
  titleWidthClass,
}: {
  rows: number;
  titleWidthClass: string;
}) {
  return (
    <section
      className="flex flex-col gap-(--space-2)"
      data-testid={INBOX_TEST_ID.LOADING_GROUP}
    >
      <div className="flex items-end justify-between gap-(--space-3)">
        <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
          <Skeleton className={`h-4 ${titleWidthClass}`} />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-3 w-12" />
      </div>
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        <div className="divide-y divide-divider">
          {Array.from({ length: rows }, (_, row) => (
            <InboxQueueRowSkeleton key={row} />
          ))}
        </div>
      </Card>
    </section>
  );
}

export function InboxQueueListSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-5)">
      <Card
        tone="elevated"
        className="gap-(--space-3) p-(--space-3)"
        data-testid={INBOX_TEST_ID.LOADING_FILTERS}
      >
        <div className="flex items-center gap-(--space-2)">
          <Skeleton className="size-11 rounded-(--radius-control)" />
          <Skeleton className="h-11 flex-1 rounded-(--radius-control)" />
        </div>
        <div className="flex flex-wrap gap-(--space-2) overflow-hidden border-t border-divider pt-(--space-3)">
          {Array.from({ length: FILTER_CHIP_COUNT }, (_, chip) => (
            <Skeleton key={chip} className="h-11 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      </Card>

      <InboxQueueGroupSkeleton
        rows={PRIMARY_GROUP_ROW_COUNT}
        titleWidthClass="w-40"
      />
      <InboxQueueGroupSkeleton
        rows={SECONDARY_GROUP_ROW_COUNT}
        titleWidthClass="w-32"
      />
    </div>
  );
}
