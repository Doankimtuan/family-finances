import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

export default async function DebtDetailLoading() {
  const t = await getTranslations("money.debtDetail");

  return (
    <Page
      testId="debt-detail-loading"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          title={t("title")}
          backHref={APP_PATH.MONEY_DEBTS}
        />
      }
    >
      <div
        className="flex flex-col gap-(--space-4)"
        aria-busy="true"
        aria-hidden
      >
        <Skeleton className="h-52 w-full rounded-(--radius-card)" />
        <div className="flex flex-col gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-1)">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-11 w-full rounded" />
          <Skeleton className="h-11 w-full rounded" />
          <Skeleton className="h-11 w-full rounded" />
          <Skeleton className="h-11 w-2/3 rounded" />
        </div>
        <Skeleton className="h-40 w-full rounded-(--radius-card)" />
      </div>
    </Page>
  );
}
