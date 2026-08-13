import { Link } from "@/i18n/navigation";
import { MoneyAccountGroupKey } from "@/modules/ledger/application";
import { Balance } from "@/shared/patterns/balance";
import { Section } from "@/shared/patterns/section";
import { AppIcon } from "@/shared/ui/app-icon";
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

/**
 * The Money hero reports owned money first, then provides a compact, readable
 * map of the account containers that hold it. Credit debt stays a secondary
 * liability signal and never inflates the owned-money total.
 */
export function MoneyPositionHero({
  ownedMoneyLabel,
  ownedMoneyValue,
  accountCountLabel,
  creditOutstandingLabel,
  compositionLabel,
  composition,
  activityHref,
  activityLabel,
}: Props) {
  return (
    <Section variant="emphasized" testId="money-real-position-summary">
      <div className="flex flex-col gap-(--space-3)">
        <Balance
          label={ownedMoneyLabel}
          amountLabel={ownedMoneyValue}
          size="lg"
        />
        <div className="flex flex-wrap items-center gap-x-(--space-3) gap-y-(--space-1) text-sm">
          <Text size="sm" tone="secondary">
            {accountCountLabel}
          </Text>
          {creditOutstandingLabel ? (
            <Text
              size="sm"
              className="border-l border-border-subtle pl-(--space-3) text-text-secondary"
            >
              {creditOutstandingLabel}
            </Text>
          ) : null}
        </div>
        {composition.length > 0 ? (
          <div className="flex flex-col gap-(--space-2)">
            <Text size="sm" className="font-medium text-text-primary">
              {compositionLabel}
            </Text>
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
                      {segment.balanceLabel}
                    </span>
                    <div
                      aria-hidden
                      className="col-span-2 h-1 overflow-hidden rounded-full bg-surface/75"
                    >
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${segment.percentage}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        <Link
          href={activityHref}
          className="w-fit text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="money-see-activity"
        >
          {activityLabel}
        </Link>
      </div>
    </Section>
  );
}
