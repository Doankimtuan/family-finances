"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  APP_PATH,
  moneySavingsPath,
} from "@/modules/tenancy/application/app-path";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Amount } from "@/shared/patterns/amount";
import { formatCurrency } from "@/shared/i18n/formatters";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/client";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { requestEarlyWithdrawalAction } from "../../savings-actions";

type Preview = {
  principal: number;
  accruedInterest: number;
  eligibleInterest: number;
  penaltyAmount: number;
  netReturned: number;
  warnPenalty: boolean;
};

type Props = {
  savingId: string;
  cycleId: string;
  preview: Preview;
};

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

export function EarlyWithdrawForm({ savingId, cycleId, preview }: Props) {
  const t = useTranslations("money.savingsEarlyWithdraw");
  const tErr = useTranslations("money.products.errors");
  const locale = useLocale();
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const money = (n: number) =>
    formatCurrency(n, DEFAULT_CURRENCY, locale, { maximumFractionDigits: 0 });

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="savings-early-withdraw-form"
    >
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      {preview.warnPenalty ? (
        <StatusAlert variant="warning" title={t("warnPenalty")} />
      ) : null}
      <Amount label={t("principal")} amountLabel={money(preview.principal)} />
      <Amount
        label={t("accrued")}
        amountLabel={money(preview.accruedInterest)}
      />
      <Amount
        label={t("eligible")}
        amountLabel={money(preview.eligibleInterest)}
      />
      <Amount label={t("penalty")} amountLabel={money(preview.penaltyAmount)} />
      <Amount label={t("net")} amountLabel={money(preview.netReturned)} size="lg" />
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="savings-early-withdraw-request"
        isDisabled={isPending || !online}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          startTransition(async () => {
            const result = await requestEarlyWithdrawalAction({
              savingId,
              cycleId,
            });
            if (result.status === "success") {
              router.replace(APP_PATH.INBOX);
              return;
            }
            setErrorCode(result.code);
          });
        }}
      >
        {isPending ? t("requesting") : t("request")}
      </Button>
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        onPress={() => router.push(moneySavingsPath(savingId))}
      >
        {t("back")}
      </Button>
      <Text size="sm" tone="secondary">
        {t("subtitle")}
      </Text>
    </div>
  );
}
