import type { ReactNode } from "react";
import { isValidElement } from "react";
import {
  JarBudgetState,
  JarState,
  type JarBudgetState as JarBudgetStateValue,
  type JarState as JarStateValue,
} from "@/modules/plan/application/plan-constants";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Progress } from "@/shared/ui/progress";
import { FinancialValue } from "./financial-value";
import { Card } from "./card";

function financialLeaf(value: ReactNode) {
  return isValidElement(value) ? (
    value
  ) : (
    <FinancialValue>{value}</FinancialValue>
  );
}

function stateTone(state: JarStateValue): StatusBadgeTone {
  return state === JarState.ACTIVE
    ? StatusBadgeTone.POSITIVE
    : StatusBadgeTone.NEUTRAL;
}

function budgetTone(
  state: JarBudgetStateValue | undefined,
): "danger" | "secondary" {
  return state === JarBudgetState.OVERSPENT ? "danger" : "secondary";
}

export type JarCardProps = {
  name: ReactNode;
  kindLabel: ReactNode;
  stateLabel: ReactNode;
  state: JarStateValue;
  planLabel?: ReactNode;
  budgetHeading?: ReactNode;
  spentHeading?: ReactNode;
  budgetLabel?: ReactNode;
  spentLabel?: ReactNode;
  remainingLabel?: ReactNode;
  usageLabel?: ReactNode;
  usagePercent?: number;
  budgetState?: JarBudgetStateValue;
  className?: string;
  "data-testid"?: string;
};

/** Intention Jar summary — actuals are Money-derived, never a bank Balance. */
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
  const tone = budgetTone(budgetState);
  const hasBudgetMetrics =
    budgetHeading != null &&
    spentHeading != null &&
    budgetLabel != null &&
    spentLabel != null &&
    remainingLabel != null &&
    usageLabel !== undefined;

  return (
    <Card
      tone="interactive"
      className={cn("gap-(--space-4) p-(--space-4)", className)}
      data-testid={testId}
      data-jar-state={state}
      data-budget-state={budgetState}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" className="truncate font-semibold text-text-primary">
            {name}
          </Text>
          <Text size="xs" tone="secondary" className="mt-1">
            {kindLabel}
          </Text>
        </div>
        <StatusBadge tone={stateTone(state)}>{stateLabel}</StatusBadge>
      </div>

      {planLabel ? (
        <div className="flex items-center justify-end gap-(--space-3) border-y border-divider py-(--space-2)">
          <Text
            size="sm"
            className="tabular-nums font-semibold text-text-primary"
          >
            {financialLeaf(planLabel)}
          </Text>
        </div>
      ) : null}

      {hasBudgetMetrics ? (
        <div
          className="flex flex-col gap-(--space-3)"
          data-testid="jar-budget-metrics"
        >
          <div className="grid grid-cols-2 gap-(--space-3)">
            <div>
              <Text size="xs" tone="secondary">
                {budgetHeading}
              </Text>
              <Text
                size="sm"
                className="mt-1 tabular-nums font-semibold text-text-primary"
              >
                {financialLeaf(budgetLabel)}
              </Text>
            </div>
            <div className="text-right">
              <Text size="xs" tone="secondary">
                {spentHeading}
              </Text>
              <Text
                size="sm"
                className="mt-1 tabular-nums font-semibold text-text-primary"
              >
                {financialLeaf(spentLabel)}
              </Text>
            </div>
          </div>
          <Progress
            value={Math.max(0, usagePercent ?? 0)}
            max={100}
            label={String(usageLabel)}
            privacyAware
            indicatorClassName={tone === "danger" ? "bg-danger" : undefined}
          />
          <div className="flex items-center justify-between gap-(--space-2)">
            <Text size="xs" tone={tone} className="font-medium">
              {financialLeaf(remainingLabel)}
            </Text>
            <Text size="xs" tone="secondary" className="tabular-nums">
              {usageLabel}
            </Text>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
