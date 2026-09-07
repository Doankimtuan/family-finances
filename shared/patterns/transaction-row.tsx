"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "./financial-value";

export const TransactionAmountTone = {
  CREDIT: "credit",
  DEBIT: "debit",
  REFUND: "refund",
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
  showRail?: boolean;
  showChevron?: boolean;
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
  showRail = true,
  showChevron = false,
  className,
}: TransactionRowProps) {
  const amountClass =
    tone === TransactionAmountTone.CREDIT
      ? "text-credit"
      : tone === TransactionAmountTone.DEBIT
        ? "text-debit"
        : tone === TransactionAmountTone.REFUND
          ? "text-refund"
          : "text-text-primary";
  const railClass =
    tone === TransactionAmountTone.CREDIT
      ? "bg-credit"
      : tone === TransactionAmountTone.DEBIT
        ? "bg-debit"
        : tone === TransactionAmountTone.REFUND
          ? "bg-refund"
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
      ) : showRail ? (
        <span
          className={cn(
            "absolute inset-y-(--space-3) left-0 w-1 rounded-r-full",
            railClass,
          )}
          aria-hidden
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <Text size="sm" className="break-words font-medium text-text-primary">
          {title}
        </Text>
        {subtitle ? (
          <Text size="sm" tone="secondary" className="break-words">
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
      {showChevron ? (
        <AppIcon
          icon={ACTION_ICONS.forward}
          size="sm"
          className="shrink-0 text-text-tertiary"
        />
      ) : null}
    </div>
  );
}
