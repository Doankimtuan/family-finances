"use client";

import { useState, type ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { Link } from "@/i18n/navigation";
import {
  type MoneyAccountGroupKey,
  type MoneyCreditAttention,
} from "@/modules/ledger/application";
import { moneyAccountPath } from "@/modules/tenancy/application/app-path";
import { AccountCard } from "@/modules/ledger/ui/account-card";
import { CreditCardCard } from "@/modules/ledger/ui/credit-card-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Text } from "@/shared/ui/text";
import type { IconContainerTone } from "@/shared/ui/icon-container";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import type { FinancialScope } from "@/modules/shared-kernel/application/financial-scope";
import type { OwnerStatus } from "@/modules/shared-kernel/application/financial-ownership";

export type MoneyHubAccountRow = {
  id: string;
  title: string;
  typeLabel: string;
  balanceLabel: string;
  icon: IconSvgElement;
  iconTone: IconContainerTone;
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
  attention?: MoneyCreditAttention | null;
};

export type MoneyAccountsScanLabels = {
  sectionTitle: string;
  groupTitles: Record<MoneyAccountGroupKey, string>;
  creditCardsTitle: string;
  creditCardsHint: string;
  outstanding: string;
  availableCredit: string;
  creditLimit: string;
  emptyTitle: string;
  emptyDescription: string;
  showAll: string;
  showLess: string;
  attentionLabels: Record<MoneyCreditAttention, string>;
};

type Props = {
  labels: MoneyAccountsScanLabels;
  accountGroups: MoneyHubAccountGroup[];
  initialAccountGroups: MoneyHubAccountGroup[];
  accountPresentation: "flat" | "grouped";
  hasMoreAccounts: boolean;
  creditCards: MoneyHubCardRow[];
  createAction: ReactNode;
};

const CREDIT_ATTENTION_TONE: Record<
  MoneyCreditAttention,
  "warning" | "attention"
> = {
  overdue: "attention",
  due_soon: "warning",
  high_utilization: "warning",
};

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
          size="sm"
          className="px-(--space-3) pt-(--space-3) pb-(--space-1) text-xs font-medium uppercase tracking-wide text-text-secondary"
        >
          {title}
        </Text>
      ) : null}
      <ul className="divide-y divide-border-subtle/65 px-(--space-2)">
        {group.accounts.map((account) => (
          <li key={account.id} className="py-(--space-1)">
            <Link
              href={moneyAccountPath(account.id)}
              className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              data-testid="money-hub-account-row"
            >
              <AccountCard
                title={account.title}
                typeLabel={account.typeLabel}
                balanceLabel={account.balanceLabel}
                variant="row"
                icon={account.icon}
                iconTone={account.iconTone}
              />
              <div className="px-(--space-3) pb-(--space-2)">
                <FinancialOwnershipBadge
                  financialScope={account.financialScope}
                  isOwnedByMe={account.isOwnedByMe}
                  ownerStatus={account.ownerStatus}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Money account scan. It keeps account containers and credit liabilities
 * structurally distinct, while allowing a concise default for a large account set.
 */
export function MoneyAccountsScan({
  labels,
  accountGroups,
  initialAccountGroups,
  accountPresentation,
  hasMoreAccounts,
  creditCards,
  createAction,
}: Props) {
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const visibleGroups = showAllAccounts ? accountGroups : initialAccountGroups;
  const hasAnyAccount = accountGroups.length > 0;
  const hasAnyContent = hasAnyAccount || creditCards.length > 0;

  return (
    <section
      className="flex flex-col gap-(--space-4)"
      data-testid="money-accounts-scan"
    >
      <SectionHeader title={labels.sectionTitle} action={createAction} />
      {!hasAnyContent ? (
        <EmptyState
          title={labels.emptyTitle}
          description={labels.emptyDescription}
          className="flex-none py-(--space-4)"
        />
      ) : (
        <div className="flex flex-col gap-(--space-5)">
          {hasAnyAccount ? (
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-border-subtle/65 bg-surface-muted/35">
              {visibleGroups.map((group, index) => (
                <div
                  key={group.key}
                  className={
                    index > 0 ? "border-t border-border-subtle/65" : undefined
                  }
                >
                  <AccountGroupRows
                    group={group}
                    showGroupTitle={accountPresentation === "grouped"}
                    title={labels.groupTitles[group.key]}
                  />
                </div>
              ))}
              {hasMoreAccounts ? (
                <button
                  type="button"
                  className="mx-(--space-3) my-(--space-2) w-fit text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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
                <Text size="sm" className="font-medium text-text-primary">
                  {labels.creditCardsTitle}
                </Text>
                <Text size="sm" tone="secondary">
                  {labels.creditCardsHint}
                </Text>
              </div>
              <ul className="flex flex-col gap-(--space-2)">
                {creditCards.map((card) => (
                  <li key={card.id}>
                    <Link
                      href={moneyAccountPath(card.id)}
                      className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      data-testid="money-hub-credit-card-row"
                    >
                      <CreditCardCard
                        title={card.title}
                        outstandingCaption={labels.outstanding}
                        outstandingLabel={card.outstandingLabel}
                        availableCaption={labels.availableCredit}
                        availableLabel={card.availableLabel}
                        limitCaption={labels.creditLimit}
                        limitLabel={card.limitLabel}
                        utilizationPct={card.utilizationPct}
                        utilizationLabel={card.utilizationLabel}
                        utilizationAriaLabel={card.utilizationAriaLabel}
                        dueLabel={card.dueLabel}
                        attentionLabel={
                          card.attention
                            ? labels.attentionLabels[card.attention]
                            : undefined
                        }
                        attentionTone={
                          card.attention
                            ? CREDIT_ATTENTION_TONE[card.attention]
                            : undefined
                        }
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
