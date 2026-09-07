"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { AmountField } from "@/shared/patterns/amount-field";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { ACTION_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application/client";
import { addCardCashbackAction } from "../actions";

type ErrorCode =
  | ProductActionErrorCode
  | LedgerActionErrorCode
  | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type CreditCardRefundActionProps = {
  cardAccountId: string;
};

/**
 * Secondary card-credit entry point. It keeps the overview quiet while retaining
 * the existing debt-adjustment action and validation contract.
 */
export function CreditCardRefundAction({
  cardAccountId,
}: CreditCardRefundActionProps) {
  const t = useTranslations("money.creditCard");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => {
    if (isPending) return;
    setAmount(null);
    setErrorCode(null);
    setIsFormOpen(false);
  };

  const submit = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    const refundAmount = amount ?? 0;
    if (refundAmount <= 0) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    startTransition(async () => {
      const result = await addCardCashbackAction({
        cardAccountId,
        amount: refundAmount,
      });
      if (result.status === ProductActionStatus.SUCCESS) {
        close();
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  if (!isFormOpen) {
    return (
      <Button
        variant="ghost"
        className="min-h-11 w-full justify-between px-0 text-left"
        data-testid="card-refund-open"
        isDisabled={!online}
        onPress={() => setIsFormOpen(true)}
      >
        <span className="flex min-w-0 items-center gap-(--space-3)">
          <IconContainer tone={IconContainerTone.REFUND} size="sm">
            <AppIcon icon={FINANCE_ICONS.refund} size={AppIconSize.SM} />
          </IconContainer>
          <span>{t("cashbackTitle")}</span>
        </span>
        <AppIcon icon={ACTION_ICONS.forward} size={AppIconSize.SM} />
      </Button>
    );
  }

  return (
    <section
      className="flex flex-col gap-(--space-3) py-(--space-3)"
      data-testid="card-refund-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("actionErrorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      <AmountField
        id="card-refund-amount"
        label={t("cashbackAmountLabel")}
        value={amount}
        onValueChange={setAmount}
        data-testid="card-refund-amount"
      />
      <div className="flex flex-col gap-(--space-2)">
        <Button
          variant="primary"
          className="w-full"
          data-testid="card-refund-submit"
          isDisabled={isPending || !online}
          onPress={submit}
        >
          {isPending ? t("cashbackSaving") : t("cashbackSubmit")}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          isDisabled={isPending}
          onPress={close}
        >
          {t("cancel")}
        </Button>
      </div>
    </section>
  );
}
