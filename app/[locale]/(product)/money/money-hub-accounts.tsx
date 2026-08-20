"use client";

import { useState } from "react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/shared/ui/button";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { AppIcon } from "@/shared/ui/app-icon";
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
  liquidOptions,
  createLabel,
  createOfflineLabel,
  currency,
}: Props) {
  const { online } = useOnlineStatusClient();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="flex flex-col gap-(--space-3)">
      <MoneyAccountsScan
        labels={labels}
        accountGroups={accountGroups}
        initialAccountGroups={initialAccountGroups}
        accountPresentation={accountPresentation}
        hasMoreAccounts={hasMoreAccounts}
        creditCards={creditCards}
        createAction={
          <Button
            variant="ghost"
            className="px-(--space-2) text-sm font-medium text-accent"
            data-testid="money-create-account"
            isDisabled={!online}
            onPress={() => {
              if (!online) return;
              setFormOpen(true);
            }}
          >
            <span className="inline-flex items-center gap-(--space-1)">
              <AppIcon icon={PlusSignIcon} size="xs" />
              {online ? createLabel : createOfflineLabel}
            </span>
          </Button>
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
