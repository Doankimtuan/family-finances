import { Page } from "@/shared/patterns/page";
import { BrandMark } from "@/shared/patterns/brand-mark";
import { Skeleton } from "@/shared/ui/skeleton";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { HomeDashboardSkeleton } from "./home-dashboard-skeleton";

/**
 * Home loading skeleton — mirrors the loaded page composition (compact
 * header, financial hero, net strip, cash-flow story, Inbox, Plan) so the
 * loading → loaded transition does not recompose the layout.
 */
export default function HomeLoading() {
  return (
    <Page
      testId={HOME_TEST_ID.LOADING}
      topBar={
        <header className="flex shrink-0 items-center justify-between gap-(--space-3) px-(--page-gutter) pb-(--space-1) pt-(--space-4)">
          <Skeleton className="h-5 w-36" />
          <BrandMark variant="mark" size="sm" />
        </header>
      }
      contentClassName="gap-(--space-5)"
    >
      <HomeDashboardSkeleton />
      <section className="border-t border-divider pt-(--space-4)">
        <Skeleton className="h-4 w-16" />
        <div className="mt-(--space-3) flex items-center gap-(--space-3)">
          <Skeleton className="size-8 rounded-(--radius-control)" />
          <Skeleton className="h-4 w-52" />
        </div>
      </section>
      <section className="flex flex-col gap-(--space-3)">
        <Skeleton className="h-4 w-20" />
        <div className="flex items-center gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-3) shadow-(--elevation-1)">
          <Skeleton className="size-10 rounded-(--radius-control)" />
          <div className="flex flex-col gap-(--space-1)">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
      </section>
    </Page>
  );
}
