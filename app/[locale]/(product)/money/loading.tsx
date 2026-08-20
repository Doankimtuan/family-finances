import { getLocale, getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Skeleton } from "@/shared/ui/skeleton";

/** Loading shell for Money preserves the established app frame and account hierarchy. */
export default async function MoneyLoading() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "money" });

  return (
    <Page
      testId="money-hub-loading"
      topBar={<TopAppBar variant="primary" title={t("title")} />}
    >
      <Section variant="emphasized" contentClassName="gap-(--space-4)">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-10 w-2/3 rounded" />
        <div className="grid grid-cols-2 gap-(--space-2)">
          <Skeleton className="h-14 w-full rounded-[var(--radius-control)]" />
          <Skeleton className="h-14 w-full rounded-[var(--radius-control)]" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </Section>
      <Section contentClassName="gap-(--space-3)">
        <Skeleton className="h-5 w-32 rounded" />
        <div className="flex flex-col gap-(--space-2) rounded-[var(--radius-card)] bg-surface-muted/55 p-(--space-3)">
          <Skeleton className="h-16 w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-16 w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-16 w-full rounded-[var(--radius-card)]" />
        </div>
      </Section>
    </Page>
  );
}
