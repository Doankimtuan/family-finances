import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Skeleton } from "@/shared/ui/skeleton";

export default async function PlanLoading() {
  const t = await getTranslations("plan");

  return (
    <Page topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}>
      <Section variant="emphasized" contentClassName="gap-(--space-4)">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-10 w-2/3 rounded" />
        <Skeleton className="h-14 w-full rounded-[var(--radius-card)]" />
      </Section>
      <Section contentClassName="gap-(--space-3)">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-20 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-20 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-20 w-full rounded-[var(--radius-card)]" />
      </Section>
    </Page>
  );
}
