"use client";

import { useState, type ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import type {
  MoneyAccountGroupKey,
  MoneyCreditAttention as MoneyCreditAttentionValue,
} from "@/modules/ledger/application";
import {
  CARD_UTILIZATION_DANGER_PCT,
  CARD_UTILIZATION_WARN_PCT,
} from "@/modules/ledger/application/client";
import { moneyAccountPath } from "@/modules/tenancy/application/app-path";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Balance } from "@/shared/patterns/balance";
import { Amount, AmountSize, AmountTone } from "@/shared/patterns/amount";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { BalanceSize } from "@/shared/patterns/financial-display-size";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import {
  IconContainer,
  IconContainerTone,
  type IconContainerTone as IconContainerToneValue,
} from "@/shared/ui/icon-container";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Progress } from "@/shared/ui/progress";
import type { FinancialScope } from "@/modules/shared-kernel/application/financial-scope";
import type { OwnerStatus } from "@/modules/shared-kernel/application/financial-ownership";

export type MoneyHubAccountRow = {
  id: string;
  title: string;
  typeLabel: string;
  balanceCaption: string;
  balanceLabel: string;
  icon: IconSvgElement;
  iconTone: IconContainerToneValue;
  financialScope: FinancialScope;
  isOwnedByMe: boolean;
  ownerStatus: OwnerStatus;
};

export type MoneyHubAccountGroup = {
  key: MoneyAccountGroupKey;
  accounts: MoneyHubAccountRow[];
};

export type MoneyHubCardRow = {
  id: string;
  title: string;
  outstandingLabel: string;
  availableLabel: string;
  limitLabel: string;
  utilizationPct: number | null;
  utilizationLabel: string;
  utilizationAriaLabel: string;
  dueLabel?: string;
  attention?: MoneyCreditAttentionValue | null;
};

export type MoneyAccountsScanLabels = {
  sectionTitle: string;
  sectionDescription?: string;
  groupTitles: Record<MoneyAccountGroupKey, string>;
  creditCardsTitle: string;
  creditCardType: string;
  creditCardsHint: string;
  accountsUnavailable?: string;
  creditCardsUnavailable?: string;
  outstanding: string;
  availableCredit: string;
  creditLimit: string;
  emptyTitle: string;
  emptyDescription: string;
  showAll: string;
  showLess: string;
  attentionLabels: Record<MoneyCreditAttentionValue, string>;
};

type Props = {
  labels: MoneyAccountsScanLabels;
  accountGroups: MoneyHubAccountGroup[];
  initialAccountGroups: MoneyHubAccountGroup[];
  accountPresentation: "flat" | "grouped";
  hasMoreAccounts: boolean;
  creditCards: MoneyHubCardRow[];
  accountsUnavailable?: boolean;
  creditCardsUnavailable?: boolean;
  createAction: ReactNode;
  emptyAction?: ReactNode;
};

const INVENTORY_ROW_CLASS =
  "flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-2) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring";

function utilizationBarClass(utilizationPct: number | null) {
  if (utilizationPct == null) return "bg-accent";
  if (utilizationPct >= CARD_UTILIZATION_DANGER_PCT) return "bg-danger";
  if (utilizationPct >= CARD_UTILIZATION_WARN_PCT) return "bg-warning";
  return "bg-accent";
}

const CREDIT_ATTENTION_TONE: Record<
  MoneyCreditAttentionValue,
  typeof StatusBadgeTone.WARNING | typeof StatusBadgeTone.ATTENTION
> = {
  overdue: StatusBadgeTone.ATTENTION,
  due_soon: StatusBadgeTone.WARNING,
  high_utilization: StatusBadgeTone.WARNING,
};

function accountTypeVisible(title: string, typeLabel: string) {
  return title.trim().toLowerCase() !== typeLabel.trim().toLowerCase();
}

