import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/shared/ui/skeleton";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

export default async function LoansLoading() {
  const t = await getTranslations("money.loansPage");
  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="money-loans-loading"
      aria-busy="true"
    >
      <TopAppBar
        variant="detail"
        title={t("title")}
        subtitle={t("subtitle")}
        backHref={APP_PATH.MONEY}
      />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <Skeleton className="h-11 w-full rounded-(--radius-control)" />
        <Skeleton className="h-28 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-7 w-32 rounded-(--radius-control)" />
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-40 w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-40 w-full rounded-[var(--radius-card)]" />
        </div>
        <Skeleton className="h-11 w-full rounded-(--radius-control)" />
      </div>
    </div>
  );
}
