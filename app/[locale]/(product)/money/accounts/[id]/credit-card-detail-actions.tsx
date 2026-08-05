"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { CreditCardDetail } from "@/modules/ledger/application/client";
import { CardBillingMonthStatus } from "@/modules/ledger/application/client";
import { AmountField } from "@/shared/patterns/amount-field";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { SectionHeader } from "@/shared/patterns/section-header";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application/client";
import { addCardCashbackAction, settleCardAction } from "../actions";

type ErrorCode =
  | ProductActionErrorCode
  | LedgerActionErrorCode
  | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type LiquidOption = { id: string; name: string };

type Props = {
  card: CreditCardDetail;
  liquidAccounts: LiquidOption[];
  outstandingLabel: string;
  availableLabel: string;
  currency: string;
};

/**
 * Credit card actions: settle FIFO and cashback.
 * Card Installment convert is deferred to the Card BC (not Loan).
 */
export function CreditCardDetailActions({
  card,
  liquidAccounts,
  outstandingLabel,
  availableLabel,
}: Props) {
  const t = useTranslations("money.creditCard");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [settleAmount, setSettleAmount] = useState<number | null>(
    card.outstanding > 0 ? card.outstanding : null,
  );
  const [sourceId, setSourceId] = useState(
    card.linkedBankAccountId ?? liquidAccounts[0]?.id ?? "",
  );
  const [cashbackAmount, setCashbackAmount] = useState<number | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="credit-card-actions"
    >
      <section className="flex flex-col gap-(--space-2)">
        <Text size="sm" tone="secondary">
          {t("heroHint", {
            outstanding: outstandingLabel,
            available: availableLabel,
          })}
        </Text>
        {errorCode ? (
          <StatusAlert
            variant="danger"
            title={t("actionErrorTitle")}
            description={t(`errors.${errorCode}`)}
          />
        ) : null}
      </section>

      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader title={t("settleTitle")} />
        <AmountField
          id="card-settle-amount"
          label={t("settleAmountLabel")}
          value={settleAmount}
          onValueChange={setSettleAmount}
          data-testid="card-settle-amount"
        />
        <select
          className="min-h-11 rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          data-testid="card-settle-source"
        >
          {liquidAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <Button
          variant="primary"
          className="w-full"
          data-testid="card-settle-submit"
          isDisabled={isPending || !online || !sourceId}
          onPress={() => {
            setErrorCode(null);
            if (!online) {
              setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
              return;
            }
            const amount = settleAmount ?? 0;
            if (amount <= 0) {
              setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
              return;
            }
            startTransition(async () => {
              const result = await settleCardAction({
                cardAccountId: card.accountId,
                sourceAccountId: sourceId,
                amount,
              });
              if (result.status === "success") {
                router.refresh();
                return;
              }
              setErrorCode(result.code);
            });
          }}
        >
          {isPending ? t("settling") : t("settleSubmit")}
        </Button>
      </section>

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
            setErrorCode(null);
            if (!online) {
              setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
              return;
            }
            const amount = cashbackAmount ?? 0;
            if (amount <= 0) {
              setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
              return;
            }
            startTransition(async () => {
              const result = await addCardCashbackAction({
                cardAccountId: card.accountId,
                amount,
              });
              if (result.status === "success") {
                setCashbackAmount(null);
                router.refresh();
                return;
              }
              setErrorCode(result.code);
            });
          }}
        >
          {isPending ? t("cashbackSaving") : t("cashbackSubmit")}
        </Button>
      </section>

      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader title={t("statementsTitle")} />
        {card.months.length === 0 ? (
          <Text size="sm" tone="secondary">
            {t("statementsEmpty")}
          </Text>
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {card.months.map((month) => (
              <li
                key={month.id}
                className="rounded-md border border-border-subtle px-(--space-3) py-(--space-2)"
                data-billing-status={month.status}
              >
                <div className="flex justify-between gap-(--space-2)">
                  <Text size="sm" className="font-medium">
                    {month.billingMonth.slice(0, 7)}
                  </Text>
                  <Text size="sm" tone="secondary">
                    {month.status === CardBillingMonthStatus.SETTLED
                      ? t("statusSettled")
                      : month.status === CardBillingMonthStatus.PARTIAL
                        ? t("statusPartial")
                        : t("statusOpen")}
                  </Text>
                </div>
                <Text size="sm" tone="secondary">
                  {t("statementLine", {
                    statement: String(month.statementAmount),
                    paid: String(month.paidAmount),
                    due: month.dueDate,
                  })}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
