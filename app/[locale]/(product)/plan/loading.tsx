import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

function PlanJarSkeleton() {
  return (
    <Card tone="interactive" className="gap-(--space-3) p-(--space-3)">
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="flex min-w-0 flex-col gap-(--space-2)">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-(--space-3)">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24 justify-self-end" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="flex items-center justify-between gap-(--space-2)">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-12" />
      </div>
    </Card>
  );
}

function PlanGoalSkeleton() {
  return (
    <Card tone="interactive" className="gap-(--space-3) p-(--space-3)">
      <div className="flex items-start justify-between gap-(--space-3)">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="grid grid-cols-2 gap-(--space-3) border-t border-divider pt-(--space-3)">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24 justify-self-end" />
      </div>
    </Card>
  );
}

export default async function PlanLoading() {
  const t = await getTranslations("plan");

  return (
    <Page topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}>
      <div className="flex flex-col gap-(--space-3)">
        <Card tone="elevated" className="gap-(--space-4) p-(--space-4)">
          <div className="flex items-start justify-between gap-(--space-3)">
            <div className="flex flex-col gap-(--space-2)">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-40" />
            </div>
            <Skeleton className="size-11 rounded-(--radius-control)" />
          </div>
          <div className="flex items-start gap-(--space-3) border-t border-divider pt-(--space-3)">
            <Skeleton className="mt-1 size-2.5 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </Card>
        <Card tone="elevated" className="gap-0 p-(--space-4)">
          <div className="grid grid-cols-3 gap-(--space-3)">
            <div className="flex flex-col gap-(--space-2)">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex flex-col gap-(--space-2)">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-10" />
            </div>
            <div className="flex flex-col gap-(--space-2)">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </Card>
      </div>
      <Section title={<Skeleton className="h-4 w-32" />}>
        <div className="flex flex-col gap-(--space-2)">
          <PlanJarSkeleton />
          <PlanJarSkeleton />
        </div>
      </Section>
      <Section title={<Skeleton className="h-4 w-28" />}>
        <div className="flex flex-col gap-(--space-2)">
          <PlanGoalSkeleton />
        </div>
      </Section>
      <Section title={<Skeleton className="h-4 w-36" />}>
        <Card tone="elevated" className="gap-0 p-(--space-4)">
          <div className="flex items-center gap-(--space-3)">
            <Skeleton className="size-8 rounded-(--radius-control)" />
            <div className="flex flex-1 flex-col gap-(--space-1)">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </Card>
      </Section>
    </Page>
  );
}
