import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "./financial-value";

export const AmountTone = {
  NEUTRAL: "neutral",
  CREDIT: "credit",
  DEBIT: "debit",
  REFUND: "refund",
  INCOME: "income",
  EXPENSE: "expense",
  SAVING: "saving",
  MUTED: "muted",
} as const;

export type AmountTone = (typeof AmountTone)[keyof typeof AmountTone];

export const AMOUNT_TONE_VALUES = [
  AmountTone.NEUTRAL,
  AmountTone.CREDIT,
  AmountTone.DEBIT,
  AmountTone.REFUND,
  AmountTone.INCOME,
  AmountTone.EXPENSE,
  AmountTone.SAVING,
  AmountTone.MUTED,
] as const;

export const AmountSize = {
  SM: "sm",
  MD: "md",
  LG: "lg",
  HERO: "hero",
} as const;

export type AmountSize = (typeof AmountSize)[keyof typeof AmountSize];

export const AMOUNT_SIZE_VALUES = [
  AmountSize.SM,
  AmountSize.MD,
  AmountSize.LG,
  AmountSize.HERO,
] as const;

export type AmountProps = {
  /** Already-formatted magnitude (caller formats). */
  amountLabel: string;
  /** Intention / planned / credit / debit label — never unlabeled Balance. */
  label?: ReactNode;
  tone?: AmountTone;
  size?: AmountSize;
  className?: string;
  labelClassName?: string;
  amountClassName?: string;
};

/**
 * Formatted money magnitude for intention or signed amounts.
 * Do not use for Real Ledger Balance — use `Balance` (BR-01).
 */
export function Amount({
  amountLabel,
  label,
  tone = AmountTone.NEUTRAL,
  size = AmountSize.MD,
  className,
  labelClassName,
  amountClassName,
}: AmountProps) {
  return (
    <div className={cn("flex flex-col gap-(--space-1)", className)}>
      {label ? (
        <Text size="sm" tone="secondary" className={labelClassName}>
          {label}
        </Text>
      ) : null}
      <p
        className={cn(
          "font-semibold tabular-nums tracking-tight",
          (size === AmountSize.HERO || size === AmountSize.LG) && "text-3xl",
          size === AmountSize.MD && "text-xl",
          size === AmountSize.SM && "text-lg",
          (tone === AmountTone.CREDIT || tone === AmountTone.INCOME) &&
            "text-success",
          tone === AmountTone.DEBIT && "text-danger",
          tone === AmountTone.REFUND && "text-refund",
          tone === AmountTone.SAVING && "text-saving",
          tone === AmountTone.MUTED && "text-text-secondary",
          (tone === AmountTone.NEUTRAL || tone === AmountTone.EXPENSE) &&
            "text-text-primary",
          amountClassName,
        )}
        data-testid="intention-amount"
      >
        <FinancialValue>{amountLabel}</FinancialValue>
      </p>
    </div>
  );
}