function AccountInventoryRow({ account }: { account: MoneyHubAccountRow }) {
  const showType = accountTypeVisible(account.title, account.typeLabel);

  return (
    <Link
      href={moneyAccountPath(account.id)}
      prefetch={PRODUCT_LINK_PREFETCH}
      className={INVENTORY_ROW_CLASS}
      data-testid="money-hub-account-row"
    >
      <div
        className="flex min-w-0 flex-1 items-center gap-(--space-3)"
        data-testid="account-card"
        data-financial-object="account"
      >
        <IconContainer tone={account.iconTone} size="sm">
          <AppIcon icon={account.icon} size="sm" />
        </IconContainer>
        <div className="min-w-0 flex-1">
          <Text size="sm" className="break-words font-medium text-text-primary">
            {account.title}
          </Text>
          <div className="mt-(--space-1) flex flex-wrap items-center gap-x-(--space-2) gap-y-(--space-1)">
            {showType ? (
              <Text size="xs" tone="secondary" className="break-words">
                {account.typeLabel}
              </Text>
            ) : null}
            <FinancialOwnershipBadge
              financialScope={account.financialScope}
              isOwnedByMe={account.isOwnedByMe}
              ownerStatus={account.ownerStatus}
              compact
            />
          </div>
        </div>
        <div data-testid="account-card-balance">
          <Balance
            amountLabel={account.balanceLabel}
            size={BalanceSize.SM}
            className="min-w-0 items-end text-right"
            amountClassName="text-sm"
          />
        </div>
      </div>
    </Link>
  );
}

