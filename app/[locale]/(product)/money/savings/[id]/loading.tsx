import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

/** Mirrors the loaded Savings detail: header, hero + cycle-facts group, sections. */
export default async function SavingsDetailLoading() {
  const t = await getTranslations("money.savingsDetail");
  return (
    <Page
      testId="savings-detail-loading"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_SAVINGS}
          title={t("title")}
        />
      }
    >
      <div
        className="flex flex-col gap-(--space-3)"
        data-testid="savings-detail-loading-hero"
      >
        <div className="flex flex-col gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-2)">
          <div className="flex items-center justify-between gap-(--space-3)">
            <div className="flex items-center gap-(--space-3)">
              <Skeleton className="size-11 rounded-(--radius-control)" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="size-9 rounded-full" />
          </div>
          <Skeleton className="h-9 w-2/3 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
        <div className="flex flex-col gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-1)">
          <div className="flex items-center justify-between gap-(--space-3)">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-(--space-3)">
            <Skeleton className="h-10 rounded" />
            <Skeleton className="h-10 rounded" />
            <Skeleton className="h-10 rounded" />
          </div>
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-(--space-2)">
        <Skeleton className="h-4 w-28 rounded" />
        <div className="flex flex-col gap-(--space-2) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4)">
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-(--space-2)">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-36 w-full rounded-(--radius-card)" />
      </div>
      <div className="flex flex-col gap-(--space-2)">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-24 w-full rounded-(--radius-card)" />
      </div>
    </Page>
  );
}
