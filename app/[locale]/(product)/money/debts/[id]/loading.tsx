import { getTranslations } from "next-intl/server";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Skeleton } from "@/shared/ui/skeleton";

export default async function DebtDetailLoading() {
  const t = await getTranslations("money.debtDetail");

  return (
    <Page
      testId="debt-detail-loading"
      topBar={<TopAppBar title={t("title")} />}
    >
      <div className="flex flex-col gap-(--space-4)" aria-hidden>
        <Skeleton className="h-52 w-full rounded-(--radius-card)" />
        <div className="flex flex-col gap-(--space-3) rounded-(--radius-card) bg-surface-muted/50 p-(--space-4)">
          <Skeleton className="h-5 w-24 rounded" />
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton
              key={index}
              className="h-11 w-full rounded border-b border-border-subtle/70 bg-surface-muted/40"
            />
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-(--radius-control)" />
        <Skeleton className="h-40 w-full rounded-(--radius-card) bg-surface-muted/50" />
      </div>
    </Page>
  );
}