function CreditLiabilityRow({
  card,
  labels,
}: {
  card: MoneyHubCardRow;
  labels: MoneyAccountsScanLabels;
}) {
  const progressValue =
    card.utilizationPct == null
      ? null
      : Math.min(Math.max(card.utilizationPct, 0), 100);
  const attentionLabel = card.attention
    ? labels.attentionLabels[card.attention]
    : undefined;

  return (
    <Link
      href={moneyAccountPath(card.id)}
      prefetch={PRODUCT_LINK_PREFETCH}
      className="flex min-h-14 flex-col gap-(--space-2) px-(--space-4) py-(--space-3) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
      data-testid="money-hub-credit-card-row"
    >
      <div
        className="flex min-w-0 items-start gap-(--space-3)"
        data-testid="credit-card-card"
        data-financial-object="credit-card"
        data-utilization={card.utilizationPct ?? undefined}
      >
        <IconContainer tone={IconContainerTone.DEBT} size="sm">
          <AppIcon icon={FINANCE_ICONS.card} size="sm" />
        </IconContainer>
        <div className="min-w-0 flex-1">
          <Text size="sm" className="break-words font-medium text-text-primary">
            {card.title}
          </Text>
          <Text size="xs" tone="secondary">
            {labels.creditCardType}
          </Text>
        </div>
        <Amount
          label={labels.outstanding}
          amountLabel={card.outstandingLabel}
          tone={AmountTone.NEUTRAL}
          kind={FinancialNumberKind.CURRENT_STATE}
          size={AmountSize.SM}
          className="min-w-0 shrink-0 items-end text-right"
          labelClassName="text-xs"
          amountClassName="text-sm"
        />
      </div>
      {progressValue != null ? (
        <Progress
          value={progressValue}
          label={card.utilizationAriaLabel}
          showLabel={false}
          trackClassName="bg-border-subtle"
          indicatorClassName={utilizationBarClass(card.utilizationPct)}
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-x-(--space-2) gap-y-(--space-1)">
        <Text size="xs" tone="secondary" className="tabular-nums">
          {card.utilizationLabel}
        </Text>
        {card.dueLabel ? (
          <Text size="xs" tone="secondary">
            {card.dueLabel}
          </Text>
        ) : null}
        {attentionLabel && card.attention ? (
          <StatusBadge tone={CREDIT_ATTENTION_TONE[card.attention]}>
            {attentionLabel}
          </StatusBadge>
        ) : null}
      </div>
    </Link>
  );
}

function AccountGroupRows({
  group,
  showGroupTitle,
  title,
}: {
  group: MoneyHubAccountGroup;
  showGroupTitle: boolean;
  title: string;
}) {
  return (
    <div className="flex flex-col">
      {showGroupTitle ? (
        <Text
          size="xs"
          className="px-(--space-4) pt-(--space-3) font-medium tracking-wide text-text-secondary"
          data-testid="money-account-group-title"
        >
          {title}
        </Text>
      ) : null}
      <ul className="flex flex-col divide-y divide-border-subtle/65">
        {group.accounts.map((account) => (
          <li key={account.id}>
            <AccountInventoryRow account={account} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Money account scan. Accessible accounts stay in one inventory list;
 * credit liabilities stay in a separate grouped list so they cannot be
 * scanned as spendable cash.
 */
export function MoneyAccountsScan({
  labels,
  accountGroups,
  initialAccountGroups,
  accountPresentation,
  hasMoreAccounts,
  creditCards,
  accountsUnavailable = false,
  creditCardsUnavailable = false,
  createAction,
  emptyAction,
}: Props) {
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const visibleGroups = showAllAccounts ? accountGroups : initialAccountGroups;
  const hasAnyAccount = accountGroups.length > 0;
  const hasAnyContent =
    hasAnyAccount ||
    creditCards.length > 0 ||
    accountsUnavailable ||
    creditCardsUnavailable;

  return (
    <section
      className="flex flex-col gap-(--space-4)"
      data-testid="money-accounts-scan"
    >
      <SectionHeader
        title={labels.sectionTitle}
        description={labels.sectionDescription}
        action={hasAnyContent ? createAction : undefined}
      />
      {accountsUnavailable && labels.accountsUnavailable ? (
        <StatusAlert
          variant="info"
          title={labels.accountsUnavailable}
          data-testid="money-accounts-unavailable"
        />
      ) : null}
      {!hasAnyContent ? (
        <Card
          tone="soft"
          className="gap-(--space-3) p-(--space-4)"
          data-testid="money-accounts-empty"
        >
          <EmptyState
            icon={
              <AppIcon
                icon={FINANCE_ICONS.account}
                size={AppIconSize.DISPLAY}
              />
            }
            title={labels.emptyTitle}
            description={labels.emptyDescription}
            action={emptyAction}
            className="flex-none py-(--space-2)"
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-(--space-5)">
          {hasAnyAccount ? (
            <div className="flex flex-col gap-(--space-3)">
              <Card
                tone="elevated"
                className="gap-0 p-0"
                data-testid="money-account-object-collection"
              >
                <div className="flex flex-col py-(--space-1)">
                  {visibleGroups.map((group) => (
                    <AccountGroupRows
                      key={group.key}
                      group={group}
                      showGroupTitle={accountPresentation === "grouped"}
                      title={labels.groupTitles[group.key]}
                    />
                  ))}
                </div>
              </Card>
              {hasMoreAccounts ? (
                <button
                  type="button"
                  className="inline-flex min-h-11 w-fit items-center rounded-[var(--radius-control)] px-(--space-2) text-sm font-medium text-accent hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  aria-expanded={showAllAccounts}
                  onClick={() => setShowAllAccounts((value) => !value)}
                  data-testid="money-accounts-show-all"
                >
                  {showAllAccounts ? labels.showLess : labels.showAll}
                </button>
              ) : null}
            </div>
          ) : null}
          {creditCards.length > 0 ? (
            <div className="flex flex-col gap-(--space-3)">
              <div className="flex flex-col gap-(--space-1)">
                <Heading
                  level={3}
                  className="text-sm font-semibold tracking-tight text-text-primary"
                >
                  {labels.creditCardsTitle}
                </Heading>
                <Text size="sm" tone="secondary">
                  {labels.creditCardsHint}
                </Text>
              </div>
              <Card tone="elevated" className="gap-0 p-0">
                <ul className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
                  {creditCards.map((card) => (
                    <li key={card.id}>
                      <CreditLiabilityRow card={card} labels={labels} />
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ) : null}
          {creditCardsUnavailable && labels.creditCardsUnavailable ? (
            <StatusAlert
              variant="info"
              title={labels.creditCardsUnavailable}
              data-testid="money-credit-cards-unavailable"
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
