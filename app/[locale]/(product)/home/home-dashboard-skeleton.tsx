import { Skeleton } from "@/shared/ui/skeleton";
import { Card } from "@/shared/patterns/card";

/**
 * Layout-faithful skeleton for the Home data region. Mirrors the loaded
 * composition from the financial pulse through the Inbox and Plan previews.
 * Placeholders mimic layout only — never data.
 */
export function HomeDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-5)" aria-hidden="true">
      <Card tone="hero" className="gap-0 p-(--space-4)">
        <div className="flex items-center justify-between gap-(--space-3)">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="size-11 rounded-full" />
        </div>
        <Skeleton className="mt-(--space-2) h-9 w-52" />
        <div className="mt-(--space-4) border-t border-divider pt-(--space-3)">
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </Card>

      <Card
        tone="elevated"
        className="flex-row items-center gap-(--space-3) p-(--space-3)"
      >
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-6 w-48" />
        </div>
      </Card>

      <Card tone="elevated" className="gap-0 p-(--space-4)">
        <div className="flex items-center justify-between gap-(--space-3)">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="mt-(--space-3) h-3 w-3/4" />
        <div className="mt-(--space-4) grid grid-cols-2 gap-(--space-3)">
          {[0, 1].map((column) => (
            <div key={column} className="flex items-start gap-(--space-2)">
              <Skeleton className="size-8 rounded-(--radius-control)" />
              <div className="flex flex-col gap-(--space-1)">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-7 w-24" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-(--space-4) flex items-center justify-between gap-(--space-3)">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="mt-(--space-2) h-36 w-full rounded-md" />
        <div className="mt-(--space-4) flex flex-col divide-y divide-divider">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="grid grid-cols-[auto_minmax(0,1fr)_var(--financial-number-column-width)] items-center gap-(--space-3) py-(--space-3) first:pt-0"
            >
              <Skeleton className="size-8 rounded-(--radius-control)" />
              <div className="flex flex-col gap-(--space-2)">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-1.5 w-full" />
              </div>
              <div className="flex flex-col items-end gap-(--space-1)">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <section className="flex flex-col gap-(--space-3)">
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Card tone="elevated" className="gap-0 py-(--space-1)">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-2)"
            >
              <Skeleton className="size-8 shrink-0 rounded-(--radius-control)" />
              <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="size-4 shrink-0" />
            </div>
          ))}
        </Card>
      </section>

      <section className="flex flex-col gap-(--space-3)">
        <Skeleton className="h-5 w-20" />
        <Card tone="soft" className="gap-(--space-3) p-(--space-3)">
          <div className="flex items-start gap-(--space-3)">
            <Skeleton className="size-8 rounded-(--radius-control)" />
            <Skeleton className="h-4 w-52" />
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-(--space-3)">
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Card tone="elevated" className="gap-0 p-0">
          <div className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-3)">
            <Skeleton className="size-10 rounded-(--radius-control)" />
            <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-52" />
            </div>
            <Skeleton className="size-4 shrink-0" />
          </div>
        </Card>
      </section>
    </div>
  );
}
