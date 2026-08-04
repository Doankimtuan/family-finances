"use client";

import { useId, useState, type ReactNode } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import { moneyAccountPath } from "@/modules/tenancy/application/app-path";
import { AccountCard } from "@/shared/patterns/account-card";
import { CreditCardCard } from "@/shared/patterns/credit-card-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";

export type MoneyHubLiquidRow = {
  id: string;
  title: string;
  typeLabel: string;
  balanceLabel: string;
};

export type MoneyHubCardRow = {
  id: string;
  title: string;
  outstandingLabel: string;
  availableLabel: string;
  utilizationPct: number;
  utilizationLabel: string;
  dueLabel?: string;
};

export type MoneyAccountsScanLabels = {
  sectionTitle: string;
  liquidTitle: string;
  creditCardsTitle: string;
  creditCardsHint: string;
  outstanding: string;
  availableCredit: string;
  collapse: string;
  expand: string;
  collapsedSummary: string;
  emptyTitle: string;
  emptyDescription: string;
  loadErrorTitle: string;
  loadErrorBody: string;
};

type Props = {
  labels: MoneyAccountsScanLabels;
  liquidAccounts: MoneyHubLiquidRow[];
  creditCards: MoneyHubCardRow[];
  loadFailed: boolean;
  createAction: ReactNode;
};

/**
 * Money hub accounts scan — liquid + credit cards, default expanded, optional collapse.
 * Product surface: preserve existing AccountCard / CreditCardCard patterns.
 */
export function MoneyAccountsScan({
  labels,
  liquidAccounts,
  creditCards,
  loadFailed,
  createAction,
}: Props) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(true);
  const hasAnything = liquidAccounts.length > 0 || creditCards.length > 0;
  const canCollapse = hasAnything && !loadFailed;

  return (
    <section
      className="flex flex-col gap-(--space-3)"
      data-testid="money-accounts-scan"
    >
      <SectionHeader
        title={labels.sectionTitle}
        action={
          <div className="flex items-center gap-(--space-3)">
            {canCollapse ? (
              <Button
                variant="ghost"
                className="min-h-9 px-(--space-2) text-sm font-medium text-accent"
                aria-expanded={expanded}
                aria-controls={panelId}
                data-testid="money-accounts-collapse"
                onPress={() => setExpanded((value) => !value)}
              >
                <span className="inline-flex items-center gap-(--space-1)">
                  {expanded ? labels.collapse : labels.expand}
                  {expanded ? (
                    <CaretUp size={14} weight="bold" aria-hidden />
                  ) : (
                    <CaretDown size={14} weight="bold" aria-hidden />
                  )}
                </span>
              </Button>
            ) : null}
            {createAction}
          </div>
        }
      />

      {loadFailed ? (
        <EmptyState
          title={labels.loadErrorTitle}
          description={labels.loadErrorBody}
          className="flex-none py-(--space-4)"
        />
      ) : !hasAnything ? (
        <EmptyState
          title={labels.emptyTitle}
          description={labels.emptyDescription}
          className="flex-none py-(--space-4)"
        />
      ) : (
        <div id={panelId}>
          {!expanded ? (
            <Text
              size="sm"
              tone="secondary"
              className="leading-relaxed"
              data-testid="money-accounts-collapsed-summary"
            >
              {labels.collapsedSummary}
            </Text>
          ) : (
            <div className="flex flex-col gap-(--space-4)">
              <div className="flex flex-col gap-(--space-2)">
                <Text size="sm" className="font-medium text-text-primary">
                  {labels.liquidTitle}
                </Text>
                {liquidAccounts.length === 0 ? (
                  <EmptyState
                    title={labels.emptyTitle}
                    description={labels.emptyDescription}
                    className="flex-none py-(--space-3)"
                  />
                ) : (
                  <ul className="flex flex-col gap-(--space-2)">
                    {liquidAccounts.map((account) => (
                      <li key={account.id}>
                        <Link
                          href={moneyAccountPath(account.id)}
                          className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        >
                          <AccountCard
                            title={account.title}
                            typeLabel={account.typeLabel}
                            balanceLabel={account.balanceLabel}
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {creditCards.length > 0 ? (
                <div className="flex flex-col gap-(--space-2)">
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
                            utilizationPct={card.utilizationPct}
                            utilizationLabel={card.utilizationLabel}
                            dueLabel={card.dueLabel}
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
