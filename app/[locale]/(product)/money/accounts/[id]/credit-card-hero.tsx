import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { Progress } from "@/shared/ui/progress";

export type CreditCardHeroProps = {
  title: string;
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
      className="overflow-hidden rounded-[var(--radius-card)] border border-border-subtle/70 bg-debt-soft/40 p-(--space-4) shadow-[var(--elevation-1)]"
      data-testid="credit-card-hero"
      data-utilization={utilizationPct ?? undefined}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="flex min-w-0 items-center gap-(--space-3)">
          <IconContainer tone="debt" size="md">
            <AppIcon icon={FINANCE_ICONS.card} size="lg" emphasized />
          </IconContainer>
          <Text
            size="sm"
            weight="medium"
            className="truncate text-text-primary"
          >
            {title}
          </Text>
        </div>
        <Text size="sm" tone="secondary" className="shrink-0 tabular-nums">
          {utilizationLabel}
        </Text>
      </div>
      <div className="mt-(--space-5)">
        <p className="text-3xl font-semibold tracking-tight tabular-nums text-text-primary">
          {outstandingLabel}
        </p>
        <Text size="sm" tone="secondary" className="mt-(--space-1)">
          {outstandingCaption}
        </Text>
      </div>
      {utilizationValue != null ? (
        <Progress
          value={utilizationValue}
          label={utilizationAriaLabel}
          showLabel={false}
          className="mt-(--space-4)"
          trackClassName="bg-surface-muted"
          indicatorClassName="bg-debt"
        />
      ) : null}
      <div className="mt-(--space-4) grid grid-cols-2 gap-(--space-3) border-t border-border-subtle/70 pt-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" tone="secondary">
            {availableCaption}
          </Text>
          <Text
            size="sm"
            weight="medium"
            className="truncate tabular-nums text-text-primary"
          >
            {availableLabel}
          </Text>
        </div>
        <div className="min-w-0 text-right">
          <Text size="sm" tone="secondary">
            {limitCaption}
          </Text>
          <Text
            size="sm"
            weight="medium"
            className="truncate tabular-nums text-text-primary"
          >
            {limitLabel}
          </Text>
        </div>
      </div>
      {dueLabel ? (
        <Text size="sm" tone="secondary" className="mt-(--space-3)">
          {dueLabel}
        </Text>
      ) : null}
    </section>
  );
}
