"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { AccountType as AccountTypeValue } from "@/modules/ledger/application/client";
import type { AccountIconKey } from "@/modules/ledger/application/icon-constants";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { Card } from "@/shared/patterns/card";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { IconButton } from "@/shared/ui/icon-button";
import {
  ACTION_ICONS,
  FINANCE_ICONS,
  UTILITY_ICONS,
} from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import type { FinancialScope } from "@/modules/shared-kernel/application/financial-scope";
import type { OwnerStatus } from "@/modules/shared-kernel/application/financial-ownership";
import { AccountDetailActions } from "./account-detail-actions";
import {
  ACCOUNT_DETAIL_MODE,
  type AccountDetailMode,
} from "./detail-constants";

export type AccountDetailManagementProps = {
  accountId: string;
  initialName: string;
  initialType: AccountTypeValue;
  initialIconKey: AccountIconKey | null;
  canMutate: boolean;
  presentation?: "menu" | "settings";
  settingsTrigger?: boolean;
  settingsHeading?: string;
  settingsDetail?: { title: string; description: string };
  financialScope?: FinancialScope;
  isOwnedByMe?: boolean;
  ownerStatus?: OwnerStatus;
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
  initialIconKey,
  canMutate,
  presentation = "menu",
  settingsTrigger = false,
  settingsHeading,
  settingsDetail,
  financialScope,
  isOwnedByMe,
  ownerStatus,
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
  const openMode = (nextMode: AccountDetailMode) => {
    setMode(nextMode);
    setIsOpen(true);
  };

  return (
    <>
      {presentation === "settings" ? (
        <Card
          tone="elevated"
          className="gap-(--space-2) p-(--space-3)"
          data-testid="account-settings"
        >
          <Text size="sm" weight="semibold">
            {settingsHeading ?? t("settingsTitle")}
          </Text>
          <ul className="divide-y divide-border-subtle/70">
            <li>
              <Button
                variant={ButtonVariant.GHOST}
                className="min-h-12 w-full justify-between px-0 text-left"
                isDisabled={!canMutate}
                onPress={() => openMode(ACCOUNT_DETAIL_MODE.EDIT)}
                data-testid="account-settings-edit"
              >
                <span className="flex min-w-0 items-center gap-(--space-3)">
                  <IconContainer tone={IconContainerTone.NEUTRAL} size="sm">
                    <AppIcon icon={ACTION_ICONS.edit} size={AppIconSize.SM} />
                  </IconContainer>
                  <span className="flex min-w-0 flex-col items-start">
                    <span className="text-sm font-medium text-text-primary">
                      {t("settingsEditLabel")}
                    </span>
                    <Text size="xs" tone="secondary">
                      {t("settingsEditDescription")}
                    </Text>
                  </span>
                </span>
                <AppIcon icon={ACTION_ICONS.forward} size={AppIconSize.SM} />
              </Button>
            </li>
            <li className="flex min-h-12 items-center justify-between gap-(--space-3) py-(--space-2)">
              <span className="flex min-w-0 items-center gap-(--space-3)">
                <IconContainer tone={IconContainerTone.NEUTRAL} size="sm">
                  <AppIcon
                    icon={
                      settingsDetail
                        ? FINANCE_ICONS.card
                        : FINANCE_ICONS.account
                    }
                    size={AppIconSize.SM}
                  />
                </IconContainer>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-text-primary">
                    {settingsDetail?.title ?? t("settingsScopeLabel")}
                  </span>
                  <Text size="xs" tone="secondary">
                    {settingsDetail?.description ??
                      t("settingsScopeDescription")}
                  </Text>
                </span>
              </span>
              {!settingsDetail &&
              financialScope &&
              typeof isOwnedByMe === "boolean" ? (
                <FinancialOwnershipBadge
                  financialScope={financialScope}
                  isOwnedByMe={isOwnedByMe}
                  ownerStatus={ownerStatus}
                  compact
                />
              ) : null}
            </li>
            <li className="pt-(--space-3)">
              <Button
                variant={ButtonVariant.GHOST}
                className="min-h-12 w-full justify-between rounded-[var(--radius-control)] border border-debt/25 bg-debt-soft/10 px-(--space-3) text-left text-debt"
                isDisabled={!canMutate}
                onPress={() => openMode(ACCOUNT_DETAIL_MODE.ARCHIVE)}
                data-testid="account-settings-archive"
              >
                <span className="flex min-w-0 items-center gap-(--space-3)">
                  <IconContainer tone={IconContainerTone.DEBT} size="sm">
                    <AppIcon icon={ACTION_ICONS.delete} size={AppIconSize.SM} />
                  </IconContainer>
                  <span className="flex min-w-0 flex-col items-start">
                    <span className="text-sm font-medium">
                      {t("settingsArchiveLabel")}
                    </span>
                    <Text size="xs" tone="secondary">
                      {t("settingsArchiveDescription")}
                    </Text>
                  </span>
                </span>
                <AppIcon icon={ACTION_ICONS.forward} size={AppIconSize.SM} />
              </Button>
            </li>
          </ul>
        </Card>
      ) : (
        <IconButton
          aria-label={settingsTrigger ? t("settingsTitle") : t("moreActions")}
          variant="secondary"
          data-testid="account-management-open"
          onPress={() => setIsOpen(true)}
        >
          <AppIcon
            icon={settingsTrigger ? UTILITY_ICONS.settings : ACTION_ICONS.more}
            size={AppIconSize.SM}
          />
        </IconButton>
      )}
      <Sheet isOpen={isOpen} onOpenChange={handleOpenChange}>
        <ActionSheetLayout
          className={mode === ACCOUNT_DETAIL_MODE.MANAGE ? "h-auto" : undefined}
        >
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
              initialIconKey={initialIconKey}
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
