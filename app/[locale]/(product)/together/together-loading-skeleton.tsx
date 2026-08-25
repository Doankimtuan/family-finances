import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Skeleton } from "@/shared/ui/skeleton";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";

export async function TogetherLoadingSkeleton({ testId }: { testId?: string }) {
  const t = await getTranslations("together");

  return (
    <Page
      testId={testId}
      topBar={
        <TopAppBar
          variant="contextual"
          eyebrow={t("header.eyebrow")}
          title={t("header.headline")}
          subtitle={t("header.supporting")}
          icon={NAVIGATION_ICONS.together}
          status={<Skeleton className="h-7 w-20 rounded-full" />}
          meta={<Skeleton className="h-4 w-36" />}
        />
      }
    >
      <section className="flex flex-col gap-(--space-3)">
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Card tone="hero" className="gap-(--space-4) p-(--space-4)">
          <div className="flex items-start justify-between gap-(--space-3)">
            <div className="flex min-w-0 items-center gap-(--space-3)">
              <Skeleton className="size-12 rounded-(--radius-control)" />
              <div className="flex min-w-0 flex-col gap-(--space-2)">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <div className="flex items-end justify-between gap-(--space-3) border-t border-divider pt-(--space-3)">
            <div className="flex flex-col gap-(--space-2)">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-(--space-3)">
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <div className="flex items-center gap-(--space-3) p-(--space-3)">
            <Skeleton className="size-9 rounded-(--radius-control)" />
            <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-5 w-8" />
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-(--space-3)">
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex flex-col gap-(--space-2)">
          {[0, 1, 2, 3].map((row) => (
            <Card
              key={row}
              tone="interactive"
              className="flex-row items-center gap-(--space-3) p-(--space-3)"
            >
              <Skeleton className="size-9 rounded-(--radius-control)" />
              <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="size-4 rounded-full" />
            </Card>
          ))}
        </div>
      </section>
    </Page>
  );
}
