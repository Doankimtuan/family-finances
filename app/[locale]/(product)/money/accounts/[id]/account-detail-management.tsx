"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { AccountType as AccountTypeValue } from "@/modules/ledger/application/client";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconButton } from "@/shared/ui/icon-button";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { AccountDetailActions } from "./account-detail-actions";
import {
  ACCOUNT_DETAIL_MODE,
  type AccountDetailMode,
} from "./detail-constants";

export type AccountDetailManagementProps = {
  accountId: string;
  initialName: string;
  initialType: AccountTypeValue;
  canMutate: boolean;
  children?: ReactNode;
};

function resolveTitleKey(mode: AccountDetailMode) {
  switch (mode) {
    case ACCOUNT_DETAIL_MODE.EDIT:
      return "editTitle" as const;
    case ACCOUNT_DETAIL_MODE.ARCHIVE:
      return "archiveConfirmTitle" as const;
    default:
      return "manageTitle" as const;
  }
}

/**
 * Keeps account maintenance out of the overview while retaining one predictable
 * place for edit and archive actions on every account detail page.
 */
export function AccountDetailManagement({
  accountId,
  initialName,
  initialType,
  canMutate,
  children,
}: AccountDetailManagementProps) {
  const t = useTranslations("money.accountDetail");
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AccountDetailMode>(
    ACCOUNT_DETAIL_MODE.MANAGE,
  );

  function handleOpenChange(next: boolean) {
    setIsOpen(next);
    if (!next) setMode(ACCOUNT_DETAIL_MODE.MANAGE);
  }

  const titleKey = resolveTitleKey(mode);

  return (
    <>
      <IconButton
        aria-label={t("moreActions")}
        variant="secondary"
        data-testid="account-management-open"
        onPress={() => setIsOpen(true)}
      >
        <AppIcon icon={ACTION_ICONS.more} size="sm" />
      </IconButton>
      <Sheet isOpen={isOpen} onOpenChange={handleOpenChange}>
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t(titleKey)}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          {canMutate ? (
            <AccountDetailActions
              accountId={accountId}
              initialName={initialName}
              initialType={initialType}
              mode={mode}
              onModeChange={setMode}
            >
              {children}
            </AccountDetailActions>
          ) : (
            <ActionSheetLayout.Body>
              <p className="text-sm text-text-secondary">
                {t("ownershipReadOnly")}
              </p>
            </ActionSheetLayout.Body>
          )}
        </ActionSheetLayout>
      </Sheet>
    </>
  );
}
