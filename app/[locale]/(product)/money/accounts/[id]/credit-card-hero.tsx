import type { ReactNode } from "react";
import {
  CARD_UTILIZATION_DANGER_PCT,
  CARD_UTILIZATION_WARN_PCT,
} from "@/modules/ledger/application/client";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { Progress } from "@/shared/ui/progress";
import { Amount, AmountSize, AmountTone } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";

export type CreditCardHeroProps = {
  /** Kept for standalone/privacy rendering; account identity lives in TopAppBar. */
  title?: string;
  /** Kept for standalone/privacy rendering; account type lives in TopAppBar. */
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
  context?: ReactNode;
  /** Trailing control on the caption row (privacy toggle). */
  trailing?: ReactNode;
};

function utilizationFillClass(utilizationPct: number | null): string {
  if (utilizationPct == null) return "bg-hero-fg";
  if (utilizationPct >= CARD_UTILIZATION_DANGER_PCT) return "bg-danger";
  if (utilizationPct >= CARD_UTILIZATION_WARN_PCT) return "bg-warning";
  return "bg-hero-fg";
}

/**
 * Liability-first credit-card hero. Outstanding debt is the dominant fact;
 * available credit, limit, utilization, due date, and ownership stay grouped
 * as supporting context without treating debt as spendable cash.
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
  context,
  trailing,
}: CreditCardHeroProps) {
  const utilizationValue =
    utilizationPct == null ? null : Math.min(Math.max(utilizationPct, 0), 100);

  return (
    <Card
      tone="hero"
      className="gap-0 p-(--space-4)"
      data-financial-object="credit-card"
      data-testid="credit-card-hero"
      data-utilization={utilizationPct ?? undefined}
      aria-label={title}
    >
      {/* Account identity remains in TopAppBar; these preserve the standalone component contract. */}
      {title ? <span className="sr-only break-words">{title}</span> : null}
      {typeLabel ? <span className="sr-only">{typeLabel}</span> : null}
      <div className="flex items-center gap-(--space-3)">
        <div className="flex min-w-0 flex-1 items-center gap-(--space-3)">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-(--radius-control) border border-white/25 bg-white/10 text-hero-fg">
            <AppIcon
              icon={FINANCE_ICONS.card}
              size={AppIconSize.MD}
              emphasized
            />
          </span>
          <Text
            size="sm"
            weight="medium"
            className="text-pretty text-hero-muted"
          >
            {outstandingCaption}
          </Text>
        </div>
        {trailing}
      </div>
      <Amount
        amountLabel={outstandingLabel}
        tone={AmountTone.NEUTRAL}
        size={AmountSize.HERO}
        className="mt-(--space-3)"
        amountClassName="text-4xl leading-none text-hero-fg"
      />
      {utilizationValue != null ? (
        <div className="mt-(--space-4) flex items-center gap-(--space-3)">
          <Progress
            value={utilizationValue}
            label={utilizationAriaLabel}
            showLabel={false}
            className="min-w-0 flex-1"
            trackClassName="bg-white/15 ring-white/15"
            indicatorClassName={utilizationFillClass(utilizationPct)}
          />
          <Text
            size="sm"
            weight="semibold"
            className="shrink-0 tabular-nums text-hero-fg"
          >
            {utilizationLabel}
          </Text>
        </div>
      ) : (
        <Text
          size="sm"
          weight="medium"
          className="mt-(--space-3) text-pretty text-hero-muted"
        >
          {utilizationLabel}
        </Text>
      )}
      <div className="mt-(--space-4) grid grid-cols-2 gap-(--space-3) border-t border-white/15 pt-(--space-3)">
        <Amount
          label={availableCaption}
          amountLabel={availableLabel}
          size={AmountSize.SM}
          className="min-w-0"
          labelClassName="text-hero-muted"
          amountClassName="break-words text-base text-hero-fg"
        />
        <Amount
          label={limitCaption}
          amountLabel={limitLabel}
          size={AmountSize.SM}
          className="min-w-0 items-end text-right"
          labelClassName="text-hero-muted"
          amountClassName="break-words text-base text-hero-fg"
        />
      </div>
      {dueLabel || context ? (
        <div className="mt-(--space-4) flex flex-col gap-(--space-2) border-t border-white/15 pt-(--space-3)">
          {dueLabel ? (
            <Text size="sm" weight="medium" className="text-hero-fg">
              {dueLabel}
            </Text>
          ) : null}
          {context}
        </div>
      ) : null}
    </Card>
  );
}
