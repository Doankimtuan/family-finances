import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

/** List/detail child skeleton. Avoids flashing the hub hero while nested Plan routes load. */
export function PlanChildLoading() {
  return (
    <Page
      topBar={
        <TopAppBar
          variant={TopAppBarVariant.DETAIL}
          title={<Skeleton className="h-6 w-28" />}
          subtitle={<Skeleton className="mt-(--space-1) h-4 w-48" />}
          backHref={APP_PATH.PLAN}
        />
      }
    >
      <Card tone="elevated" className="gap-(--space-3) p-(--space-4)">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
      </Card>
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        <div className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
          <div className="flex items-center gap-(--space-3) px-(--space-4) py-(--space-3)">
            <Skeleton className="size-8 rounded-(--radius-control)" />
            <div className="flex flex-1 flex-col gap-(--space-1)">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-(--space-3) px-(--space-4) py-(--space-3)">
            <Skeleton className="size-8 rounded-(--radius-control)" />
            <div className="flex flex-1 flex-col gap-(--space-1)">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </Card>
    </Page>
  );
}
