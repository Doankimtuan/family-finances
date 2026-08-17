import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Skeleton } from "@/shared/ui/skeleton";

export default async function InboxLoading() {
  const t = await getTranslations("inbox");

  return (
    <Page topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}>
      <div className="flex gap-(--space-2)">
        <Skeleton className="h-11 flex-1 rounded-[var(--radius-control)]" />
        <Skeleton className="h-11 flex-1 rounded-[var(--radius-control)]" />
      </div>
      <Section contentClassName="gap-(--space-2)">
        <Skeleton className="h-20 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-20 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-20 w-full rounded-[var(--radius-card)]" />
      </Section>
    </Page>
  );
}
