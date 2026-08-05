"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { inboxItemPath } from "@/modules/tenancy/application/app-path";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { LoanPaymentMode } from "@/modules/ledger/application/client";
import { recordLoanPaymentAction } from "../../money-products-actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type AccountOption = { id: string; name: string };

type Props = {
  loanId: string;
  scheduledAmountLabel: string;
  earlyPayoffAmountLabel: string;
  accounts: AccountOption[];
};

export function LoanPayAction({
  loanId,
  scheduledAmountLabel,
  earlyPayoffAmountLabel,
  accounts,
}: Props) {
  const t = useTranslations("money.loanDetail");
  const tErr = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [mode, setMode] = useState<
    typeof LoanPaymentMode.SCHEDULED | typeof LoanPaymentMode.EARLY_PAYOFF
  >(LoanPaymentMode.SCHEDULED);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const amountLabel =
    mode === LoanPaymentMode.EARLY_PAYOFF
      ? earlyPayoffAmountLabel
      : scheduledAmountLabel;

  return (
    <div className="flex flex-col gap-(--space-3)" data-testid="loan-pay">
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      <div className="flex gap-(--space-2)">
        <Button
          variant={mode === LoanPaymentMode.SCHEDULED ? "primary" : "secondary"}
          className="min-h-11 flex-1"
          data-testid="loan-pay-mode-scheduled"
          isDisabled={isPending}
          onPress={() => setMode(LoanPaymentMode.SCHEDULED)}
        >
          {t("recordPayment")}
        </Button>
        <Button
          variant={
            mode === LoanPaymentMode.EARLY_PAYOFF ? "primary" : "secondary"
          }
          className="min-h-11 flex-1"
          data-testid="loan-pay-mode-early"
          isDisabled={isPending}
          onPress={() => setMode(LoanPaymentMode.EARLY_PAYOFF)}
        >
          {t("payEarly")}
        </Button>
      </div>
      <label className="flex flex-col gap-(--space-1)">
        <span className="text-sm text-text-secondary">{t("accountLabel")}</span>
        <select
          className="min-h-11 rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          data-testid="loan-pay-account"
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>
      <Text size="sm" tone="secondary" data-testid="loan-pay-amount-preview">
        {t("amountPreview", { amount: amountLabel })}
      </Text>
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="loan-pay-cta"
        isDisabled={!online || isPending || !accountId || accounts.length === 0}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          if (!accountId) {
            setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
            return;
          }
          startTransition(async () => {
            const result = await recordLoanPaymentAction({
              loanId,
              accountId,
              mode,
            });
            if (result.status === "success") {
              if (result.completed && result.inboxItemId) {
                router.push(inboxItemPath(result.inboxItemId));
                return;
              }
              router.refresh();
              return;
            }
            setErrorCode(result.code);
          });
        }}
      >
        {isPending
          ? t("recording")
          : mode === LoanPaymentMode.EARLY_PAYOFF
            ? t("confirmEarlyPayoff")
            : t("recordPayment")}
      </Button>
    </div>
  );
}
