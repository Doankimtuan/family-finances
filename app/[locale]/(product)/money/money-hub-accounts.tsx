"use client";

import { useState } from "react";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";
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
  accountGroups: MoneyHubAccountGroup[];
  initialAccountGroups: MoneyHubAccountGroup[];
  accountPresentation: "flat" | "grouped";
  hasMoreAccounts: boolean;
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
  accountGroups,
  initialAccountGroups,
  accountPresentation,
  hasMoreAccounts,
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
        labels={labels}
        accountGroups={accountGroups}
        initialAccountGroups={initialAccountGroups}
        accountPresentation={accountPresentation}
        hasMoreAccounts={hasMoreAccounts}
        creditCards={creditCards}
        accountsUnavailable={accountsUnavailable}
        creditCardsUnavailable={creditCardsUnavailable}
        createAction={
          <Button
            variant={ButtonVariant.GHOST}
            className="px-(--space-2) text-sm font-medium text-accent"
            data-testid="money-create-account"
            isDisabled={!online}
            onPress={openCreate}
          >
            <span className="inline-flex items-center gap-(--space-1)">
              <AppIcon icon={ACTION_ICONS.add} size="xs" />
              {actionLabel}
            </span>
          </Button>
        }
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
