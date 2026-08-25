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
        className="flex flex-col gap-(--space-4) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-2)"
        data-testid="investment-detail-loading-hero"
      >
        <div className="flex items-start justify-between gap-(--space-3)">
          <div className="flex items-center gap-(--space-3)">
            <Skeleton className="size-11 rounded-(--radius-control)" />
            <div className="flex flex-col gap-(--space-1)">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-9 w-3/4 rounded" />
        <div className="flex flex-col gap-(--space-2) border-t border-border-subtle pt-(--space-3)">
          <Skeleton className="h-3 w-1/3 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <Skeleton className="h-11 w-full rounded-(--radius-control)" />
      <div className="flex flex-col gap-(--space-3)">
        <Skeleton className="h-5 w-24 rounded" />
        <div className="grid grid-cols-2 gap-x-(--space-4) rounded-(--radius-card) border border-border-subtle bg-surface-muted/45 px-(--space-3)">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton
              key={index}
              className={`h-14 rounded-none border-b border-border-subtle/60 ${index >= 4 ? "border-b-0" : ""}`}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-(--space-3) rounded-(--radius-card) bg-surface-muted/55 p-(--space-4)">
        <Skeleton className="h-5 w-40 rounded" />
        <Skeleton className="h-10 w-full rounded" />
        <Skeleton className="h-10 w-full rounded" />
      </div>
      <div className="flex flex-col gap-(--space-3)">
        <Skeleton className="h-5 w-32 rounded" />
        <div className="flex flex-col gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-1)">
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
      </div>
    </Page>
  );
}
