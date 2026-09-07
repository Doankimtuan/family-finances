import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

export default async function InvestmentDetailLoading() {
  const t = await getTranslations("money.investments.detail");
  return (
    <Page
      testId="investment-detail-loading"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_INVESTMENTS}
          title={t("title")}
        />
      }
    >
      <div
        className="flex flex-col gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-2)"
        data-testid="investment-detail-loading-hero"
      >
        <div className="flex items-center justify-between gap-(--space-3)">
          <div className="flex items-center gap-(--space-3)">
            <Skeleton className="size-11 rounded-(--radius-control)" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
          <Skeleton className="size-11 rounded-(--radius-control)" />
        </div>
        <Skeleton className="h-9 w-3/4 rounded" />
        <Skeleton className="h-5 w-1/2 rounded" />
        <div className="flex flex-col gap-(--space-2) border-t border-border-subtle pt-(--space-3)">
          <Skeleton className="h-3 w-1/3 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="flex gap-(--space-2)">
        <Skeleton className="h-11 min-w-0 flex-1 rounded-(--radius-control)" />
        <Skeleton className="h-11 min-w-0 flex-1 rounded-(--radius-control)" />
      </div>
      <div className="flex flex-col gap-(--space-3)">
        <Skeleton className="h-4 w-24 rounded" />
        <div className="flex flex-col gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-1)">
          <Skeleton className="h-5 w-full rounded" />
          <Skeleton className="h-5 w-full rounded" />
          <Skeleton className="h-5 w-2/3 rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-(--space-3)">
        <Skeleton className="h-4 w-40 rounded" />
        <div className="flex flex-col gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-1)">
          <Skeleton className="h-5 w-full rounded" />
          <Skeleton className="h-5 w-3/4 rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-(--space-3)">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-48 rounded" />
        <div className="flex flex-col gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-1)">
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
      </div>
    </Page>
  );
}
