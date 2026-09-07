"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "./financial-value";
import {
  BalanceSize,
  FINANCIAL_DISPLAY_SIZE_CLASS,
} from "./financial-display-size";

export { BalanceSize, BALANCE_SIZE_VALUES } from "./financial-display-size";

export type BalanceProps = {
  /** Formatted ledger amount (caller formats with formatCurrency). */
  amountLabel: string;
  label?: ReactNode;
  size?: BalanceSize;
  className?: string;
  labelClassName?: string;
  amountClassName?: string;
};

/**
 * Real Ledger Balance only (BR-01 / DS-04). Never use for jar/intention amounts.
 */
export function Balance({
  amountLabel,
  label,
  size = BalanceSize.MD,
  className,
  labelClassName,
  amountClassName,
}: BalanceProps) {
  return (
    <div className={cn("flex flex-col gap-(--space-1)", className)}>
      {label ? (
        <Text size="sm" tone="secondary" className={labelClassName}>
          {label}
        </Text>
      ) : null}
      <p
        className={cn(
          "font-semibold tabular-nums tracking-tight text-text-primary",
          FINANCIAL_DISPLAY_SIZE_CLASS[size],
          amountClassName,
        )}
        data-testid="ledger-balance"
      >
        <FinancialValue>{amountLabel}</FinancialValue>
      </p>
    </div>
  );
}
