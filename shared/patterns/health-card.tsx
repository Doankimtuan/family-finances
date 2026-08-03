"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";

export type HealthCardProps = {
  title: ReactNode;
  score: number;
  levelLabel: ReactNode;
  narrative?: ReactNode;
  className?: string;
  "data-testid"?: string;
  onPress?: () => void;
};

/**
 * Financial Health score teaser (Design System HealthCard / AC-015).
 * Presentational — score computation lives in modules/health.
 */
export function HealthCard({
  title,
  score,
  levelLabel,
  narrative,
  className,
  "data-testid": testId,
  onPress,
}: HealthCardProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const interactive = typeof onPress === "function";

  const body = (
    <>
      <div className="flex items-center justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" tone="secondary">
            {title}
          </Text>
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-text-primary">
            {clamped}
            <span className="text-base font-medium text-text-secondary">
              /100
            </span>
          </p>
        </div>
        <span
          className="shrink-0 rounded-md border border-border-subtle bg-canvas px-(--space-2) py-(--space-1) text-xs font-medium text-text-secondary"
          data-testid="health-card-level"
        >
          {levelLabel}
        </span>
      </div>
      {narrative ? (
        <Text size="sm" tone="secondary" className="leading-relaxed">
          {narrative}
        </Text>
      ) : null}
    </>
  );

  const shellClass = cn(
    "flex w-full min-h-11 flex-col gap-(--space-2) rounded-lg border border-border-subtle bg-surface p-(--space-4) text-left",
    interactive &&
      "transition-transform duration-150 ease-out active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
    className,
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onPress}
        className={shellClass}
        data-testid={testId ?? "health-card"}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={shellClass} data-testid={testId ?? "health-card"}>
      {body}
    </div>
  );
}
