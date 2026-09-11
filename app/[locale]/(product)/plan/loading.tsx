import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function PlanContextSkeleton() {
  return (
    <Card tone="elevated" className="gap-(--space-4) p-(--space-4)">
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="size-11 rounded-(--radius-control)" />
      </div>
      <div className="flex items-start gap-(--space-3)">
        <Skeleton className="size-8 rounded-(--radius-control)" />
        <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="border-t border-divider pt-(--space-3)">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="mt-(--space-2) h-4 w-28" />
      </div>
    </Card>
  );
}

export function PlanWorkRowSkeleton() {
  return (
    <div className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-2)">
      <Skeleton className="size-8 rounded-(--radius-control)" />
      <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export default async function PlanLoading() {
  const t = await getTranslations("plan");

  return (
    <Page topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}>
      <PlanContextSkeleton />
      <Section
        title={<Skeleton className="h-4 w-40" />}
        testId="plan-home-exceptions"
      >
        <Card tone="elevated" className="gap-0 p-0">
          <PlanWorkRowSkeleton />
        </Card>
      </Section>
      <Section title={<Skeleton className="h-4 w-32" />}>
        <Card tone="elevated" className="gap-(--space-3) p-(--space-4)">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
        </Card>
      </Section>
      <Section
        title={<Skeleton className="h-4 w-28" />}
        testId="plan-home-upcoming"
      >
        <Card tone="elevated" className="gap-0 p-0">
          <PlanWorkRowSkeleton />
        </Card>
      </Section>
      <Section
        title={<Skeleton className="h-4 w-32" />}
        testId="plan-home-jars"
      >
        <Card tone="elevated" className="gap-0 p-0">
          <PlanWorkRowSkeleton />
          <PlanWorkRowSkeleton />
        </Card>
      </Section>
      <Section
        title={<Skeleton className="h-4 w-28" />}
        testId="plan-home-goals"
      >
        <Card tone="elevated" className="gap-0 p-0">
          <PlanWorkRowSkeleton />
        </Card>
      </Section>
    </Page>
  );
}
