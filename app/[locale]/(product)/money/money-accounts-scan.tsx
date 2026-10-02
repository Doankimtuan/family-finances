"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import type {
  MoneyAccountGroupKey,
  MoneyCreditAttention as MoneyCreditAttentionValue,
} from "@/modules/ledger/application";
import type { FinancialCapabilities } from "@/modules/shared-kernel/application/financial-ownership";
import {
  CARD_UTILIZATION_DANGER_PCT,
  CARD_UTILIZATION_WARN_PCT,
} from "@/modules/ledger/application/client";
import { MoneyAccountGroupKey as AccountGroupKey } from "@/modules/ledger/application/money-hub-view-model";
import {
  APP_PATH,
  moneyAccountPath,
} from "@/modules/tenancy/application/app-path";
import { AccountRow } from "@/shared/patterns/account-row";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { Balance } from "@/shared/patterns/balance";
import { BalanceSize } from "@/shared/patterns/financial-display-size";
import { SectionHeader } from "@/shared/patterns/section-header";
import {
  BaseRowMinHeight,
  type BaseRowDivider,
} from "@/shared/patterns/base-row";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";
import { StatusAlert } from "@/shared/ui/status-alert";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { InlineAlert, InlineAlertVariant } from "@/shared/ui/inline-alert";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";
import {
  IconContainer,
  IconContainerTone,
  type IconContainerTone as IconContainerToneValue,
} from "@/shared/ui/icon-container";
import { Link } from "@/i18n/navigation";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { Amount, AmountSize, AmountTone } from "@/shared/patterns/amount";
import { Progress } from "@/shared/ui/progress";

export type MoneyHubAccountRow = {
  id: string;
  title: string;
  balanceLabel: string;
  icon: IconSvgElement;
  iconTone: IconContainerToneValue;
  typeLabel?: string;
  ownership?: Pick<
    FinancialCapabilities,
    "financialScope" | "isOwnedByMe" | "ownerStatus"
  >;
};

export type MoneyHubAccountGroup = {
  key: MoneyAccountGroupKey;
  accounts: MoneyHubAccountRow[];
  totalBalanceLabel?: string;
};

export type MoneyHubCardRow = {
  id: string;
  title: string;
  outstandingLabel: string;
  availableLabel?: string;
  limitLabel?: string;
  utilizationPct?: number | null;
  utilizationLabel: string;
  utilizationAriaLabel?: string;
  dueLabel?: string;
  attention?: MoneyCreditAttentionValue | null;
};

export type MoneyAccountsScanLabels = {
  sectionTitle: string;
  sectionDescription: string;
  ownedBalanceLabel?: string;
  ownedBalanceValue?: string | null;
  ownedBalanceUnavailable?: string;
  ownershipHint?: string;
  totalBalanceLabel?: string;
  viewAccounts?: string;
  creditCardType: string;
  availableCredit?: string;
  creditLimit?: string;
  creditCardsTitle?: string;
  creditCardsHint?: string;
  creditCardsEmpty?: string;
  addCreditCard?: string;
  accountGroupLabels?: Partial<Record<MoneyAccountGroupKey, string>>;
  cashWalletGroupTitle?: string;
  outstanding: string;
  accountsUnavailable: string;
  creditCardsUnavailable: string;
  emptyTitle: string;
  emptyDescription: string;
  showAllAccounts?: string;
  showFewerAccounts?: string;
  attentionLabels: Record<MoneyCreditAttentionValue, string>;
};

type Props = {
  labels: MoneyAccountsScanLabels;
  /** Collapsed account preview supplied by the Money view model. */
  accounts: MoneyHubAccountGroup[];
  /** Full active inventory shown when the user expands the list. */
  allAccounts?: MoneyHubAccountGroup[];
  initiallyExpanded?: boolean;
  creditCards: MoneyHubCardRow[];
  accountsUnavailable?: boolean;
  creditCardsUnavailable?: boolean;
  emptyAction?: ReactNode;
  /** Explicit null hides the overview total link on the dedicated directory. */
  sectionAction?: ReactNode;
  showManagementToggle?: boolean;
  showGroupSections?: boolean;
};

