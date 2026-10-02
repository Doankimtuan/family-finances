"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  MoneyCaptureMode,
  TRANSACTION_ACCOUNT_QUERY_PARAM,
  TRANSACTION_CAPTURE_MODE_QUERY_PARAM,
} from "@/modules/ledger/application/client";
import { accountTransactionsHref } from "../../transactions/transactions-list-presentations";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";

type Props = { accountId: string };

export function AccountDetailQuickActions({ accountId }: Props) {
  const t = useTranslations("money.accountDetail");
  const router = useRouter();
  const { online } = useOnlineStatusClient();

  function openCapture(mode?: MoneyCaptureMode) {
    const params = new URLSearchParams({
      [TRANSACTION_ACCOUNT_QUERY_PARAM]: accountId,
    });
    if (mode) params.set(TRANSACTION_CAPTURE_MODE_QUERY_PARAM, mode);
    router.push(`${APP_PATH.MONEY_ADD}?${params.toString()}`);
  }

  return (
    <div
      className="grid grid-cols-3 gap-(--space-2)"
      role="group"
      aria-label={t("quickActions")}
      data-testid="account-detail-quick-actions"
    >
      <Button
        variant={ButtonVariant.PRIMARY}
        className="h-auto min-h-12 w-full flex-col gap-(--space-1) px-(--space-2) py-(--space-1)"
        isDisabled={!online}
        onPress={() => openCapture()}
        data-testid="account-quick-capture"
      >
        <AppIcon icon={FINANCE_ICONS.expense} size={AppIconSize.SM} />
        <span className="text-xs">{t("captureIncomeExpense")}</span>
      </Button>
      <Button
        variant={ButtonVariant.SECONDARY}
        className="h-auto min-h-12 w-full flex-col gap-(--space-1) px-(--space-2) py-(--space-1)"
        isDisabled={!online}
        onPress={() => openCapture(MoneyCaptureMode.TRANSFER)}
        data-testid="account-quick-transfer"
      >
        <AppIcon icon={FINANCE_ICONS.transfer} size={AppIconSize.SM} />
        <span className="text-xs">{t("transferAction")}</span>
      </Button>
      <Button
        variant={ButtonVariant.SECONDARY}
        className="h-auto min-h-12 w-full flex-col gap-(--space-1) px-(--space-2) py-(--space-1)"
        onPress={() => router.push(accountTransactionsHref(accountId))}
        data-testid="account-quick-statement"
      >
        <AppIcon icon={FINANCE_ICONS.ledger} size={AppIconSize.SM} />
        <span className="text-xs">{t("statementAction")}</span>
      </Button>
    </div>
  );
}
