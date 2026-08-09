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
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
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
  eligibleInterest: number | null;
  penaltyAmount: number | null;
  netReturned: number | null;
  warnPenalty: boolean;
  quoteReady: boolean;
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
  const amountOrUnknown = (n: number | null) =>
    n == null ? t("unknown") : money(n);

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="savings-early-withdraw-form"
    >
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      {!preview.quoteReady ? (
        <StatusAlert variant="warning" title={t("quoteUnavailable")} />
      ) : null}
      {preview.warnPenalty ? (
        <StatusAlert variant="warning" title={t("warnPenalty")} />
      ) : null}
      <ConfirmSummary
        data-testid="savings-early-withdraw-preview"
        rows={[
          {
            id: "principal",
            label: t("principal"),
            value: money(preview.principal),
          },
          {
            id: "accrued",
            label: t("accrued"),
            value: money(preview.accruedInterest),
          },
          {
            id: "eligible",
            label: t("eligible"),
            value: amountOrUnknown(preview.eligibleInterest),
          },
          {
            id: "penalty",
            label: t("penalty"),
            value: amountOrUnknown(preview.penaltyAmount),
          },
          {
            id: "net",
            label: t("net"),
            value: amountOrUnknown(preview.netReturned),
          },
        ]}
      />
      <BottomActionBar>
        <Button
          variant="primary"
          className="min-h-11 w-full"
          data-testid="savings-early-withdraw-request"
          isDisabled={isPending || !online || !preview.quoteReady}
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
      </BottomActionBar>
      <Text size="sm" tone="secondary">
        {t("subtitle")}
      </Text>
    </div>
  );
}
