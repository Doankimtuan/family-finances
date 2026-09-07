import { FinancialValue } from "@/shared/patterns/financial-value";
import { Text } from "@/shared/ui/text";

type InvestmentActivityRowProps = {
  title: string;
  subtitle: string;
  amountLabel?: string;
  realizedLabel?: string;
  realizedTone?: "success" | "danger";
  slippageLabel?: string;
  snapshot?: string;
};

/**
 * One immutable activity line in the grouped history card. Display-only:
 * callers still own labels, amounts, and which optional lines exist.
 */
export function InvestmentActivityRow({
  title,
  subtitle,
  amountLabel,
  realizedLabel,
  realizedTone,
  slippageLabel,
  snapshot,
}: InvestmentActivityRowProps) {
  return (
    <li
      className="flex items-start justify-between gap-(--space-3) px-(--space-4) py-(--space-3)"
      data-testid="investment-activity-row"
    >
      <div className="min-w-0 flex-1">
        <Text size="sm" weight="semibold" className="text-pretty">
          {title}
        </Text>
        <Text size="xs" tone="secondary" className="mt-(--space-1) text-pretty">
          {subtitle}
        </Text>
        {snapshot ? (
          <Text size="xs" tone="muted" className="mt-(--space-1) text-pretty">
            {snapshot}
          </Text>
        ) : null}
      </div>
      <div className="flex min-w-[var(--financial-number-column-width)] shrink-0 flex-col items-end gap-(--space-1) text-right">
        {amountLabel ? (
          <Text size="sm" weight="semibold" tabular>
            <FinancialValue>{amountLabel}</FinancialValue>
          </Text>
        ) : null}
        {realizedLabel ? (
          <Text size="xs" tabular tone={realizedTone}>
            <FinancialValue>{realizedLabel}</FinancialValue>
          </Text>
        ) : null}
        {slippageLabel ? (
          <Text size="xs" tone="secondary">
            <FinancialValue>{slippageLabel}</FinancialValue>
          </Text>
        ) : null}
      </div>
    </li>
  );
}
