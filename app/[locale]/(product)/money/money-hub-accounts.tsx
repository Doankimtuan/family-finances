"use client";

import { useState } from "react";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { AppIcon } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { QuickAction } from "@/shared/patterns/quick-action";
import { AddAccountForm } from "./accounts/add-account-form";
import {
  MoneyAccountsScan,
  type MoneyAccountsScanLabels,
  type MoneyHubAccountGroup,
  type MoneyHubCardRow,
} from "./money-accounts-scan";

type LiquidOption = { id: string; name: string };

type Props = {
  labels: MoneyAccountsScanLabels;
  accounts: MoneyHubAccountGroup[];
  allAccounts: MoneyHubAccountGroup[];
  initiallyExpanded?: boolean;
  creditCards: MoneyHubCardRow[];
  accountsUnavailable?: boolean;
  creditCardsUnavailable?: boolean;
  liquidOptions: LiquidOption[];
  createLabel: string;
  createOfflineLabel: string;
  currency: string;
};

/** Money hub accounts: a grouped scan with the existing create-account sheet. */
export function MoneyHubAccounts({
  labels,
  accounts,
  allAccounts,
  initiallyExpanded,
  creditCards,
  accountsUnavailable,
  creditCardsUnavailable,
  liquidOptions,
  createLabel,
  createOfflineLabel,
  currency,
}: Props) {
  const { online } = useOnlineStatusClient();
  const [formOpen, setFormOpen] = useState(false);
  const openCreate = () => {
    if (!online) return;
    setFormOpen(true);
  };
  const actionLabel = online ? createLabel : createOfflineLabel;

  return (
    <div className="flex flex-col gap-(--space-3)">
      <MoneyAccountsScan
        key={initiallyExpanded ? 1 : 0}
        labels={labels}
        accounts={accounts}
        allAccounts={allAccounts}
        initiallyExpanded={initiallyExpanded}
        creditCards={creditCards}
        accountsUnavailable={accountsUnavailable}
        creditCardsUnavailable={creditCardsUnavailable}
        emptyAction={
          <QuickAction
            label={actionLabel}
            icon={<AppIcon icon={FINANCE_ICONS.account} size="sm" />}
            data-testid="money-create-account"
            isDisabled={!online}
            onPress={openCreate}
          />
        }
      />
      <AddAccountForm
        liquidAccounts={liquidOptions}
        currency={currency}
        open={formOpen}
        onOpenChange={setFormOpen}
        hideDefaultTrigger
        presentation="sheet"
      />
    </div>
  );
}
