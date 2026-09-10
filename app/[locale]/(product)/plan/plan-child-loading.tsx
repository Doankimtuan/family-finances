import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

function PlanChildHeader() {
  return (
    <TopAppBar
      variant={TopAppBarVariant.DETAIL}
      title={<Skeleton className="h-6 w-28" />}
      subtitle={<Skeleton className="mt-(--space-1) h-4 w-48" />}
      backHref={APP_PATH.PLAN}
    />
  );
}

function PlanWorkRowSkeleton() {
  return (
    <div className="flex items-center gap-(--space-3) px-(--space-4) py-(--space-3)">
      <Skeleton className="size-8 rounded-(--radius-control)" />
      <div className="flex flex-1 flex-col gap-(--space-1)">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

/** List skeleton for Hũ / Goals / other Plan children. */
export function PlanChildLoading() {
  return (
    <Page topBar={<PlanChildHeader />}>
      <Skeleton className="h-4 w-64" />
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        <div className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
          <PlanWorkRowSkeleton />
          <PlanWorkRowSkeleton />
          <PlanWorkRowSkeleton />
        </div>
      </Card>
    </Page>
  );
}

/** Detail skeleton: identity hero + supporting strip + actions. */
export function PlanIntentionDetailLoading() {
  return (
    <Page topBar={<PlanChildHeader />}>
      <Card tone="hero" className="gap-(--space-4) p-(--space-4)">
        <div className="flex items-center gap-(--space-3)">
          <Skeleton className="size-11 rounded-(--radius-control) bg-white/20" />
          <Skeleton className="h-4 w-40 bg-white/20" />
        </div>
        <Skeleton className="h-8 w-48 bg-white/20" />
        <Skeleton className="h-3 w-full bg-white/15" />
      </Card>
      <Card tone="elevated" className="gap-(--space-3) p-(--space-4)">
        <div className="grid grid-cols-3 gap-(--space-3)">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-2 w-full" />
      </Card>
      <Card tone="elevated" className="gap-(--space-2) p-(--space-4)">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </Card>
    </Page>
  );
}
