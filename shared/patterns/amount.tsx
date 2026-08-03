import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";

export type AmountProps = {
  /** Already-formatted magnitude (caller formats). */
  amountLabel: string;
  /** Intention / planned / credit / debit label — never unlabeled Balance. */
  label?: ReactNode;
  tone?: "neutral" | "credit" | "debit";
  size?: "md" | "lg";
  className?: string;
};

/**
 * Formatted money magnitude for intention or signed amounts.
 * Do not use for Real Ledger Balance — use `Balance` (BR-01).
 */
export function Amount({
  amountLabel,
  label,
  tone = "neutral",
  size = "md",
  className,
}: AmountProps) {
  return (
    <div className={cn("flex flex-col gap-(--space-1)", className)}>
      {label ? (
        <Text size="sm" tone="secondary">
          {label}
        </Text>
      ) : null}
      <p
        className={cn(
          "font-semibold tabular-nums tracking-tight",
          size === "lg" ? "text-3xl" : "text-xl",
          tone === "credit" && "text-success",
          tone === "debit" && "text-danger",
          tone === "neutral" && "text-text-primary",
        )}
        data-testid="intention-amount"
      >
        {amountLabel}
      </p>
    </div>
  );
}
