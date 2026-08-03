"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { Progress } from "@/shared/ui/progress";

export type GoalCardProps = {
  name: ReactNode;
  fundedLabel: ReactNode;
  targetLabel: ReactNode;
  progressPercent: number;
  statusLabel?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/**
 * Goal progress card — funded/target are intention, never bank Balance (BR-01).
 */
export function GoalCard({
  name,
  fundedLabel,
  targetLabel,
  progressPercent,
  statusLabel,
  className,
  "data-testid": testId,
}: GoalCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)",
        className,
      )}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <Text
          size="sm"
          className="min-w-0 truncate font-medium text-text-primary"
        >
          {name}
        </Text>
        {statusLabel ? (
          <span className="shrink-0 rounded-md border border-border-subtle px-(--space-2) py-(--space-1) text-xs font-medium text-text-secondary">
            {statusLabel}
          </span>
        ) : null}
      </div>
      <Progress
        value={progressPercent}
        max={100}
        label={`${progressPercent}%`}
      />
      <div className="flex items-center justify-between gap-(--space-3)">
        <Text size="sm" tone="secondary" className="tabular-nums">
          {fundedLabel}
        </Text>
        <Text size="sm" tone="secondary" className="tabular-nums">
          {targetLabel}
        </Text>
      </div>
    </div>
  );
}
