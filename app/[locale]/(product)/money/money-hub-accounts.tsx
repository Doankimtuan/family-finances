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
  type MoneyHubCardRow,
  type MoneyHubLiquidRow,
} from "./money-accounts-scan";

type LiquidOption = { id: string; name: string };

type Props = {
  labels: MoneyAccountsScanLabels;
  liquidAccounts: MoneyHubLiquidRow[];
  creditCards: MoneyHubCardRow[];
  loadFailed: boolean;
  liquidOptions: LiquidOption[];
  createLabel: string;
  createOfflineLabel: string;
};

/**
 * Money hub accounts: scan list + create-account CTA (replaces /money/accounts index).
 */
export function MoneyHubAccounts({
  labels,
  liquidAccounts,
  creditCards,
  loadFailed,
  liquidOptions,
  createLabel,
  createOfflineLabel,
}: Props) {
  const { online } = useOnlineStatusClient();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="flex flex-col gap-(--space-3)">
      <MoneyAccountsScan
        labels={labels}
        liquidAccounts={liquidAccounts}
        creditCards={creditCards}
        loadFailed={loadFailed}
        createAction={
          <Button
            variant="ghost"
            className="min-h-9 px-(--space-2) text-sm font-medium text-accent"
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
        open={formOpen}
        onOpenChange={setFormOpen}
        hideDefaultTrigger
        presentation="sheet"
      />
    </div>
  );
}
