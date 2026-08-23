import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

export default async function LoanDetailLoading() {
  const t = await getTranslations("money.loanDetail");
  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="loan-detail-loading"
      aria-busy="true"
    >
      <TopAppBar
        variant="detail"
        title={t("title")}
        backHref={APP_PATH.MONEY_LOANS}
      />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <Skeleton className="h-11 w-full rounded-(--radius-control)" />
        <Skeleton className="h-56 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-16 w-full rounded-(--radius-control)" />
        <Skeleton className="h-56 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-44 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-11 w-full rounded-(--radius-control)" />
      </div>
    </div>
  );
}
