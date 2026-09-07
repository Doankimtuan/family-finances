import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
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
      <div className="flex flex-col gap-(--space-5)" aria-busy="true">
        <Card tone="hero" className="gap-0 p-(--space-4)">
          <div className="flex items-center justify-between gap-(--space-3)">
            <div className="flex min-w-0 items-center gap-(--space-3)">
              <Skeleton className="size-11 rounded-(--radius-control) bg-white/20" />
              <Skeleton className="h-4 w-32 bg-white/20" />
            </div>
            <Skeleton className="size-11 rounded-(--radius-control) bg-white/20" />
          </div>
          <Skeleton className="mt-(--space-3) h-9 w-44 bg-white/20" />
          <div className="mt-(--space-4) grid grid-cols-2 gap-(--space-3) border-t border-white/15 pt-(--space-3)">
            <Skeleton className="h-10 w-full bg-white/20" />
            <Skeleton className="h-10 w-full bg-white/20" />
          </div>
          <Skeleton className="mt-(--space-4) h-2 w-full bg-white/20" />
        </Card>
        <Skeleton className="h-11 w-full rounded-(--radius-control)" />
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="flex min-h-14 items-center justify-between gap-(--space-3) border-b border-divider px-(--space-4) py-(--space-3) last:border-b-0"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </Card>
        <Skeleton className="h-12 w-full rounded-(--radius-control)" />
      </div>
    </Page>
  );
}
