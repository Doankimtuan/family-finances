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
      <div className="flex gap-(--space-2) overflow-hidden" aria-hidden>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-11 w-20 shrink-0 animate-pulse rounded-full bg-surface-muted"
          />
        ))}
      </div>
      <div className="flex flex-col gap-(--space-2)" aria-hidden>
        <div className="h-5 w-24 animate-pulse rounded bg-surface-muted" />
        {[1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="h-16 animate-pulse border-b border-border-subtle/70 bg-surface-muted/40"
          />
        ))}
      </div>
    </Page>
  );
}
