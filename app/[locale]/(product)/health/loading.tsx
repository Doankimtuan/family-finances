import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

/** Mirrors loaded Health: detail header, summary hero, supporting insight rows. */
export default async function HealthLoading() {
  const t = await getTranslations("health");

  return (
    <Page
      testId="health-overview-loading"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.HOME}
          backLabel={t("backHome")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <div
        className="flex flex-col gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-2)"
        data-testid="health-overview-loading-summary"
      >
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-9 w-24 rounded" />
        <Skeleton className="mt-(--space-2) h-4 w-full rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>

      <div
        className="flex flex-col gap-(--space-3)"
        data-testid="health-overview-loading-factors"
      >
        <Skeleton className="h-4 w-40 rounded" />
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <div className="divide-y divide-border-subtle/65">
            <div className="px-(--space-4) py-(--space-3)">
              <Skeleton className="h-4 w-2/5 rounded" />
            </div>
            <div className="px-(--space-4) py-(--space-3)">
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
            <div className="px-(--space-4) py-(--space-3)">
              <Skeleton className="h-4 w-1/3 rounded" />
            </div>
          </div>
        </Card>
      </div>

      <Skeleton className="h-11 w-full rounded-(--radius-control)" />
    </Page>
  );
}
