import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

function ModeSkeleton() {
  return (
    <div
      className="grid grid-cols-3 gap-(--space-1) rounded-[var(--radius-control)] bg-surface-muted/65 p-(--space-1)"
      aria-hidden
    >
      <Skeleton className="h-11 rounded-[var(--radius-control)]" />
      <Skeleton className="h-11 rounded-[var(--radius-control)]" />
      <Skeleton className="h-11 rounded-[var(--radius-control)]" />
    </div>
  );
}

function FieldSkeleton() {
  return (
    <Card tone="elevated" className="gap-(--space-3) p-(--space-4)" aria-hidden>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-11 w-full rounded-[var(--radius-control)]" />
    </Card>
  );
}

export default async function MoneyTransactionAddLoading() {
  const t = await getTranslations("money");

  return (
    <Page
      testId="money-transaction-add-loading"
      contentClassName="gap-(--space-5) pb-0"
      topBar={
        <TopAppBar
          variant="form"
          backHref={APP_PATH.MONEY_TRANSACTIONS}
          title={t("capture")}
          subtitle={t("captureForm.subtitle")}
        />
      }
    >
      <ModeSkeleton />
      <Card
        tone="elevated"
        className="gap-(--space-3) p-(--space-4)"
        aria-hidden
      >
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full rounded-[var(--radius-control)]" />
      </Card>
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
    </Page>
  );
}
