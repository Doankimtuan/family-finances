import { getTranslations } from "next-intl/server";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";

export default async function DebtDetailLoading() {
  const t = await getTranslations("money.debtDetail");

  return (
    <Page
      testId="debt-detail-loading"
      topBar={<TopAppBar title={t("title")} />}
    >
      <div className="flex flex-col gap-(--space-4)" aria-hidden>
        <div className="h-52 animate-pulse rounded-(--radius-card) bg-surface-muted" />
        <div className="flex flex-col gap-(--space-3) rounded-(--radius-card) bg-surface-muted/50 p-(--space-4)">
          <div className="h-5 w-24 animate-pulse rounded bg-surface-muted" />
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="h-11 animate-pulse border-b border-border-subtle/70 bg-surface-muted/40"
            />
          ))}
        </div>
        <div className="h-11 animate-pulse rounded-(--radius-control) bg-surface-muted" />
        <div className="h-40 animate-pulse rounded-(--radius-card) bg-surface-muted/50" />
      </div>
    </Page>
  );
}
