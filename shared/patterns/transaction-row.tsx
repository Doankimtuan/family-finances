"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "./financial-value";

export const TransactionAmountTone = {
  CREDIT: "credit",
  DEBIT: "debit",
  NEUTRAL: "neutral",
} as const;

export type TransactionAmountTone =
  (typeof TransactionAmountTone)[keyof typeof TransactionAmountTone];

export type TransactionRowProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  amountLabel: string;
  tone?: TransactionAmountTone;
  leading?: ReactNode;
  className?: string;
};

/**
 * Activity list row for real ledger movement. A leading semantic visual is
 * optional so existing compact list uses remain unchanged.
 */
export function TransactionRow({
  title,
  subtitle,
  amountLabel,
  tone = TransactionAmountTone.NEUTRAL,
  leading,
  className,
}: TransactionRowProps) {
  const amountClass =
    tone === TransactionAmountTone.CREDIT
      ? "text-credit"
      : tone === TransactionAmountTone.DEBIT
        ? "text-debit"
        : "text-text-primary";
  const railClass =
    tone === TransactionAmountTone.CREDIT
      ? "bg-credit"
      : tone === TransactionAmountTone.DEBIT
        ? "bg-debit"
        : "bg-border-strong";

  return (
    <div
      className={cn(
        "group relative flex items-center gap-(--space-3) border-b border-border-subtle/70 bg-transparent px-0 py-(--space-3)",
        "transition-[background-color,border-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
        "hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
    >
      {leading ? (
        leading
      ) : (
        <span
          className={cn(
            "absolute inset-y-(--space-3) left-0 w-1 rounded-r-full",
            railClass,
          )}
          aria-hidden
        />
      )}
      <div className="min-w-0 flex-1">
        <Text size="sm" className="truncate font-medium text-text-primary">
          {title}
        </Text>
        {subtitle ? (
          <Text size="sm" tone="secondary" className="truncate">
            {subtitle}
          </Text>
        ) : null}
      </div>
      <span
        className={cn(
          "max-w-[45%] shrink-0 break-words text-right text-sm font-semibold tabular-nums leading-tight",
          amountClass,
        )}
      >
        <FinancialValue>{amountLabel}</FinancialValue>
      </span>
    </div>
  );
}
