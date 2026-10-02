import type { ReactNode } from "react";
import {
  CARD_UTILIZATION_DANGER_PCT,
  CARD_UTILIZATION_WARN_PCT,
} from "@/modules/ledger/application/client";
import { creditFacilityStateFromComplete } from "@/modules/ledger/ui/credit-facility-presentation";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { Progress } from "@/shared/ui/progress";
import { Amount, AmountSize, AmountTone } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { InlineAlert } from "@/shared/ui/inline-alert";
import { InlineAlertVariant } from "@/shared/ui/inline-alert-constants";
import { cn } from "@/shared/utils/cn";

export type CreditCardHeroProps = {
  title: string;
  typeLabel: string;
  outstandingLabel: string;
  outstandingCaption: string;
  debtWarning: string;
  outstandingAriaLabel?: string;
  utilizationPct: number | null;
  utilizationLabel: string;
  utilizationAriaLabel?: string;
  availableLabel: string;
  availableCaption: string;
  limitLabel: string;
  limitCaption: string;
  /** False when the domain has no positive credit limit — do not format ₫0. */
  creditFacilityComplete?: boolean;
  context?: ReactNode;
  /** Trailing control on the caption row (privacy toggle). */
  trailing?: ReactNode;
};

function utilizationFillClass(utilizationPct: number | null): string {
  if (utilizationPct == null) return "bg-debt";
  if (utilizationPct >= CARD_UTILIZATION_DANGER_PCT) return "bg-danger";
  if (utilizationPct >= CARD_UTILIZATION_WARN_PCT) return "bg-warning";
  return "bg-debt";
}

function HeroSupportingFact({
  caption,
  value,
  isFinancial,
  alignEnd = false,
}: {
  caption: string;
  value: string;
  isFinancial: boolean;
  alignEnd?: boolean;
}) {
  if (!isFinancial) {
    return (
      <div
        className={cn(
          "flex min-w-0 flex-col gap-(--space-1)",
          alignEnd && "items-end text-right",
        )}
        data-testid="credit-card-supporting-unavailable"
      >
        <Text size="sm" className="text-pretty text-text-secondary">
          {caption}
        </Text>
        <Text
          size="sm"
          weight="medium"
          className="text-pretty text-text-secondary"
        >
          {value}
        </Text>
      </div>
    );
  }

  return (
    <Amount
      label={caption}
      amountLabel={value}
      size={AmountSize.SM}
      className={cn("min-w-0", alignEnd && "items-end text-right")}
      labelClassName="text-text-secondary"
      amountClassName="break-words text-base text-text-primary"
    />
  );
}

/**
 * Liability-first credit-card hero. Outstanding debt is the dominant fact;
 * available credit, limit, utilization, and ownership stay grouped
 * as supporting context without treating debt as spendable cash.
 */
export function CreditCardHero({
  title,
  typeLabel,
  outstandingLabel,
  outstandingCaption,
  debtWarning,
  outstandingAriaLabel,
  utilizationPct,
  utilizationLabel,
  utilizationAriaLabel,
  availableLabel,
  availableCaption,
  limitLabel,
  limitCaption,
  creditFacilityComplete = true,
  context,
  trailing,
}: CreditCardHeroProps) {
  const utilizationValue =
    utilizationPct == null ? null : Math.min(Math.max(utilizationPct, 0), 100);

  return (
    <Card
      tone="elevated"
      className="gap-0 p-(--space-4)"
      data-financial-object="credit-card"
      data-testid="credit-card-hero"
      data-utilization={utilizationPct ?? undefined}
      data-credit-facility={creditFacilityStateFromComplete(
        creditFacilityComplete,
      )}
      aria-label={outstandingAriaLabel ?? outstandingCaption}
    >
      <div className="flex items-center gap-(--space-3)">
        <div className="flex min-w-0 flex-1 items-center gap-(--space-3)">
          <IconContainer tone={IconContainerTone.DEBT} size="md">
            <AppIcon icon={FINANCE_ICONS.card} size={AppIconSize.MD} />
          </IconContainer>
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
            <Text size="sm" weight="semibold" className="truncate">
              {title}
            </Text>
            <Text size="xs" tone="secondary" className="truncate">
              {typeLabel} · {limitCaption}: {limitLabel}
            </Text>
          </div>
        </div>
        {trailing}
      </div>
      {context ? <div className="mt-(--space-3)">{context}</div> : null}
      <div className="mt-(--space-3) flex items-center justify-between gap-(--space-2)">
        <Text size="xs" tone="secondary">
          {outstandingCaption}
        </Text>
        {utilizationValue != null ? (
          <Text
            size="xs"
            weight="medium"
            className="shrink-0 tabular-nums text-debt"
          >
            {utilizationLabel}
          </Text>
        ) : null}
      </div>
      <Amount
        amountLabel={outstandingLabel}
        tone={AmountTone.NEUTRAL}
        size={AmountSize.HERO}
        className="mt-(--space-1)"
        amountClassName="text-debt"
      />
      <InlineAlert
        variant={InlineAlertVariant.ERROR}
        description={debtWarning}
        className="mt-(--space-3)"
      />
      {utilizationValue != null ? (
        <div className="mt-(--space-4) flex items-center gap-(--space-3)">
          <Progress
            value={utilizationValue}
            label={utilizationAriaLabel}
            showLabel={false}
            className="min-w-0 flex-1"
            trackClassName="bg-surface-muted"
            indicatorClassName={utilizationFillClass(utilizationPct)}
          />
        </div>
      ) : (
        <Text
          size="sm"
          weight="medium"
          className="mt-(--space-3) text-pretty text-text-secondary"
        >
          {utilizationLabel}
        </Text>
      )}
      <div className="mt-(--space-3) flex flex-wrap items-center justify-between gap-(--space-3) border-t border-border-subtle pt-(--space-3)">
        <HeroSupportingFact
          caption={availableCaption}
          value={availableLabel}
          isFinancial={creditFacilityComplete}
        />
        <HeroSupportingFact
          caption={limitCaption}
          value={limitLabel}
          isFinancial={creditFacilityComplete}
          alignEnd
        />
      </div>
    </Card>
  );
}
