import { getLocale, getTranslations } from "next-intl/server";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

export default async function DebtsLoading() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "money.debtsPage" });

  return (
    <div className="flex min-h-full flex-col" data-testid="money-debts-loading">
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <Skeleton className="h-11 w-full rounded-[var(--radius-control)]" />
        <Skeleton className="h-5 w-24 rounded" />
        <div className="flex flex-col gap-(--space-3) rounded-[var(--radius-card)] bg-surface-muted/55 p-(--space-4)">
          <Skeleton className="h-4 w-24 rounded" />
          <div className="grid grid-cols-2 gap-(--space-3)">
            <Skeleton className="h-16 w-full rounded-[var(--radius-control)]" />
            <Skeleton className="h-16 w-full rounded-[var(--radius-control)]" />
          </div>
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-28 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-28 w-full rounded-[var(--radius-card)]" />
      </div>
    </div>
  );
}
