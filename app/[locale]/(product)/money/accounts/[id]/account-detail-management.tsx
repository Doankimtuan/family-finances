"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { AccountType as AccountTypeValue } from "@/modules/ledger/application/client";
import { Sheet, SheetContent } from "@/shared/patterns/sheet";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconButton } from "@/shared/ui/icon-button";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { AccountDetailActions } from "./account-detail-actions";

export type AccountDetailManagementProps = {
  accountId: string;
  initialName: string;
  initialType: AccountTypeValue;
  canMutate: boolean;
  children?: ReactNode;
};

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
      <Sheet
        isOpen={isOpen}
        onOpenChange={(next) => {
          setIsOpen(next);
        }}
      >
        <SheetContent>
          <Sheet.Header className="px-(--space-4) pt-(--space-3)">
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("manageTitle")}
            </Sheet.Heading>
          </Sheet.Header>
          <Sheet.Body className="max-h-[min(58dvh,480px)] overflow-y-auto px-(--space-4) py-(--space-3)">
            <div className="flex flex-col gap-(--space-4)">
              {canMutate ? (
                <>
                  <AccountDetailActions
                    accountId={accountId}
                    initialName={initialName}
                    initialType={initialType}
                  />
                  {children}
                </>
              ) : (
                <p className="text-sm text-text-secondary">
                  {t("ownershipReadOnly")}
                </p>
              )}
            </div>
          </Sheet.Body>
        </SheetContent>
      </Sheet>
    </>
  );
}
