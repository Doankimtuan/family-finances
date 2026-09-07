import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/shared/ui/skeleton";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

export default async function LoanFullScheduleLoading() {
  const t = await getTranslations("money.loanDetail");
  return (
    <Page
      testId="loan-full-schedule-loading"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          title={t("fullScheduleTitle")}
          backHref={APP_PATH.MONEY_LOANS}
        />
      }
    >
      <div aria-busy="true" className="flex flex-col gap-(--space-4)">
        <Skeleton className="h-11 w-full rounded-(--radius-control)" />
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex min-h-14 items-center justify-between gap-(--space-3) border-b border-divider px-(--space-4) py-(--space-3) last:border-b-0"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <div className="flex flex-col items-end gap-(--space-1)">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </Page>
  );
}
