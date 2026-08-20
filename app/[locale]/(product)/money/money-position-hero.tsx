import { Link } from "@/i18n/navigation";
import { MoneyAccountGroupKey } from "@/modules/ledger/application";
import { Amount, AmountSize, AmountTone } from "@/shared/patterns/amount";
import { Balance, BalanceSize } from "@/shared/patterns/balance";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Section } from "@/shared/patterns/section";
import { AppIcon } from "@/shared/ui/app-icon";
import { Heading } from "@/shared/ui/heading";
import { IconContainer } from "@/shared/ui/icon-container";
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
  ownedMoneyValue: string;
  accountCountLabel: string;
  creditOutstandingLabel?: string;
  creditOutstandingValue?: string;
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
 * The Money overview reports active owned money first. Composition stays a
 * quiet supporting section so Money remains an inventory surface, not a
 * second Home analytics dashboard.
 */
export function MoneyPositionHero({
  ownedMoneyLabel,
  ownedMoneyValue,
  accountCountLabel,
  creditOutstandingLabel,
  creditOutstandingValue,
  compositionLabel,
  composition,
  activityHref,
  activityLabel,
}: Props) {
  return (
    <>
      <Section variant="emphasized" testId="money-real-position-summary">
        <div className="flex flex-col gap-(--space-3)">
          <Balance
            label={ownedMoneyLabel}
            amountLabel={ownedMoneyValue}
            size={BalanceSize.LG}
          />
          <div className="flex flex-wrap items-center gap-x-(--space-3) gap-y-(--space-1) text-sm">
            <Text size="sm" tone="secondary">
              {accountCountLabel}
            </Text>
            {creditOutstandingLabel && creditOutstandingValue ? (
              <div className="border-l border-border-subtle pl-(--space-3)">
                <Amount
                  label={creditOutstandingLabel}
                  amountLabel={creditOutstandingValue}
                  tone={AmountTone.DEBIT}
                  size={AmountSize.SM}
                  labelClassName="text-xs"
                  amountClassName="text-sm"
                />
              </div>
            ) : null}
          </div>
          <Link
            href={activityHref}
            className="w-fit text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            data-testid="money-see-activity"
          >
            {activityLabel}
          </Link>
        </div>
      </Section>
      {composition.length > 0 ? (
        <Section
          title={
            <Heading
              level={2}
              className="text-sm font-semibold tracking-tight text-text-secondary mt-3"
              data-slot="section-title"
            >
              {compositionLabel}
            </Heading>
          }
          contentClassName="gap-(--space-2)"
          testId="money-composition-summary"
        >
          <div
            className="flex h-2 w-full overflow-hidden rounded-full bg-surface-muted"
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
          <ul className="grid gap-(--space-2)" aria-label={compositionLabel}>
            {composition.map((segment) => {
              const visual = moneyAccountVisualFor(
                ACCOUNT_TYPE_FOR_GROUP[segment.key],
              );
              return (
                <li
                  key={segment.key}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-(--space-3) gap-y-(--space-1)"
                >
                  <div className="flex min-w-0 items-center gap-(--space-2)">
                    <IconContainer tone={visual.tone} size="sm">
                      <AppIcon icon={visual.icon} size="xs" />
                    </IconContainer>
                    <span className="truncate text-sm font-medium text-text-primary">
                      {segment.label}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-text-secondary">
                      {segment.percentageLabel}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-text-primary">
                    <FinancialValue>{segment.balanceLabel}</FinancialValue>
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
