"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  InvestmentFeeSource,
  InvestmentFormMode,
  InvestmentIncomeKind,
  InvestmentValuationSource,
  type InvestmentFormMode as InvestmentFormModeValue,
  type InvestmentHolding,
  type InvestmentErrorCode,
} from "@/modules/investments/application/client";
import { moneyInvestmentPath } from "@/modules/tenancy/application/app-path";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AmountField } from "@/shared/patterns/amount-field";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { LabeledDateInput, LabeledSelect } from "@/shared/patterns/labeled-native-field";
import {
  recordAssetConversionAction,
  recordInvestmentBuyAction,
  recordInvestmentIncomeAction,
  recordInvestmentSellAction,
  recordInvestmentValuationAction,
} from "./investment-actions";

type AccountOption = { id: string; name: string };
type Props = {
  mode: InvestmentFormModeValue;
  holding: InvestmentHolding;
  holdings: InvestmentHolding[];
  accounts: AccountOption[];
};

const today = () => new Date().toISOString().slice(0, 10);

export function InvestmentOperationForm({ mode, holding, holdings, accounts }: Props) {
  const t = useTranslations("money.investments.operation");
  const router = useRouter();
  const [quantity, setQuantity] = useState("");
  const [destinationQuantity, setDestinationQuantity] = useState("");
  const [value, setValue] = useState<number | null>(null);
  const [quote, setQuote] = useState<number | null>(null);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [sourceId, setSourceId] = useState(holding.id);
  const [destinationId, setDestinationId] = useState(
    holdings.find((item) => item.id !== holding.id)?.id ?? "",
  );
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [hasFee, setHasFee] = useState(false);
  const [feeSource, setFeeSource] = useState<InvestmentFeeSource>(InvestmentFeeSource.CASH);
  const [feeAmount, setFeeAmount] = useState<number | null>(null);
  const [feeQuantity, setFeeQuantity] = useState("");
  const [feeValue, setFeeValue] = useState<number | null>(null);
  const [feeHoldingId, setFeeHoldingId] = useState(holdings[0]?.id ?? "");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<InvestmentErrorCode | null>(null);
  const [pending, startTransition] = useTransition();

  const feeSources = useMemo(() => {
    const values =
      mode === InvestmentFormMode.BUY
        ? [InvestmentFeeSource.CASH, InvestmentFeeSource.DESTINATION_ASSET, InvestmentFeeSource.OTHER_INVESTMENT]
        : mode === InvestmentFormMode.SELL
          ? [InvestmentFeeSource.CASH, InvestmentFeeSource.SOURCE_ASSET, InvestmentFeeSource.OTHER_INVESTMENT]
          : Object.values(InvestmentFeeSource);
    return values.map((source) => ({ id: source, label: t(`feeSource.${source}`) }));
  }, [mode, t]);
  const holdingOptions = holdings.map((item) => ({ id: item.id, label: item.symbol || item.name }));
  const accountOptions = accounts.map((account) => ({ id: account.id, label: account.name }));

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const fee = hasFee && feeValue != null
        ? [{
            source: feeSource,
            feeValueVnd: feeValue,
            ...(feeSource === InvestmentFeeSource.CASH
              ? { amountVnd: feeAmount ?? undefined, cashAccountId: accountId }
              : {
                  quantity: feeQuantity,
                  holdingId:
                    feeSource === InvestmentFeeSource.OTHER_INVESTMENT
                      ? feeHoldingId
                      : undefined,
                }),
          }]
        : [];
      const idempotencyKey = `investment:${mode}:${crypto.randomUUID()}`;
      const common = { effectiveDate: date, notes: notes || null, idempotencyKey };
      const result =
        mode === InvestmentFormMode.BUY
          ? await recordInvestmentBuyAction({ holdingId: holding.id, cashAccountId: accountId, boughtQuantity: quantity, executedValueVnd: value ?? 0, quotedValueVnd: quote, fees: fee, ...common })
          : mode === InvestmentFormMode.SELL
            ? await recordInvestmentSellAction({ holdingId: holding.id, cashAccountId: accountId, soldQuantity: quantity, executedValueVnd: value ?? 0, quotedValueVnd: quote, fees: fee, ...common })
            : mode === InvestmentFormMode.CONVERSION
              ? await recordAssetConversionAction({ sourceHoldingId: sourceId, destinationHoldingId: destinationId, sourceQuantity: quantity, destinationQuantity, executedValueVnd: value, quotedValueVnd: quote, fees: fee, ...common })
              : mode === InvestmentFormMode.INCOME
                ? await recordInvestmentIncomeAction({ holdingId: holding.id, cashAccountId: accountId, amountVnd: value ?? 0, incomeKind: InvestmentIncomeKind.OTHER, ...common })
                : await recordInvestmentValuationAction({ holdingId: holding.id, valueVnd: value ?? 0, valuationDate: date, source: InvestmentValuationSource.MANUAL, notes: notes || null, idempotencyKey });
      if (!result.ok) {
        setError(result.code);
        return;
      }
      router.replace(`${moneyInvestmentPath(result.receipt.sourceHoldingId ?? holding.id)}?receipt=${result.receipt.correlationId}`);
    });
  };

  const showQuantity = mode === InvestmentFormMode.BUY || mode === InvestmentFormMode.SELL || mode === InvestmentFormMode.CONVERSION;
  const showAccount = mode !== InvestmentFormMode.VALUATION && mode !== InvestmentFormMode.CONVERSION;
  const showFee = mode === InvestmentFormMode.BUY || mode === InvestmentFormMode.SELL || mode === InvestmentFormMode.CONVERSION;
  return (
    <div className="flex flex-col gap-(--space-4)" data-testid={`investment-operation-${mode}`}>
      {error ? <StatusAlert variant="danger" title={t(`errors.${error}`)} /> : null}
      {confirming ? (
        <ConfirmSummary data-testid="investment-operation-preview" rows={[
          { id: "holding", label: t("holding"), value: holdings.find((item) => item.id === sourceId)?.symbol || holdings.find((item) => item.id === sourceId)?.name || holding.name },
          ...(showQuantity ? [{ id: "quantity", label: t("quantity"), value: quantity }] : []),
          { id: "value", label: t("executedValue"), value: (value ?? 0).toLocaleString() },
          { id: "cash", label: t("cashEffect"), value: mode === InvestmentFormMode.CONVERSION || mode === InvestmentFormMode.VALUATION ? t("none") : t("oneLedgerMovement") },
        ]} />
      ) : (
        <>
          {mode === InvestmentFormMode.CONVERSION ? <><LabeledSelect label={t("source")} value={sourceId} options={holdingOptions} onChange={(event) => { const next = event.target.value; setSourceId(next); if (next === destinationId) setDestinationId(holdings.find((item) => item.id !== next)?.id ?? ""); }} /><LabeledSelect label={t("destination")} value={destinationId} options={holdings.filter((item) => item.id !== sourceId).map((item) => ({ id: item.id, label: item.symbol || item.name }))} onChange={(event) => setDestinationId(event.target.value)} /></> : null}
          {showQuantity ? <TextField id="investment-operation-quantity" label={t("quantity")} inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} /> : null}
          {mode === InvestmentFormMode.CONVERSION ? <TextField id="investment-destination-quantity" label={t("destinationQuantity")} inputMode="decimal" value={destinationQuantity} onChange={(event) => setDestinationQuantity(event.target.value)} /> : null}
          <AmountField id="investment-operation-value" label={mode === InvestmentFormMode.VALUATION ? t("valuation") : t("executedValue")} value={value} onValueChange={setValue} />
          {showQuantity ? <AmountField id="investment-operation-quote" label={t("quotedValue")} value={quote} onValueChange={setQuote} /> : null}
          {showAccount ? <LabeledSelect label={t("account")} value={accountId} options={accountOptions} onChange={(event) => setAccountId(event.target.value)} /> : null}
          <LabeledDateInput label={t("effectiveDate")} value={date} onChange={(event) => setDate(event.target.value)} />
          <TextField id="investment-operation-notes" label={t("notes")} value={notes} onChange={(event) => setNotes(event.target.value)} />
          {showFee ? (
            <section className="flex flex-col gap-(--space-3) rounded-md border border-border-subtle bg-surface p-(--space-4)">
              <label className="flex min-h-11 items-center gap-(--space-2) text-sm text-text-primary">
                <input type="checkbox" checked={hasFee} onChange={(event) => setHasFee(event.target.checked)} />
                {t("addFee")}
              </label>
              {hasFee ? <>
                <LabeledSelect label={t("feeSourceLabel")} value={feeSource} options={feeSources} onChange={(event) => setFeeSource(event.target.value as InvestmentFeeSource)} />
                {feeSource === InvestmentFeeSource.CASH ? <AmountField id="investment-fee-amount" label={t("feeAmount")} value={feeAmount} onValueChange={setFeeAmount} /> : <TextField id="investment-fee-quantity" label={t("feeQuantity")} inputMode="decimal" value={feeQuantity} onChange={(event) => setFeeQuantity(event.target.value)} />}
                {feeSource === InvestmentFeeSource.OTHER_INVESTMENT ? <LabeledSelect label={t("feeHolding")} value={feeHoldingId} options={holdingOptions} onChange={(event) => setFeeHoldingId(event.target.value)} /> : null}
                <AmountField id="investment-fee-value" label={t("feeValue")} value={feeValue} onValueChange={setFeeValue} />
              </> : null}
            </section>
          ) : null}
        </>
      )}
      <BottomActionBar>
        {confirming ? <>
          <Button className="w-full" isPending={pending} onPress={submit} data-testid="investment-operation-confirm">{pending ? t("saving") : t("confirm")}</Button>
          <Button className="w-full" variant="secondary" onPress={() => setConfirming(false)}>{t("edit")}</Button>
        </> : <Button className="w-full" onPress={() => setConfirming(true)} data-testid="investment-operation-review">{t("review")}</Button>}
      </BottomActionBar>
    </div>
  );
}