const CREDIT_ATTENTION_TONE: Record<
  MoneyCreditAttentionValue,
  typeof StatusBadgeTone.WARNING | typeof StatusBadgeTone.ATTENTION
> = {
  overdue: StatusBadgeTone.ATTENTION,
  due_soon: StatusBadgeTone.WARNING,
  high_utilization: StatusBadgeTone.WARNING,
};
const INITIAL_CREDIT_CARD_PREVIEW_COUNT = 1;

function utilizationBarClass(utilizationPct: number | null) {
  if (utilizationPct == null) return "bg-accent";
  if (utilizationPct >= CARD_UTILIZATION_DANGER_PCT) return "bg-danger";
  if (utilizationPct >= CARD_UTILIZATION_WARN_PCT) return "bg-warning";
  return "bg-accent";
}

function AccountInventoryRow({
  account,
  divider = "none",
}: {
  account: MoneyHubAccountRow;
  divider?: BaseRowDivider;
}) {
  const hasMetadata = Boolean(account.typeLabel && account.ownership);

  return (
    <AccountRow
      name={account.title}
      logo={
        <IconContainer tone={account.iconTone} size={hasMetadata ? "sm" : "xs"}>
          <AppIcon
            icon={account.icon}
            size={hasMetadata ? AppIconSize.SM : AppIconSize.XS}
          />
        </IconContainer>
      }
      subtitle={
        hasMetadata && account.ownership ? (
          <span className="inline-flex min-w-0 flex-wrap items-center gap-x-(--space-2) gap-y-(--space-1)">
            <span>{account.typeLabel}</span>
            <FinancialOwnershipBadge {...account.ownership} compact />
          </span>
        ) : undefined
      }
      subtitleClassName="overflow-visible whitespace-normal"
      balance={account.balanceLabel}
      balanceKind={FinancialNumberKind.CURRENT_STATE}
      currency=""
      minHeight={
        hasMetadata ? BaseRowMinHeight.INSTRUMENT : BaseRowMinHeight.COMPACT
      }
      href={moneyAccountPath(account.id)}
      divider={divider}
      secondaryAction={
        <AppIcon
          icon={ACTION_ICONS.forward}
          size="xs"
          className="text-text-muted"
        />
      }
      className="transition-colors hover:bg-surface-hover"
      data-testid="money-hub-account-row"
    />
  );
}

