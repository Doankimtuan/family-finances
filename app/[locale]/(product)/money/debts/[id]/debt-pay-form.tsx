"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { recordLiabilityPaymentAction } from "../../money-products-actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

export function DebtPayForm({
  liabilityId,
  maxAmount,
}: {
  liabilityId: string;
  maxAmount: number;
}) {
  const t = useTranslations("money.debtDetail");
  const tErr = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [amount, setAmount] = useState(String(maxAmount));
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-(--space-3)" data-testid="debt-pay-form">
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      <TextField
        id="debt-pay-amount"
        label={t("payAmount")}
        value={amount}
        inputMode="numeric"
        onChange={(e) => setAmount(e.target.value)}
      />
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="debt-pay-save"
        isDisabled={!online || isPending || maxAmount <= 0}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          const value = Number(amount.replace(/\D/g, ""));
          startTransition(async () => {
            const result = await recordLiabilityPaymentAction({
              liabilityId,
              amount: value,
            });
            if (result.status === "success") {
              router.refresh();
              return;
            }
            setErrorCode(result.code);
          });
        }}
      >
        {isPending ? t("paying") : t("pay")}
      </Button>
    </div>
  );
}
