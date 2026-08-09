"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { AmountField } from "@/shared/patterns/amount-field";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Button } from "@/shared/ui/button";
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

type Props = {
  cardAccountId: string;
  onError: (code: ErrorCode | null) => void;
};

export function CreditCardCashbackSection({ cardAccountId, onError }: Props) {
  const t = useTranslations("money.creditCard");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [cashbackAmount, setCashbackAmount] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-(--space-3)">
      <SectionHeader title={t("cashbackTitle")} />
      <AmountField
        id="card-cashback-amount"
        label={t("cashbackAmountLabel")}
        value={cashbackAmount}
        onValueChange={setCashbackAmount}
        data-testid="card-cashback-amount"
      />
      <Button
        variant="secondary"
        className="w-full"
        data-testid="card-cashback-submit"
        isDisabled={isPending || !online}
        onPress={() => {
          onError(null);
          if (!online) {
            onError(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          const amount = cashbackAmount ?? 0;
          if (amount <= 0) {
            onError(PRODUCT_ACTION_ERROR_CODE.INVALID);
            return;
          }
          startTransition(async () => {
            const result = await addCardCashbackAction({
              cardAccountId,
              amount,
            });
            if (result.status === ProductActionStatus.SUCCESS) {
              setCashbackAmount(null);
              router.refresh();
              return;
            }
            onError(result.code);
          });
        }}
      >
        {isPending ? t("cashbackSaving") : t("cashbackSubmit")}
      </Button>
    </section>
  );
}
