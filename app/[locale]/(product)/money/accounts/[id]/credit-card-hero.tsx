import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { Progress } from "@/shared/ui/progress";
import { Amount, AmountSize, AmountTone } from "@/shared/patterns/amount";

export type CreditCardHeroProps = {
  title: string;
  typeLabel?: string;
  outstandingLabel: string;
  outstandingCaption: string;
  utilizationPct: number | null;
  utilizationLabel: string;
  utilizationAriaLabel?: string;
  availableLabel: string;
  availableCaption: string;
  limitLabel: string;
  limitCaption: string;
  dueLabel?: string;
};

/**
 * Liability-first hero. It intentionally avoids an imitation payment-card look
 * while separating debt, availability, and utilization into a decision order.
 */
export function CreditCardHero({
  title,
  typeLabel,
  outstandingLabel,
  outstandingCaption,
  utilizationPct,
  utilizationLabel,
  utilizationAriaLabel,
  availableLabel,
  availableCaption,
  limitLabel,
  limitCaption,
  dueLabel,
}: CreditCardHeroProps) {
  const utilizationValue =
    utilizationPct == null ? null : Math.min(Math.max(utilizationPct, 0), 100);

  return (
    <section
      className="overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface p-(--space-4)"
      data-financial-object="credit-card"
      data-testid="credit-card-hero"
      data-utilization={utilizationPct ?? undefined}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="flex min-w-0 items-center gap-(--space-3)">
          <IconContainer tone="debt" size="md">
            <AppIcon icon={FINANCE_ICONS.card} size="lg" emphasized />
          </IconContainer>
          <div className="min-w-0">
            <Text
              size="sm"
              weight="medium"
              className="break-words text-text-primary"
            >
              {title}
            </Text>
            {typeLabel ? (
              <Text size="xs" tone="secondary" className="mt-(--space-1)">
                {typeLabel}
              </Text>
            ) : null}
          </div>
        </div>
        <Text size="sm" tone="secondary" className="shrink-0 tabular-nums">
          {utilizationLabel}
        </Text>
      </div>
      <div className="mt-(--space-5)">
        <Amount
          label={outstandingCaption}
          amountLabel={outstandingLabel}
          tone={AmountTone.NEUTRAL}
          size={AmountSize.LG}
        />
      </div>
      {utilizationValue != null ? (
        <Progress
          value={utilizationValue}
          label={utilizationAriaLabel}
          showLabel={false}
          className="mt-(--space-4)"
          trackClassName="bg-surface-muted"
          indicatorClassName="bg-accent"
        />
      ) : null}
      <div className="mt-(--space-4) grid grid-cols-2 gap-(--space-3) border-t border-border-subtle/70 pt-(--space-3)">
        <Amount
          label={availableCaption}
          amountLabel={availableLabel}
          size={AmountSize.SM}
          className="min-w-0"
          amountClassName="break-words text-sm text-text-primary"
        />
        <Amount
          label={limitCaption}
          amountLabel={limitLabel}
          size={AmountSize.SM}
          className="min-w-0 items-end text-right"
          amountClassName="break-words text-sm text-text-primary"
        />
      </div>
      {dueLabel ? (
        <Text size="sm" tone="secondary" className="mt-(--space-3)">
          {dueLabel}
        </Text>
      ) : null}
    </section>
  );
}
