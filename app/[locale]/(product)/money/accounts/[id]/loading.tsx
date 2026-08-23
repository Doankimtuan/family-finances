import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

function CreditDetailSkeleton() {
  return (
    <>
      <Card tone="elevated" className="gap-0 p-(--space-4)">
        <div className="flex items-center justify-between gap-(--space-3)">
          <div className="flex items-center gap-(--space-3)">
            <Skeleton className="size-11 rounded-(--radius-control)" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="mt-(--space-3) h-9 w-44" />
        <Skeleton className="mt-(--space-4) h-2 w-full rounded-full" />
        <div className="mt-(--space-4) grid grid-cols-2 gap-(--space-3) border-t border-border-subtle pt-(--space-3)">
          <div className="flex flex-col gap-(--space-1)">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex flex-col items-end gap-(--space-1)">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <Skeleton className="mt-(--space-4) h-4 w-24" />
      </Card>
      <Card tone="elevated" className="gap-0 p-(--space-4)">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-(--space-1) h-4 w-16" />
        <div className="mt-(--space-4) flex items-center justify-between border-y border-border-subtle py-(--space-3)">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="mt-(--space-4) h-8 w-40" />
        <Skeleton className="mt-(--space-4) h-2 w-full rounded-full" />
        <div className="mt-(--space-4) grid grid-cols-2 gap-(--space-3) border-t border-border-subtle pt-(--space-3)">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="ml-auto h-5 w-24" />
        </div>
      </Card>
      <Skeleton className="h-12 w-full rounded-full" />
      <section className="flex flex-col gap-(--space-3)">
        <div className="flex items-start justify-between gap-(--space-3)">
          <Skeleton className="h-5 w-28" />
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
 * Loading shell for account detail mirrors the loaded composition. The credit
 * branch includes its hero metrics and current-statement surface so loading
 * does not collapse into the non-credit account layout.
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
        <CreditDetailSkeleton />
      </div>
    </div>
  );
}
