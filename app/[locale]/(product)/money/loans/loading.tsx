import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

export default async function LoansLoading() {
  const t = await getTranslations("money.loansPage");
  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="money-loans-loading"
      aria-busy="true"
    >
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-3) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <Skeleton className="h-12 w-full rounded-(--radius-control)" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-(--radius-control)" />
      </div>
    </div>
  );
}
