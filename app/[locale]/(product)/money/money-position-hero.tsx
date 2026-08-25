import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { MoneyAccountGroupKey } from "@/modules/ledger/application";
import { Balance, BalanceSize } from "@/shared/patterns/balance";
import { Card } from "@/shared/patterns/card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { AppIcon } from "@/shared/ui/app-icon";
import { Heading } from "@/shared/ui/heading";
import { IconContainer } from "@/shared/ui/icon-container";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { moneyAccountVisualFor } from "./money-account-visuals";

type MoneyPositionCompositionSegment = {
  key: MoneyAccountGroupKey;
  label: string;
  balanceLabel: string;
  percentage: number;
  percentageLabel: string;
};

type Props = {
  ownedMoneyLabel: string;
  ownedMoneyValue: string | null;
  positionUnavailableLabel: string;
  metaLine: ReactNode;
  compositionLabel: string;
  composition: MoneyPositionCompositionSegment[];
  activityHref: string;
  activityLabel: string;
};

const ACCOUNT_TYPE_FOR_GROUP: Record<
  MoneyAccountGroupKey,
  Parameters<typeof moneyAccountVisualFor>[0]
> = {
  [MoneyAccountGroupKey.CASH]: "cash",
  [MoneyAccountGroupKey.BANK]: "checking",
  [MoneyAccountGroupKey.WALLET]: "ewallet",
  [MoneyAccountGroupKey.SAVINGS]: "savings",
  [MoneyAccountGroupKey.INVESTMENT]: "brokerage",
  [MoneyAccountGroupKey.OTHER]: "other",
};

const ALLOCATION_SEGMENT_CLASS: Record<MoneyAccountGroupKey, string> = {
  [MoneyAccountGroupKey.CASH]: "bg-income",
  [MoneyAccountGroupKey.BANK]: "bg-primary",
  [MoneyAccountGroupKey.WALLET]: "bg-info",
  [MoneyAccountGroupKey.SAVINGS]: "bg-saving",
  [MoneyAccountGroupKey.INVESTMENT]: "bg-investment",
  [MoneyAccountGroupKey.OTHER]: "bg-border-strong",
};

/**
 * The Money position summary: one brand hero answering "how much is in my
 * active accounts" with the transactions entry, and an attached composition
 * strip answering "where it sits". Money stays an inventory surface — the
 * composition strip is the analytics ceiling here, never charts.
 */
export function MoneyPositionHero({
  ownedMoneyLabel,
  ownedMoneyValue,
  positionUnavailableLabel,
  metaLine,
  compositionLabel,
  composition,
  activityHref,
  activityLabel,
}: Props) {
  return (
    <div className="flex flex-col gap-(--space-3)">
      <Card
        tone="hero"
        className="gap-0 p-(--space-4)"
        data-testid="money-real-position-summary"
      >
        <Text size="sm" weight="medium" className="text-hero-muted">
          {ownedMoneyLabel}
        </Text>
        {ownedMoneyValue == null ? (
          <Text
            size="lg"
            weight="semibold"
            className="mt-(--space-2) text-hero-fg"
            data-testid="money-position-unavailable"
          >
            {positionUnavailableLabel}
          </Text>
        ) : (
          <Balance
            amountLabel={ownedMoneyValue}
            size={BalanceSize.HERO}
            className="mt-(--space-2)"
            amountClassName="text-hero-fg"
          />
        )}
        <div className="mt-(--space-4) flex flex-wrap items-center justify-between gap-x-(--space-3) gap-y-(--space-2) border-t border-white/15 pt-(--space-3)">
          {metaLine}
          <Link
            href={activityHref}
            className="inline-flex min-h-6 items-center gap-(--space-1) text-sm font-medium text-hero-fg underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-fg"
            data-testid="money-see-activity"
          >
            {activityLabel}
            <AppIcon icon={ACTION_ICONS.forward} size="xs" />
          </Link>
        </div>
      </Card>
      {composition.length > 0 ? (
        <Card
          tone="elevated"
          className="gap-0 p-(--space-4)"
          data-testid="money-composition-summary"
        >
          <Heading
            level={3}
            className="text-sm font-semibold tracking-tight text-text-primary"
            data-slot="section-title"
          >
            {compositionLabel}
          </Heading>
          <div
            className="mt-(--space-3) flex h-2 w-full overflow-hidden rounded-full bg-surface-muted"
            aria-hidden="true"
            data-testid="money-composition-strip"
          >
            {composition.map((segment) => (
              <span
                key={segment.key}
                className={`min-w-1 ${ALLOCATION_SEGMENT_CLASS[segment.key]}`}
                style={{ width: `${segment.percentage}%` }}
              />
            ))}
          </div>
          <ul
            className="mt-(--space-4) flex flex-col gap-y-(--space-2)"
            aria-label={compositionLabel}
            data-testid="money-composition-legend"
          >
            {composition.map((segment) => {
              const visual = moneyAccountVisualFor(
                ACCOUNT_TYPE_FOR_GROUP[segment.key],
              );
              return (
                <li
                  key={segment.key}
                  className="flex min-w-0 items-center justify-between gap-(--space-3)"
                >
                  <div className="flex min-w-0 items-center gap-(--space-2)">
                    <IconContainer tone={visual.tone} size="sm">
                      <AppIcon icon={visual.icon} size="xs" />
                    </IconContainer>
                    <div className="min-w-0">
                      <span className="block text-sm font-medium text-text-primary">
                        {segment.label}
                      </span>
                      <span className="block text-xs tabular-nums text-text-secondary">
                        {segment.percentageLabel}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums tracking-tight text-text-primary">
                    <FinancialValue>{segment.balanceLabel}</FinancialValue>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
