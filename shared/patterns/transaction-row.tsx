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

  return (
    <div
      className={cn(
        "flex items-center gap-(--space-3) rounded-lg border border-border-subtle bg-surface px-(--space-4) py-(--space-3)",
        className,
      )}
    >
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
          "shrink-0 text-sm font-semibold tabular-nums",
          amountClass,
        )}
      >
        {amountLabel}
      </span>
    </div>
  );
}
