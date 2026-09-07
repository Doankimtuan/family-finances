import { getTranslations } from "next-intl/server";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { FloatingAction } from "@/shared/patterns/floating-action";
import { MoneyCaptureAction } from "../money-capture-action";

function FilterSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-3)" aria-hidden>
      <div className="flex gap-(--space-2) overflow-hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-11 w-20 shrink-0 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-11 w-28 rounded-full" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-5)" aria-hidden>
      {[0, 1].map((group) => (
        <div key={group} className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-4 w-24" />
          <Card tone="elevated" className="gap-0 p-0">
            <div className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-3)"
                >
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex flex-1 flex-col gap-(--space-1)">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}

export default async function TransactionsLoading() {
  const t = await getTranslations("money.transactionsPage");

  return (
    <Page
      testId="money-transactions-loading"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="primary"
          title={t("title")}
          subtitle={<Skeleton className="h-4 w-56" />}
          icon={FINANCE_ICONS.cash}
          trailing={<Skeleton className="size-11 rounded-(--radius-control)" />}
        />
      }
    >
      <FilterSkeleton />
      <ListSkeleton />
      <FloatingAction>
        <MoneyCaptureAction testId="transactions-add" />
      </FloatingAction>
    </Page>
  );
}
