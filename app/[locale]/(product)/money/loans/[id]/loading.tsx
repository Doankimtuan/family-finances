import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

export default async function LoanDetailLoading() {
  const t = await getTranslations("money.loanDetail");
  return (
    <Page
      testId="loan-detail-loading"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          title={t("title")}
          backHref={APP_PATH.MONEY_LOANS}
        />
      }
    >
      <div className="flex flex-col gap-(--space-3)" aria-busy="true">
        <div className="flex flex-col gap-(--space-2) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-2)">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-9 w-3/4 rounded" />
          <Skeleton className="mt-(--space-2) h-8 w-full rounded" />
          <Skeleton className="h-16 w-full rounded" />
        </div>
        <Skeleton className="h-11 w-full rounded-(--radius-control)" />
        <Skeleton className="h-40 w-full rounded-(--radius-card)" />
        <Skeleton className="h-40 w-full rounded-(--radius-card)" />
      </div>
    </Page>
  );
}
