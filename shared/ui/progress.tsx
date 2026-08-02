"use client";

import { cn } from "@/shared/utils/cn";

export type ProgressProps = {
  value: number;
  max?: number;
  label?: string;
  className?: string;
};

/**
 * Design System Progress — deterministic step progress for onboard.
 * Native bar (HeroUI v3 has no Progress export in this project).
 */
export function Progress({
  value,
  max = 100,
  label,
  className,
}: ProgressProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = Math.round((clamped / safeMax) * 100);

  return (
    <div className={cn("flex w-full flex-col gap-(--space-2)", className)}>
      {label ? (
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      ) : null}
      <div
        role="progressbar"
        aria-label={label ?? "Progress"}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
        className="h-2 w-full overflow-hidden rounded-full bg-border-subtle"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
