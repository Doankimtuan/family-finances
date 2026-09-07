import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

/** Mirrors the loaded Savings list: detail header, hero + facts, grouped rows. */
export default async function SavingsLoading() {
  const t = await getTranslations("money.savingsPage");
  return (
    <Page
      testId="money-savings-loading"
      contentClassName="gap-(--space-5)"
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
        data-testid="money-savings-loading-summary"
      >
        <div className="flex flex-col gap-(--space-2) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-2)">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-9 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
          <Skeleton className="mt-(--space-2) h-8 w-full rounded" />
        </div>
        <div className="flex flex-col gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-1)">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-5 w-full rounded" />
          <Skeleton className="h-5 w-full rounded" />
          <Skeleton className="h-5 w-2/3 rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-(--space-2)">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-20 w-full rounded-(--radius-card)" />
        <Skeleton className="h-20 w-full rounded-(--radius-card)" />
      </div>
      <div className="flex flex-col gap-(--space-2)">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-16 w-full rounded-(--radius-card)" />
      </div>
    </Page>
  );
}
