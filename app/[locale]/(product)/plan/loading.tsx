import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function PlanContextSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between gap-(--space-2)">
        <Skeleton className="h-11 w-40 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <Card tone="default" className="gap-(--space-3) p-(--space-4)">
        <div className="flex items-center justify-between gap-(--space-2)">
          <Skeleton className="h-6 w-36 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-3 w-48" />
        <div className="relative pb-(--space-5)">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="absolute top-2 right-(--space-5) h-5 w-12 rounded-sm" />
        </div>
        <div className="grid grid-cols-3 divide-x divide-divider-subtle border-t border-divider-subtle pt-(--space-3)">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
        </div>
      </Card>
    </>
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

export function PlanShortcutTilesFallback() {
  return (
    <div
      className="grid grid-cols-2 gap-(--space-2)"
      data-testid="plan-shortcuts"
      aria-hidden="true"
    >
      {[0, 1].map((item) => (
        <Card
          key={item}
          tone="elevated"
          className="gap-(--space-2) p-(--space-3)"
        >
          <Skeleton className="size-7 rounded-(--radius-control)" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </Card>
      ))}
    </div>
  );
}

export default async function PlanLoading() {
  const t = await getTranslations("plan");

  return (
    <Page
      topBar={
        <TopAppBar
          title={t("home.title")}
          subtitle={t("home.subtitle")}
          trailing={<Skeleton className="h-11 w-24 rounded-full" />}
        />
      }
    >
      <PlanContextSkeleton />
      <Section
        title={<Skeleton className="h-4 w-32" />}
        testId="plan-home-overspending"
      >
        <Card tone="warning" className="gap-(--space-3) p-(--space-4)">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
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
      <Section title={<Skeleton className="h-4 w-32" />}>
        <Card tone="elevated" className="gap-0 p-0">
          <PlanWorkRowSkeleton />
          <PlanWorkRowSkeleton />
        </Card>
      </Section>
      <Section
        title={<Skeleton className="h-4 w-28" />}
        description={<Skeleton className="h-3 w-52" />}
        testId="plan-home-upcoming"
      >
        <div className="flex flex-col gap-(--space-2)">
          <Card tone="elevated" className="gap-0 p-0">
            <PlanWorkRowSkeleton />
          </Card>
          <Card tone="elevated" className="gap-0 p-0">
            <PlanWorkRowSkeleton />
          </Card>
        </div>
      </Section>
      <PlanShortcutTilesFallback />
    </Page>
  );
}
