import type { ReactNode } from "react";
import {
  FinancialAmount,
  FinancialAmountSize,
  FinancialAmountTone,
} from "@/shared/ui/financial-amount";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";

export type FinancialMetricProps = {
  label: ReactNode;
  value?: number | null;
  /** Amount value (number in major units or pre-formatted string). */
  amount?: number | string | null;
  amountLabel?: string;
  currency?: string;
  size?: FinancialAmountSize;
  tone?: FinancialAmountTone;
  showSign?: boolean;
  privacyAware?: boolean;
  /** Custom amount node if not using standard numeric value. */
  amountNode?: ReactNode;
  supportingText?: ReactNode;
  badge?: ReactNode;
  className?: string;
  labelClassName?: string;
  amountClassName?: string;
  "data-testid"?: string;
};

/**
 * Reusable summary metric pattern: Label + Primary Amount + Supporting Context/Badge.
 * Used for cards, dashboards, and hub overview totals.
 */
export function FinancialMetric({
  label,
  value,
  amount,
  amountLabel,
  currency = "₫",
  size = FinancialAmountSize.SECTION_TOTAL,
  tone = FinancialAmountTone.NEUTRAL,
  showSign = false,
  privacyAware = true,
  amountNode,
  supportingText,
  badge,
  className,
  labelClassName,
  amountClassName,
  "data-testid": testId,
}: FinancialMetricProps) {
  const resolvedValue = typeof amount === "number" ? amount : value;
  const resolvedAmountLabel = typeof amount === "string" ? amount : amountLabel;

  return (
    <div
      className={cn("flex flex-col gap-(--space-1)", className)}
      data-testid={testId}
    >
      <div className="flex items-center justify-between gap-(--space-2)">
        <Text
          size="sm"
          tone="secondary"
          className={cn("font-medium truncate", labelClassName)}
        >
          {label}
        </Text>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>

      <div className="flex items-baseline gap-(--space-2)">
        {amountNode ? (
          amountNode
        ) : (
          <FinancialAmount
            value={resolvedValue}
            amountLabel={resolvedAmountLabel}
            currency={currency}
            size={size}
            tone={tone}
            showSign={showSign}
            privacyAware={privacyAware}
            className={amountClassName}
          />
        )}
      </div>

      {supportingText ? (
        <Text size="xs" tone="muted" className="leading-normal">
          {supportingText}
        </Text>
      ) : null}
    </div>
  );
}
