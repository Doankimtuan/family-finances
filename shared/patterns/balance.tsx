"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "./financial-value";

export const BalanceSize = {
  SM: "sm",
  MD: "md",
  LG: "lg",
  HERO: "hero",
} as const;

export type BalanceSize = (typeof BalanceSize)[keyof typeof BalanceSize];

export const BALANCE_SIZE_VALUES = [
  BalanceSize.SM,
  BalanceSize.MD,
  BalanceSize.LG,
  BalanceSize.HERO,
] as const;

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
          (size === BalanceSize.HERO || size === BalanceSize.LG) && "text-3xl",
          size === BalanceSize.MD && "text-xl",
          size === BalanceSize.SM && "text-lg",
          amountClassName,
        )}
        data-testid="ledger-balance"
      >
        <FinancialValue>{amountLabel}</FinancialValue>
      </p>
    </div>
  );
}
