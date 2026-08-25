import { getTranslations } from "next-intl/server";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";

export default async function TransactionsLoading() {
  const t = await getTranslations("money.transactionsPage");

  return (
    <Page
      testId="money-transactions-loading"
      topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}
    >
      <div
        className="flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle/70 bg-surface/55 p-(--space-3)"
        aria-hidden
      >
        <div className="flex gap-(--space-2) overflow-hidden">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-surface-muted"
            />
          ))}
        </div>
        <div className="h-11 animate-pulse rounded-[var(--radius-control)] bg-surface-muted/70" />
      </div>
      <div
        className="relative border-l border-border-subtle/70 pl-(--space-3)"
        aria-hidden
      >
        <div className="mb-(--space-2) h-4 w-24 animate-pulse rounded bg-surface-muted" />
        <div className="flex flex-col gap-0">
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="h-16 animate-pulse border-b border-border-subtle/70 bg-surface-muted/40"
            />
          ))}
        </div>
      </div>
    </Page>
  );
}