function CreditLiabilityRow({
  card,
  labels,
  divider = "none",
}: {
  card: MoneyHubCardRow;
  labels: MoneyAccountsScanLabels;
  divider?: BaseRowDivider;
}) {
  const attentionLabel = card.attention
    ? labels.attentionLabels[card.attention]
    : undefined;
  const supportLabel = attentionLabel ?? card.dueLabel ?? card.utilizationLabel;
  const progressValue =
    card.utilizationPct == null
      ? null
      : Math.min(Math.max(card.utilizationPct, 0), 100);

  if (card.availableLabel != null && card.limitLabel != null) {
    return (
      <Link
        href={moneyAccountPath(card.id)}
        className="flex min-h-14 flex-col gap-(--space-2) px-(--space-4) py-(--space-3) transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        data-testid="money-hub-credit-card-row"
        aria-label={`${card.title}, ${labels.creditCardType}, ${labels.outstanding}: ${card.outstandingLabel}`}
      >
        <div className="flex min-w-0 items-start gap-(--space-3)">
          <IconContainer tone={IconContainerTone.DEBT} size="sm">
            <AppIcon icon={FINANCE_ICONS.card} size={AppIconSize.SM} />
          </IconContainer>
          <div className="min-w-0 flex-1">
            <Text
              size="sm"
              className="break-words font-medium text-text-primary"
            >
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
            label={card.utilizationAriaLabel ?? card.utilizationLabel}
            showLabel={false}
            trackClassName="bg-border-subtle"
            indicatorClassName={utilizationBarClass(
              card.utilizationPct ?? null,
            )}
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
        <div className="grid grid-cols-2 gap-(--space-3) border-t border-border-subtle/65 pt-(--space-2)">
          {labels.availableCredit ? (
            <Amount
              label={labels.availableCredit}
              amountLabel={card.availableLabel}
              tone={AmountTone.NEUTRAL}
              kind={FinancialNumberKind.CURRENT_STATE}
              size={AmountSize.SM}
              className="min-w-0 items-start"
              labelClassName="text-xs"
              amountClassName="text-xs"
            />
          ) : null}
          {labels.creditLimit ? (
            <Amount
              label={labels.creditLimit}
              amountLabel={card.limitLabel}
              tone={AmountTone.MUTED}
              kind={FinancialNumberKind.CURRENT_STATE}
              size={AmountSize.SM}
              className="min-w-0 items-start"
              labelClassName="text-xs"
              amountClassName="text-xs"
            />
          ) : null}
        </div>
      </Link>
    );
  }

  return (
    <AccountRow
      accountKind="credit"
      name={card.title}
      subtitle={
        <span className="inline-flex min-w-0 flex-wrap items-center gap-(--space-1)">
          <span className="shrink-0">{labels.creditCardType}</span>
          {attentionLabel && card.attention ? (
            <StatusBadge
              tone={CREDIT_ATTENTION_TONE[card.attention]}
              className="h-auto min-h-6 max-w-full whitespace-normal rounded-(--radius-control) px-(--space-2) py-1 leading-tight"
            >
              {attentionLabel}
            </StatusBadge>
          ) : supportLabel ? (
            <Text size="xs" tone="secondary" className="truncate">
              {supportLabel}
            </Text>
          ) : null}
        </span>
      }
      subtitleClassName="overflow-visible whitespace-normal"
      logo={
        <IconContainer tone={IconContainerTone.DEBT} size="xs">
          <AppIcon icon={FINANCE_ICONS.card} size={AppIconSize.XS} />
        </IconContainer>
      }
      balance={card.outstandingLabel}
      balanceKind={FinancialNumberKind.CURRENT_STATE}
      currency=""
      minHeight={BaseRowMinHeight.COMPACT}
      href={moneyAccountPath(card.id)}
      divider={divider}
      secondaryAction={
        <AppIcon
          icon={ACTION_ICONS.forward}
          size="xs"
          className="text-text-muted"
        />
      }
      className="transition-colors hover:bg-surface-hover"
      data-testid="money-hub-credit-card-row"
      aria-label={`${card.title}, ${labels.creditCardType}, ${labels.outstanding}: ${card.outstandingLabel}`}
    />
  );
}

/**
 * One compact account inventory card keeps cash accounts and credit
 * liabilities scannable together while retaining their distinct amount tones.
 */
