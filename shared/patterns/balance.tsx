"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";

export type BalanceProps = {
  /** Formatted ledger amount (caller formats with formatCurrency). */
  amountLabel: string;
  label?: ReactNode;
  size?: "md" | "lg";
  className?: string;
};

/**
 * Real Ledger Balance only (BR-01 / DS-04). Never use for jar/intention amounts.
 */
export function Balance({
  amountLabel,
  label,
  size = "md",
  className,
}: BalanceProps) {
  return (
    <div className={cn("flex flex-col gap-(--space-1)", className)}>
      {label ? (
        <Text size="sm" tone="secondary">
          {label}
        </Text>
      ) : null}
      <p
        className={cn(
          "font-semibold tabular-nums tracking-tight text-text-primary",
          size === "lg" ? "text-3xl" : "text-xl",
        )}
        data-testid="ledger-balance"
      >
        {amountLabel}
      </p>
    </div>
  );
}
