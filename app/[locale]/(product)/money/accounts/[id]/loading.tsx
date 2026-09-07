import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

function AccountDetailSkeleton() {
  return (
    <>
      <Card tone="elevated" className="gap-0 p-(--space-4)">
        <div className="flex items-center justify-between gap-(--space-3)">
          <div className="flex min-w-0 items-center gap-(--space-3)">
            <Skeleton className="size-11 rounded-(--radius-control)" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="size-11 rounded-(--radius-control)" />
        </div>
        <Skeleton className="mt-(--space-3) h-9 w-44" />
        <Skeleton className="mt-(--space-4) h-4 w-36" />
      </Card>
      <Skeleton className="h-12 w-full rounded-(--radius-control)" />
      <section className="flex flex-col gap-(--space-3)">
        <div className="flex items-start justify-between gap-(--space-3)">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex flex-col">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex items-center gap-(--space-3) border-b border-divider py-(--space-3)"
            >
              <Skeleton className="size-8 rounded-(--radius-control)" />
              <div className="flex flex-1 flex-col gap-(--space-1)">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/**
 * Loading shell for account detail mirrors the loaded composition: identity
 * hero, primary capture, and a short activity preview. Credit-card modules
 * hydrate in after the account type is known.
 */
export default function AccountDetailLoading() {
  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="money-account-detail-loading"
    >
      <TopAppBar variant="detail" title={<Skeleton className="h-6 w-32" />} />
      <div
        className="flex flex-1 flex-col gap-(--space-5) px-(--page-gutter) pb-(--space-6) pt-(--space-3)"
        aria-hidden="true"
      >
        <AccountDetailSkeleton />
      </div>
    </div>
  );
}
