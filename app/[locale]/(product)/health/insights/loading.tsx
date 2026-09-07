import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

/** Mirrors loaded Health insights: detail header, notice rows, scenario rows. */
export default async function HealthInsightsLoading() {
  const t = await getTranslations("health");

  return (
    <Page
      testId="health-insights-loading"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.HEALTH}
          backLabel={t("insights.backHealth")}
          title={t("insights.title")}
          subtitle={t("insights.subtitle")}
        />
      }
    >
      <div
        className="flex flex-col gap-(--space-3)"
        data-testid="health-insights-loading-notices"
      >
        <Skeleton className="h-4 w-24 rounded" />
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <div className="divide-y divide-border-subtle/65">
            <div className="flex flex-col gap-(--space-2) px-(--space-4) py-(--space-3)">
              <Skeleton className="h-4 w-2/5 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
            <div className="flex flex-col gap-(--space-2) px-(--space-4) py-(--space-3)">
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-3 w-5/6 rounded" />
            </div>
            <div className="flex flex-col gap-(--space-2) px-(--space-4) py-(--space-3)">
              <Skeleton className="h-4 w-1/3 rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
          </div>
        </Card>
      </div>

      <div
        className="flex flex-col gap-(--space-3)"
        data-testid="health-insights-loading-scenarios"
      >
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-4/5 rounded" />
        <Card tone="soft" className="gap-0 overflow-hidden p-0">
          <div className="divide-y divide-border-subtle/65">
            <div className="flex flex-col gap-(--space-2) px-(--space-4) py-(--space-3)">
              <Skeleton className="h-4 w-2/5 rounded" />
              <Skeleton className="h-3 w-full rounded" />
            </div>
            <div className="flex flex-col gap-(--space-2) px-(--space-4) py-(--space-3)">
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
