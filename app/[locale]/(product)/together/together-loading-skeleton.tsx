import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { TogetherHeaderTab } from "@/shared/patterns/together-header-tab";
import { Skeleton } from "@/shared/ui/skeleton";

export async function TogetherLoadingSkeleton({ testId }: { testId?: string }) {
  const [t, tNavigation] = await Promise.all([
    getTranslations("together"),
    getTranslations("navigation"),
  ]);

  return (
    <Page
      testId={testId}
      topBar={
        <TopAppBar
          variant="primary"
          title={<Skeleton className="h-7 w-48" />}
          subtitle={t("header.supporting")}
          meta={<TogetherHeaderTab label={tNavigation("together")} active />}
          status={<Skeleton className="h-7 w-20 rounded-full" />}
        />
      }
    >
      <Card tone="elevated" className="gap-(--space-4) p-(--space-4)">
        <div className="flex items-center gap-(--space-3)">
          <div className="flex shrink-0 -space-x-(--space-2)">
            <Skeleton className="size-9 rounded-full ring-2 ring-surface" />
            <Skeleton className="size-9 rounded-full ring-2 ring-surface" />
            <Skeleton className="size-9 rounded-full ring-2 ring-surface" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-4 w-3/4" />
      </Card>

      <section className="flex flex-col gap-(--space-3)">
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex min-h-14 items-center gap-(--space-3) border-b border-divider p-(--space-3) last:border-b-0"
            >
              <Skeleton className="size-9 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <div className="flex flex-col items-end gap-(--space-2)">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </Card>
      </section>

      <section className="flex flex-col gap-(--space-3)">
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex min-h-14 items-center gap-(--space-3) border-b border-divider p-(--space-3) last:border-b-0"
            >
              <Skeleton className="size-8 rounded-(--radius-control)" />
              <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="size-4 rounded-full" />
            </div>
          ))}
        </Card>
      </section>
    </Page>
  );
}