export function MoneyAccountsScan({
  labels,
  accounts: accountGroups,
  allAccounts = accountGroups,
  initiallyExpanded = false,
  creditCards,
  accountsUnavailable = false,
  creditCardsUnavailable = false,
  emptyAction,
  sectionAction,
  showManagementToggle = true,
  showGroupSections = false,
}: Props) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const accountRows = (expanded ? allAccounts : accountGroups).flatMap(
    (group) => group.accounts,
  );
  const initialAccountCount = accountGroups.reduce(
    (count, group) => count + group.accounts.length,
    0,
  );
  const allAccountCount = allAccounts.reduce(
    (count, group) => count + group.accounts.length,
    0,
  );
  const visibleCreditCards = expanded
    ? creditCards
    : creditCards.slice(0, INITIAL_CREDIT_CARD_PREVIEW_COUNT);
  const hasMoreAccounts =
    allAccountCount > initialAccountCount ||
    creditCards.length > INITIAL_CREDIT_CARD_PREVIEW_COUNT;
  const hasAnyContent =
    accountRows.length > 0 ||
    visibleCreditCards.length > 0 ||
    accountsUnavailable ||
    creditCardsUnavailable ||
    showGroupSections;
  let headerAction = sectionAction;
  if (
    headerAction === undefined &&
    labels.totalBalanceLabel &&
    labels.viewAccounts
  ) {
    headerAction = (
      <Link
        href={APP_PATH.MONEY_ACCOUNTS}
        prefetch={false}
        onClick={() => setExpanded(true)}
        aria-label={labels.viewAccounts}
        data-testid="money-accounts-route-link"
        className="inline-flex min-h-11 shrink-0 items-center gap-(--space-1) whitespace-nowrap rounded-[var(--radius-control)] px-(--space-1) text-xs font-semibold tabular-nums text-text-primary transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <Text size="sm" weight="semibold" tabular className="text-text-primary">
          {labels.totalBalanceLabel}
        </Text>
        <AppIcon icon={ACTION_ICONS.forward} size="xs" />
      </Link>
    );
  }

  return (
    <section data-testid="money-accounts-scan">
      {showGroupSections && labels.ownedBalanceLabel ? (
        <Card
          tone="elevated"
          className="gap-(--space-2) p-(--space-4)"
          data-testid="money-accounts-balance-summary"
        >
          <Text size="xs" weight="semibold" className="tracking-wide uppercase">
            {labels.ownedBalanceLabel}
          </Text>
          {labels.ownedBalanceValue != null ? (
            <Balance
              amountLabel={labels.ownedBalanceValue}
              size={BalanceSize.HERO}
              kind={FinancialNumberKind.CURRENT_STATE}
            />
          ) : (
            <Text
              size="lg"
              weight="semibold"
              data-testid="money-accounts-balance-unavailable"
            >
              {labels.ownedBalanceUnavailable ?? labels.accountsUnavailable}
            </Text>
          )}
          {labels.sectionDescription ? (
            <Text size="sm" tone="secondary">
              {labels.sectionDescription}
            </Text>
          ) : null}
        </Card>
      ) : null}
      <Card
        tone="elevated"
        className={
          showGroupSections
            ? "gap-(--space-4) overflow-visible border-0 bg-transparent p-0 shadow-none"
            : "gap-(--space-3) overflow-hidden p-(--space-4)"
        }
        data-testid="money-account-object-collection"
      >
        {!showGroupSections ? (
          <SectionHeader
            className="px-0 pt-0 [&_[data-slot=section-heading]]:items-center"
            title={
              <div className="flex min-w-0 items-center gap-(--space-3)">
                <IconContainer tone={IconContainerTone.PRIMARY} size="md">
                  <AppIcon icon={FINANCE_ICONS.card} size={AppIconSize.MD} />
                </IconContainer>
                <div className="min-w-0">
                  <Heading
                    level={2}
                    className="text-sm font-semibold tracking-tight text-text-primary"
                  >
                    {labels.sectionTitle}
                  </Heading>
                  <Text size="xs" tone="secondary" className="mt-0.5">
                    {labels.sectionDescription}
                  </Text>
                </div>
              </div>
            }
            action={headerAction}
          />
        ) : null}

        {!hasAnyContent ? (
          <div className="p-(--space-4)">
            <EmptyState
              testId="money-accounts-empty"
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
          </div>
        ) : (
          <>
            {accountsUnavailable ? (
              <div className="px-(--space-4) pt-(--space-3)">
                <StatusAlert
                  variant="info"
                  title={labels.accountsUnavailable}
                  data-testid="money-accounts-unavailable"
                />
              </div>
            ) : null}
            {accountRows.length === 0 && !accountsUnavailable ? (
              <div className="border-t border-border-subtle/65 pt-(--space-3)">
                <EmptyState
                  testId="money-accounts-empty"
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
              </div>
            ) : null}
            {accountRows.length > 0 ? (
              showGroupSections ? (
                <div className="flex flex-col gap-(--space-4)">
                  {(expanded ? allAccounts : accountGroups).map((group) => (
                    <section
                      key={group.key}
                      className="flex flex-col gap-(--space-2) border-t border-border-subtle/65 pt-(--space-3)"
                    >
                      <SectionHeader
                        title={
                          <Heading
                            level={2}
                            className="text-xs font-medium tracking-wide text-text-secondary uppercase"
                          >
                            {group.key === AccountGroupKey.CASH
                              ? (labels.cashWalletGroupTitle ??
                                labels.accountGroupLabels?.[group.key])
                              : labels.accountGroupLabels?.[group.key]}
                            <span
                              aria-hidden="true"
                              className="text-text-muted"
                            >
                              {` (${group.accounts.length})`}
                            </span>
                          </Heading>
                        }
                        action={
                          group.totalBalanceLabel ? (
                            <Text
                              size="sm"
                              weight="semibold"
                              tabular
                              className="text-text-primary"
                            >
                              {group.totalBalanceLabel}
                            </Text>
                          ) : undefined
                        }
                      />
                      <Card tone="elevated" className="overflow-hidden p-0">
                        <ul className="flex flex-col">
                          {group.accounts.map((account, index) => (
                            <li key={account.id} className="list-none">
                              <AccountInventoryRow
                                account={account}
                                divider={
                                  index < group.accounts.length - 1
                                    ? "inset"
                                    : "none"
                                }
                              />
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </section>
                  ))}
                </div>
              ) : (
                <ul className="flex flex-col gap-(--space-2) border-t border-border-subtle/65 pt-(--space-3)">
                  {accountRows.map((account) => (
                    <li
                      key={account.id}
                      className="overflow-hidden rounded-(--radius-card) border border-border-subtle bg-surface-muted"
                    >
                      <AccountInventoryRow account={account} />
                    </li>
                  ))}
                </ul>
              )
            ) : null}
            {visibleCreditCards.length > 0 || showGroupSections ? (
              <div className="flex flex-col gap-(--space-2)">
                <div className="border-t border-border-subtle/65 pt-(--space-3)">
                  <SectionHeader
                    title={labels.creditCardsTitle}
                    description={labels.creditCardsHint}
                    action={
                      labels.addCreditCard ? (
                        <Link
                          href={APP_PATH.MONEY_ACCOUNTS_NEW_CREDIT}
                          prefetch={false}
                          className="inline-flex min-h-11 items-center rounded-(--radius-control) px-(--space-2) text-sm font-semibold text-accent transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        >
                          {labels.addCreditCard}
                        </Link>
                      ) : undefined
                    }
                  />
                </div>
                {visibleCreditCards.length > 0 ? (
                  showGroupSections ? (
                    <Card tone="elevated" className="overflow-hidden p-0">
                      <ul className="flex flex-col">
                        {visibleCreditCards.map((card, index) => (
                          <li key={card.id} className="list-none">
                            <CreditLiabilityRow
                              card={card}
                              labels={labels}
                              divider={
                                index < visibleCreditCards.length - 1
                                  ? "inset"
                                  : "none"
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ) : (
                    <ul className="flex flex-col gap-(--space-2)">
                      {visibleCreditCards.map((card) => (
                        <li
                          key={card.id}
                          className="overflow-hidden rounded-(--radius-card) border border-border-subtle bg-surface-muted"
                        >
                          <CreditLiabilityRow card={card} labels={labels} />
                        </li>
                      ))}
                    </ul>
                  )
                ) : !creditCardsUnavailable && labels.creditCardsEmpty ? (
                  <EmptyState
                    title={labels.creditCardsEmpty}
                    icon={
                      <AppIcon
                        icon={FINANCE_ICONS.card}
                        size={AppIconSize.DISPLAY}
                      />
                    }
                    className="flex-none py-(--space-2)"
                  />
                ) : null}
              </div>
            ) : null}
            {showGroupSections && labels.ownershipHint ? (
              <InlineAlert
                variant={InlineAlertVariant.INFO}
                testId="money-accounts-ownership-hint"
              >
                {labels.ownershipHint}
              </InlineAlert>
            ) : null}
            {creditCardsUnavailable ? (
              <div className="px-(--space-4) pt-(--space-3)">
                <StatusAlert
                  variant="info"
                  title={labels.creditCardsUnavailable}
                  data-testid="money-credit-cards-unavailable"
                />
              </div>
            ) : null}
            {showManagementToggle &&
            hasMoreAccounts &&
            labels.showAllAccounts &&
            labels.showFewerAccounts ? (
              <div className="flex justify-center border-t border-border-subtle/65 pt-(--space-2)">
                <button
                  type="button"
                  aria-expanded={expanded}
                  data-testid="money-accounts-manage"
                  onClick={() => setExpanded((value) => !value)}
                  className="inline-flex min-h-11 items-center gap-(--space-1) rounded-[var(--radius-control)] px-(--space-2) text-sm font-medium text-accent transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {expanded ? labels.showFewerAccounts : labels.showAllAccounts}
                  <AppIcon
                    icon={ACTION_ICONS.expand}
                    size="xs"
                    className={expanded ? "rotate-180" : undefined}
                  />
                </button>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </section>
  );
}
