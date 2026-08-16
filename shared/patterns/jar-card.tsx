import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Progress } from "@/shared/ui/progress";
export type JarCardProps = {
  name: ReactNode;
  kindLabel: ReactNode;
  stateLabel: ReactNode;
  state: "active" | "paused" | "archived";
  planLabel?: ReactNode;
  budgetHeading?: ReactNode;
  spentHeading?: ReactNode;
  budgetLabel?: ReactNode;
  spentLabel?: ReactNode;
  remainingLabel?: ReactNode;
  usageLabel?: ReactNode;
  usagePercent?: number;
  budgetState?:
    "healthy" | "near_limit" | "overspent" | "no_spending" | "no_budget";
  className?: string;
  "data-testid"?: string;
};
/** Intention jar summary — actuals are Money-derived, never a bank Balance. */
export function JarCard({
  name,
  kindLabel,
  stateLabel,
  state,
  planLabel,
  budgetHeading,
  spentHeading,
  budgetLabel,
  spentLabel,
  remainingLabel,
  usageLabel,
  usagePercent,
  budgetState,
  className,
  "data-testid": testId,
}: JarCardProps) {
  const budgetTone = budgetState === "overspent" ? "danger" : "secondary";
  return (
    <div
      className={cn(
        "flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle/60 bg-surface/90 p-(--space-4) transition-[background-color,border-color,transform] duration-(--duration-fast) hover:border-border-default hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
      data-testid={testId}
      data-jar-state={state}
      data-budget-state={budgetState}
    >
      <div className="flex items-center justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" className="truncate font-medium text-text-primary">
            {name}
          </Text>
          <Text size="sm" tone="secondary">
            {kindLabel}
          </Text>
        </div>
        <StatusBadge tone={state === "active" ? "positive" : "neutral"}>
          {stateLabel}
        </StatusBadge>
      </div>
      {planLabel ? (
        <Text size="sm" tone="secondary" className="tabular-nums">
          {planLabel}
        </Text>
      ) : null}
      {budgetHeading &&
      spentHeading &&
      budgetLabel &&
      spentLabel &&
      remainingLabel &&
      usageLabel !== undefined ? (
        <div
          className="flex flex-col gap-(--space-2)"
          data-testid="jar-budget-metrics"
        >
          <div className="grid grid-cols-2 gap-(--space-2) text-xs">
            <div>
              <Text size="xs" tone="secondary">
                {budgetHeading}
              </Text>
              <Text size="sm" className="tabular-nums font-medium">
                {budgetLabel}
              </Text>
            </div>
            <div>
              <Text size="xs" tone="secondary">
                {spentHeading}
              </Text>
              <Text size="sm" className="tabular-nums font-medium">
                {spentLabel}
              </Text>
            </div>
          </div>
          <Progress
            value={Math.max(0, usagePercent ?? 0)}
            max={100}
            label={String(usageLabel)}
            indicatorClassName={
              budgetTone === "danger" ? "bg-danger" : undefined
            }
          />
          <div className="flex items-center justify-between gap-(--space-2)">
            <Text size="xs" tone={budgetTone}>
              {remainingLabel}
            </Text>
            <Text size="xs" tone="secondary" className="tabular-nums">
              {usageLabel}
            </Text>
          </div>
        </div>
      ) : null}
    </div>
  );
}
