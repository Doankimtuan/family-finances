import type { ReactNode } from "react";
import {
  MoneyAssetAllocationKey,
  type MoneyAssetAllocationKey as MoneyAssetAllocationKeyValue,
} from "@/modules/ledger/application";
import { Balance } from "@/shared/patterns/balance";
import { BalanceSize } from "@/shared/patterns/financial-display-size";
import { Card } from "@/shared/patterns/card";
import { HeroPillLink } from "@/shared/patterns/hero-pill-link";
import { FinancialPrivacyToggle } from "@/shared/patterns/financial-privacy-toggle";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { AppIcon } from "@/shared/ui/app-icon";
import { Heading } from "@/shared/ui/heading";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { ACTION_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";

type MoneyPositionAllocationSegment = {
  key: MoneyAssetAllocationKeyValue;
  label: string;
  balanceLabel: string;
  percentage: number;
  percentageLabel: string;
};

type MoneyPrivacyLabels = {
  hideLabel: string;
  showLabel: string;
};

type Props = {
  ownedMoneyLabel: string;
  ownedMoneyValue: string | null;
  positionUnavailableLabel: string;
  metaLine: ReactNode;
  allocationLabel: string;
  allocationHint?: string;
  allocationUnavailableLabel?: string;
  allocation: MoneyPositionAllocationSegment[];
  activityHref: string;
  activityLabel: string;
  privacy?: MoneyPrivacyLabels;
};

const ASSET_ALLOCATION_VISUAL = {
  [MoneyAssetAllocationKey.ACCOUNTS]: {
    icon: FINANCE_ICONS.account,
    tone: IconContainerTone.PRIMARY,
  },
  [MoneyAssetAllocationKey.SAVINGS]: {
    icon: FINANCE_ICONS.savings,
    tone: IconContainerTone.SAVINGS,
  },
  [MoneyAssetAllocationKey.INVESTMENTS]: {
    icon: FINANCE_ICONS.investment,
    tone: IconContainerTone.INVESTMENT,
  },
} as const;

const ALLOCATION_SEGMENT_CLASS: Record<MoneyAssetAllocationKeyValue, string> = {
  [MoneyAssetAllocationKey.ACCOUNTS]: "bg-primary",
  [MoneyAssetAllocationKey.SAVINGS]: "bg-saving",
  [MoneyAssetAllocationKey.INVESTMENTS]: "bg-investment",
};

/**
 * The Money position summary: one brand hero answering "how much accessible
 * money is in active liquid accounts" with the transactions entry, and an
 * attached allocation strip answering "where it sits". Money stays an
 * inventory surface — the allocation strip is the analytics ceiling here,
 * never charts.
 */
export function MoneyPositionHero({
  ownedMoneyLabel,
  ownedMoneyValue,
  positionUnavailableLabel,
  metaLine,
  allocationLabel,
  allocationHint,
  allocationUnavailableLabel,
  allocation,
  activityHref,
  activityLabel,
  privacy,
}: Props) {
  return (
    <div className="flex flex-col gap-(--space-3)">
      <Card
        tone="hero"
        className="gap-0 p-(--space-4)"
        data-testid="money-real-position-summary"
      >
        <div className="flex items-center justify-between gap-(--space-3)">
          <Text size="sm" weight="medium" className="text-hero-muted">
            {ownedMoneyLabel}
          </Text>
          {privacy ? (
            <FinancialPrivacyToggle
              hideLabel={privacy.hideLabel}
              showLabel={privacy.showLabel}
              testId="money-financial-privacy-toggle"
            />
          ) : null}
        </div>
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
          <HeroPillLink href={activityHref} data-testid="money-see-activity">
            {activityLabel}
            <AppIcon icon={ACTION_ICONS.forward} size="xs" />
          </HeroPillLink>
        </div>
      </Card>
      {allocation.length > 0 || allocationUnavailableLabel != null ? (
        <Card
          tone="elevated"
          className="gap-0 p-(--space-4)"
          data-testid="money-asset-allocation-summary"
        >
          <Heading
            level={3}
            className="text-sm font-semibold tracking-tight text-text-primary"
            data-slot="section-title"
          >
            {allocationLabel}
          </Heading>
          {allocationHint ? (
            <Text size="xs" tone="secondary" className="mt-(--space-1)">
              {allocationHint}
            </Text>
          ) : null}
          {allocation.length > 0 ? (
            <>
              <div
                className="mt-(--space-3) flex h-2 w-full overflow-hidden rounded-full bg-surface-muted"
                aria-hidden="true"
                data-testid="money-asset-allocation-strip"
              >
                {allocation.map((segment) => (
                  <span
                    key={segment.key}
                    className={`min-w-1 ${ALLOCATION_SEGMENT_CLASS[segment.key]}`}
                    style={{ width: `${segment.percentage}%` }}
                  />
                ))}
              </div>
              <ul
                className="mt-(--space-4) flex flex-col gap-y-(--space-2)"
                aria-label={allocationLabel}
                data-testid="money-asset-allocation-legend"
              >
                {allocation.map((segment) => {
                  const visual = ASSET_ALLOCATION_VISUAL[segment.key];
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
            </>
          ) : (
            <Text size="sm" tone="secondary" className="mt-(--space-3)">
              {allocationUnavailableLabel}
            </Text>
          )}
        </Card>
      ) : null}
    </div>
  );
}
