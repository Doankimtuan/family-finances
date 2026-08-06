"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";

export type TransactionRowProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  amountLabel: string;
  tone?: "credit" | "debit" | "neutral";
  className?: string;
};

/**
 * Activity list row — ledger amounts only (BR-01).
 */
export function TransactionRow({
  title,
  subtitle,
  amountLabel,
  tone = "neutral",
  className,
}: TransactionRowProps) {
  const amountClass =
    tone === "credit"
      ? "text-credit"
      : tone === "debit"
        ? "text-debit"
        : "text-text-primary";
  const railClass =
    tone === "credit"
      ? "bg-credit"
      : tone === "debit"
        ? "bg-debit"
        : "bg-border-strong";

  return (
    <div
      className={cn(
        "group relative flex items-center gap-(--space-3) overflow-hidden rounded-xl border border-border-subtle bg-surface px-(--space-4) py-(--space-3)",
        "transition-[background-color,border-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
        "hover:border-border-strong hover:bg-surface-hover active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-y-(--space-3) left-0 w-1 rounded-r-full",
          railClass,
        )}
        aria-hidden
      />
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
        {amountLabel}
      </span>
    </div>
  );
}
