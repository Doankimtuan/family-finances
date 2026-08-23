import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

export default async function LoanFullScheduleLoading() {
  const t = await getTranslations("money.loanDetail");
  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="loan-full-schedule-loading"
      aria-busy="true"
    >
      <TopAppBar variant="detail" title={t("fullScheduleTitle")} />
      <main className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <Skeleton className="h-11 w-full rounded-(--radius-control)" />
        <div className="divide-y divide-divider">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton
              key={index}
              className="h-20 w-full rounded-none py-(--space-3)"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
