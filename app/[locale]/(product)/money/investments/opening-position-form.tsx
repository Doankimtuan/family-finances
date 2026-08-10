"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  APP_PATH,
  moneyInvestmentPath,
} from "@/modules/tenancy/application/app-path";
import {
  INVESTMENT_ASSET_CLASS_VALUES,
  InvestmentAssetClass,
  type InvestmentErrorCode,
} from "@/modules/investments/application/client";
import { TextField } from "@/shared/ui/form";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AmountField } from "@/shared/patterns/amount-field";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import {
  LabeledDateInput,
  LabeledSelect,
} from "@/shared/patterns/labeled-native-field";
import { createOpeningPositionAction } from "./investment-actions";

const today = () => new Date().toISOString().slice(0, 10);

export function OpeningPositionForm() {
  const t = useTranslations("money.investments.opening");
  const router = useRouter();
  const [assetName, setAssetName] = useState("");
  const [assetClass, setAssetClass] = useState<InvestmentAssetClass>(
    InvestmentAssetClass.CRYPTO,
  );
  const [symbol, setSymbol] = useState("");
  const [provider, setProvider] = useState("");
  const [quantity, setQuantity] = useState("");
  const [basis, setBasis] = useState<number | null>(null);
  const [valuation, setValuation] = useState<number | null>(null);
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<InvestmentErrorCode | null>(null);
  const [pending, startTransition] = useTransition();
  const assetOptions = useMemo(
    () =>
      INVESTMENT_ASSET_CLASS_VALUES.map((value) => ({
        id: value,
        label: t(`assetClass.${value}`),
      })),
    [t],
  );

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createOpeningPositionAction({
        assetName,
        assetClass,
        quantity,
        asOfDate: date,
        symbol: symbol || null,
        providerCustodian: provider || null,
        remainingTotalCostBasis: basis,
        currentValuation: valuation,
        notes: notes || null,
        idempotencyKey: `opening:${crypto.randomUUID()}`,
      });
      if (!result.ok) {
        setError(result.code);
        return;
      }
      router.replace(
        result.receipt.holdingId
          ? moneyInvestmentPath(result.receipt.holdingId)
          : APP_PATH.MONEY_INVESTMENTS,
      );
    });
  };

  return (
    <div className="flex flex-col gap-(--space-4)" data-testid="investment-opening-form">
      {error ? <StatusAlert variant="danger" title={t(`errors.${error}`)} /> : null}
      {confirming ? (
        <>
          <StatusAlert variant="info" title={t("noMoneyMovement")} />
          <ConfirmSummary
            data-testid="investment-opening-preview"
            rows={[
              { id: "asset", label: t("assetName"), value: assetName },
              { id: "quantity", label: t("quantity"), value: quantity },
              {
                id: "basis",
                label: t("basis"),
                value: basis == null ? t("unknown") : basis.toLocaleString(),
              },
              { id: "date", label: t("asOfDate"), value: date },
            ]}
          />
        </>
      ) : (
        <>
          <TextField id="investment-name" label={t("assetName")} value={assetName} onChange={(event) => setAssetName(event.target.value)} />
          <LabeledSelect label={t("assetClassLabel")} value={assetClass} options={assetOptions} onChange={(event) => setAssetClass(event.target.value as InvestmentAssetClass)} data-testid="investment-asset-class" />
          <TextField id="investment-symbol" label={t("symbol")} value={symbol} onChange={(event) => setSymbol(event.target.value)} />
          <TextField id="investment-provider" label={t("provider")} value={provider} onChange={(event) => setProvider(event.target.value)} />
          <TextField id="investment-quantity" label={t("quantity")} inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          <AmountField id="investment-basis" label={t("basis")} value={basis} onValueChange={setBasis} />
          <AmountField id="investment-valuation" label={t("valuation")} value={valuation} onValueChange={setValuation} />
          <LabeledDateInput label={t("asOfDate")} value={date} onChange={(event) => setDate(event.target.value)} />
          <label className="flex flex-col gap-(--space-1)">
            <span className="text-sm text-text-secondary">{t("notes")}</span>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </>
      )}
      <BottomActionBar>
        {confirming ? (
          <>
            <Button className="w-full" isPending={pending} onPress={submit} data-testid="investment-opening-confirm">{pending ? t("saving") : t("confirm")}</Button>
            <Button className="w-full" variant="secondary" onPress={() => setConfirming(false)}>{t("edit")}</Button>
          </>
        ) : (
          <Button className="w-full" onPress={() => setConfirming(true)} data-testid="investment-opening-review">{t("review")}</Button>
        )}
      </BottomActionBar>
    </div>
  );
}
