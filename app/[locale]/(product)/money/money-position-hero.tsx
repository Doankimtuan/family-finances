import type { ReactNode } from "react";
import {
  MoneyAssetAllocationKey,
  type MoneyAssetAllocationKey as MoneyAssetAllocationKeyValue,
} from "@/modules/ledger/application";
import { Balance } from "@/shared/patterns/balance";
import { BalanceSize } from "@/shared/patterns/financial-display-size";
import { Card } from "@/shared/patterns/card";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialPrivacyToggle } from "@/shared/patterns/financial-privacy-toggle";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";

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
  ownedMoneyKind: FinancialNumberKind;
  ownedMoneyHint?: string;
  positionUnavailableLabel: string;
  heroAccessibleLabel?: string;
  metaLine: ReactNode;
  allocationLabel: string;
  allocationHint?: string;
  allocationUnavailableLabel?: string;
  allocation: MoneyPositionAllocationSegment[];
  activityHref: string;
  activityLabel: string;
  privacy?: MoneyPrivacyLabels;
};

const ALLOCATION_SEGMENT_CLASS: Record<MoneyAssetAllocationKeyValue, string> = {
  [MoneyAssetAllocationKey.ACCOUNTS]: "bg-primary",
  [MoneyAssetAllocationKey.SAVINGS]: "bg-success",
  [MoneyAssetAllocationKey.INVESTMENTS]: "bg-investment",
};

/** Consolidated asset snapshot with the existing allocation and privacy rules. */
export function MoneyPositionHero({
  ownedMoneyLabel,
  ownedMoneyValue,
  ownedMoneyKind,
  ownedMoneyHint,
  positionUnavailableLabel,
  heroAccessibleLabel,
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
    <Card
      tone="elevated"
      className="gap-0 overflow-hidden rounded-2xl border border-border-subtle bg-linear-to-br from-surface via-surface to-primary-soft/20 p-(--space-5)"
      data-testid="money-real-position-summary"
    >
      <div>
        <div className="mb-(--space-2) flex items-center justify-between gap-(--space-3) text-text-muted">
          <div className="flex min-w-0 items-center gap-(--space-2)">
            <span
              className="size-(--space-2) shrink-0 rounded-full bg-income"
              aria-hidden="true"
            />
            <Text
              size="xs"
              weight="semibold"
              className="tracking-wider uppercase text-text-muted"
            >
              {ownedMoneyLabel}
            </Text>
          </div>
          {privacy ? (
            <FinancialPrivacyToggle
              hideLabel={privacy.hideLabel}
              showLabel={privacy.showLabel}
              testId="money-financial-privacy-toggle"
            />
          ) : null}
        </div>

        <div
          className="my-(--space-1) min-w-0"
          role="group"
          aria-label={heroAccessibleLabel ?? ownedMoneyLabel}
        >
          {ownedMoneyValue == null ? (
            <Text
              size="lg"
              weight="semibold"
              className="text-text-primary"
              data-testid="money-position-unavailable"
            >
              {positionUnavailableLabel}
            </Text>
          ) : (
            <Balance
              amountLabel={ownedMoneyValue}
              size={BalanceSize.HERO}
              kind={ownedMoneyKind}
              amountClassName="text-text-primary"
            />
          )}
          {ownedMoneyHint ? (
            <Text
              size="xs"
              className="mt-(--space-1) text-pretty text-text-muted leading-relaxed"
            >
              {ownedMoneyHint}
            </Text>
          ) : null}
        </div>

        {allocation.length > 0 ? (
          <div
            data-testid="money-asset-allocation-summary"
            className="mt-(--space-4)"
          >
            <div
              className="flex h-(--space-2) w-full overflow-hidden rounded-full bg-surface-muted"
              aria-hidden="true"
              data-testid="money-asset-allocation-strip"
            >
              {allocation.map((segment) => (
                <span
                  key={segment.key}
                  className={ALLOCATION_SEGMENT_CLASS[segment.key] + " min-w-1"}
                  style={{ width: segment.percentage + "%" }}
                />
              ))}
            </div>

            <div
              className="mt-(--space-3) flex flex-wrap items-center gap-(--space-2)"
              aria-label={allocationLabel}
              data-testid="money-asset-allocation-legend"
            >
              {allocation.map((segment) => (
                <div
                  key={segment.key}
                  className="inline-flex items-center gap-(--space-2) rounded-full border border-border-subtle bg-surface-muted/60 px-(--space-3) py-(--space-1) text-xs text-text-secondary"
                >
                  <span
                    className={
                      ALLOCATION_SEGMENT_CLASS[segment.key] +
                      " size-(--space-2) rounded-full"
                    }
                  />
                  <span className="font-medium text-text-primary">
                    {segment.label}
                  </span>
                  <span>:</span>
                  <strong
                    className="font-medium text-text-primary tabular-nums"
                    data-financial-kind={
                      segment.key === MoneyAssetAllocationKey.INVESTMENTS
                        ? FinancialNumberKind.ESTIMATE
                        : FinancialNumberKind.CURRENT_STATE
                    }
                  >
                    <FinancialValue>{segment.balanceLabel}</FinancialValue>
                  </strong>
                  <span>({segment.percentageLabel})</span>
                </div>
              ))}
            </div>
            {allocationHint ? (
              <Text size="xs" tone="secondary" className="mt-(--space-2)">
                {allocationHint}
              </Text>
            ) : null}
          </div>
        ) : allocationUnavailableLabel != null ? (
          <div
            data-testid="money-asset-allocation-summary"
            className="mt-(--space-3)"
          >
            <Text size="xs" tone="secondary">
              {allocationUnavailableLabel}
            </Text>
          </div>
        ) : null}

        <div className="mt-(--space-4) flex flex-wrap items-center justify-between gap-x-(--space-3) gap-y-(--space-2) border-t border-border-subtle/80 pt-(--space-3)">
          {metaLine ? (
            <div className="text-xs text-text-secondary">{metaLine}</div>
          ) : null}
          <Link
            href={activityHref}
            prefetch={PRODUCT_LINK_PREFETCH}
            data-testid="money-see-activity"
            className="group inline-flex min-h-11 min-w-11 items-center gap-(--space-2) text-xs font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {activityLabel}
            <AppIcon
              icon={ACTION_ICONS.forward}
              size="xs"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </Card>
  );
}
