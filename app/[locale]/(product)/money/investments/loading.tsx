import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

export default async function InvestmentsLoading() {
  const t = await getTranslations("money.investments.overview");
  return (
    <Page
      testId="money-investments-loading"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <div
        className="flex flex-col gap-(--space-3)"
        data-testid="money-investments-loading-summary"
      >
        <div className="flex flex-col gap-(--space-2) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-2)">
          <Skeleton className="h-3 w-32 rounded" />
          <Skeleton className="h-9 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-1)">
          <Skeleton className="h-12 rounded" />
          <Skeleton className="h-12 rounded" />
          <Skeleton className="h-12 rounded" />
          <Skeleton className="h-12 rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-(--space-3)">
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-(--radius-control)" />
          <Skeleton className="h-11 w-2/3 rounded-full" />
        </div>
        <Skeleton className="h-28 w-full rounded-(--radius-card)" />
        <Skeleton className="h-28 w-full rounded-(--radius-card)" />
      </div>
    </Page>
  );
}
