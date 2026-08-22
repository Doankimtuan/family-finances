import { Skeleton } from "@/shared/ui/skeleton";

/**
 * Layout-faithful skeleton for the Home data region. Mirrors the loaded
 * composition (hero → net strip → cash-flow story card) so loading resolves
 * without visible recomposition. Placeholders mimic layout only — never data.
 */
export function HomeDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-5)" aria-hidden="true">
      <div className="rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-1)">
        <div className="flex items-center justify-between gap-(--space-3)">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="size-11 rounded-full" />
        </div>
        <Skeleton className="mt-(--space-2) h-9 w-52" />
        <div className="mt-(--space-4) border-t border-divider pt-(--space-3)">
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </div>

      <div className="flex items-center gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-3) shadow-(--elevation-1)">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>

      <div className="rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-1)">
        <div className="flex items-center justify-between gap-(--space-3)">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="mt-(--space-3) h-3 w-3/4" />
        <div className="mt-(--space-4) grid grid-cols-2 gap-x-(--space-4)">
          {[0, 1].map((column) => (
            <div
              key={column}
              className="flex flex-col gap-(--space-1) border-t-2 border-divider pt-(--space-2)"
            >
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-28" />
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
      </div>
    </div>
  );
}
