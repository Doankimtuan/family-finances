"use client";

import type { ReactNode } from "react";
import {
  FinancialAmount,
  FinancialAmountSize,
  FinancialAmountTone,
} from "@/shared/ui/financial-amount";
import { Progress } from "@/shared/ui/progress";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { cn } from "@/shared/utils/cn";

export type ProgressSummaryProps = {
  label: ReactNode;
  currentAmount: number | string;
  targetAmount: number | string;
  currency?: string;
  /** Percentage completion, can be > 100%. If omitted, calculated from numeric amounts. */
  percent?: number;
  /** Explicit overage label or badge when >100%. */
  overageNotice?: ReactNode;
  /** Custom progress bar tone. */
  tone?: "primary" | "income" | "debt" | "warning";
  className?: string;
  "data-testid"?: string;
};

/**
 * Reusable ProgressSummary composite for Plan Jars, Savings Goals, and Debt Amortization.
 * Enforces visual bar clamping at 100% with explicit text indicators for overages.
 */
export function ProgressSummary({
  label,
  currentAmount,
  targetAmount,
  currency = "₫",
  percent,
  overageNotice,
  tone = "primary",
  className,
  "data-testid": testId,
}: ProgressSummaryProps) {
  const numCurrent =
    typeof currentAmount === "number" ? currentAmount : undefined;
  const labelCurrent =
    typeof currentAmount === "string" ? currentAmount : undefined;

  const numTarget = typeof targetAmount === "number" ? targetAmount : undefined;
  const labelTarget =
    typeof targetAmount === "string" ? targetAmount : undefined;

  const resolvedPercent =
    percent !== undefined
      ? percent
      : numCurrent !== undefined && numTarget !== undefined && numTarget > 0
        ? Math.round((numCurrent / numTarget) * 100)
        : 0;

  const isOver = resolvedPercent > 100;

  const progressTone = isOver
    ? IconContainerTone.DEBT
    : tone === "income"
      ? IconContainerTone.INCOME
      : tone === "debt"
        ? IconContainerTone.DEBT
        : IconContainerTone.PRIMARY;

  return (
    <div
      className={cn("flex flex-col gap-2 w-full", className)}
      data-testid={testId}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-text-primary truncate">
          {label}
        </span>
        <span
          className={cn(
            "text-xs font-semibold tabular-nums",
            isOver ? "text-debt" : "text-text-secondary",
          )}
        >
          {Math.round(resolvedPercent)}%
        </span>
      </div>

      <Progress
        value={resolvedPercent}
        max={100}
        tone={progressTone}
        showLabel={false}
        className="w-full"
      />

      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-baseline gap-1 text-text-muted">
          <FinancialAmount
            value={numCurrent}
            amountLabel={labelCurrent}
            currency={currency}
            size={FinancialAmountSize.MICRO_AMOUNT}
            tone={FinancialAmountTone.NEUTRAL}
            privacyAware
          />
          <span>/</span>
          <FinancialAmount
            value={numTarget}
            amountLabel={labelTarget}
            currency={currency}
            size={FinancialAmountSize.MICRO_AMOUNT}
            tone={FinancialAmountTone.MUTED}
            privacyAware
          />
        </div>

        {isOver ? (
          <div className="text-[11px] font-semibold text-debt truncate">
            {overageNotice ?? "Vượt mục tiêu"}
          </div>
        ) : null}
      </div>
    </div>
  );
}
