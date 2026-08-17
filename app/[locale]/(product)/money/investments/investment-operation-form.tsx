"use client";

import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  InvestmentAssetClass,
  InvestmentFeeSource,
  InvestmentFormMode,
  InvestmentIncomeKind,
  InvestmentValuationSource,
  INVESTMENT_OPERATION_TYPE_VALUES,
  INVESTMENT_CREATE_IDEMPOTENCY_KEY_PREFIX,
  investmentBuyInputSchema,
  investmentIncomeInputSchema,
  investmentSellInputSchema,
  investmentValuationInputSchema,
  assetConversionInputSchema,
  feeSchema,
  dateSchema,
  type InvestmentFormMode as InvestmentFormModeValue,
  type InvestmentHolding,
  type InvestmentErrorCode,
} from "@/modules/investments/application/client";
import { moneyInvestmentPath } from "@/modules/tenancy/application/app-path";
import {
  buildDisposalPreview,
  buildUnitPricePreview,
  normalizeAvailableQuantity,
} from "@/modules/investments/application/investment-operation-view-model";
import {
  investmentUxConfig,
  type InvestmentUxType,
} from "@/modules/investments/application/investment-ux";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/client";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import { DecimalField } from "@/shared/patterns/decimal-field";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { LabeledSelect } from "@/shared/patterns/labeled-native-field";
import { formatCurrency } from "@/shared/i18n/formatters";
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
const operationModes = [
  ...INVESTMENT_OPERATION_TYPE_VALUES,
  InvestmentFormMode.VALUATION,
] as const;
const quantityModes = new Set<InvestmentFormModeValue>([
  InvestmentFormMode.BUY,
  InvestmentFormMode.SELL,
  InvestmentFormMode.CONVERSION,
]);
const nullableNumber = z.number().finite().nullable();
const operationFormSchema = z
  .object({
    mode: z.enum(operationModes),
    quantity: z.string(),
    destinationQuantity: z.string(),
    value: nullableNumber,
    unitPrice: nullableNumber,
    quote: nullableNumber,
    accountId: z.string(),
    sourceId: z.string(),
    destinationId: z.string(),
    date: dateSchema,
    notes: z.string().trim().max(500),
    hasFee: z.boolean(),
    feeSource: z.enum(
      Object.values(InvestmentFeeSource) as [
        InvestmentFeeSource,
        ...InvestmentFeeSource[],
      ],
    ),
    feeAmount: nullableNumber,
    feeQuantity: z.string(),
    feeAsset: z.string().trim().max(40),
    feeValue: nullableNumber,
    feeHoldingId: z.string(),
  })
  .superRefine((value, context) => {
    const issue = (path: string) =>
      context.addIssue({ code: "custom", path: [path], message: "Invalid" });
    const positive = (field: "value" | "unitPrice" | "feeValue") => {
      const schema =
        field === "feeValue"
          ? feeSchema.shape.feeValueVnd
          : field === "value"
            ? investmentBuyInputSchema.shape.executedValueVnd
            : investmentSellInputSchema.shape.executedValueVnd;
      if (!schema.safeParse(value[field]).success) issue(field);
    };
    const quantity = (
      field: "quantity" | "destinationQuantity" | "feeQuantity",
    ) => {
      if (
        !investmentBuyInputSchema.shape.boughtQuantity.safeParse(value[field])
          .success
      )
        issue(field);
    };
    if (value.mode === InvestmentFormMode.BUY) {
      quantity("quantity");
      positive("value");
      if (!value.accountId) issue("accountId");
    }
    if (value.mode === InvestmentFormMode.SELL) {
      quantity("quantity");
      positive("unitPrice");
      if (!value.accountId) issue("accountId");
    }
    if (value.mode === InvestmentFormMode.CONVERSION) {
      if (
        !assetConversionInputSchema.shape.sourceQuantity.safeParse(
          value.quantity,
        ).success
      )
        issue("quantity");
      if (
        !assetConversionInputSchema.shape.destinationQuantity.safeParse(
          value.destinationQuantity,
        ).success
      )
        issue("destinationQuantity");
      if (
        !value.sourceId ||
        !value.destinationId ||
        value.sourceId === value.destinationId
      )
        issue("destinationId");
    }
    if (value.mode === InvestmentFormMode.INCOME) {
      if (
        !investmentIncomeInputSchema.shape.amountVnd.safeParse(value.value)
          .success
      )
        issue("value");
      if (!value.accountId) issue("accountId");
    }
    if (value.mode === InvestmentFormMode.VALUATION) {
      if (
        !investmentValuationInputSchema.shape.valueVnd.safeParse(
          value.unitPrice,
        ).success
      )
        issue("unitPrice");
    }
    if (value.hasFee) {
      positive("feeValue");
      const fee = feeSchema.safeParse({
        source: value.feeSource,
        amountVnd: value.feeAmount ?? undefined,
        quantity: value.feeQuantity || undefined,
        feeValueVnd: value.feeValue,
        feeAsset: value.feeAsset || null,
        holdingId: value.feeHoldingId || undefined,
        cashAccountId: value.accountId || undefined,
      });
      if (!fee.success) issue("feeValue");
    }
  });
type FormValues = z.input<typeof operationFormSchema>;
const createDefaultValues = (
  mode: InvestmentFormModeValue,
  holding: InvestmentHolding,
  holdings: InvestmentHolding[],
  accounts: AccountOption[],
) =>
  ({
    mode,
    quantity: "",
    destinationQuantity: "",
    value: null,
    unitPrice: null,
    quote: null,
    accountId: accounts[0]?.id ?? "",
    sourceId: holding.id,
    destinationId: holdings.find((item) => item.id !== holding.id)?.id ?? "",
    date: today(),
    notes: "",
    hasFee: false,
    feeSource: InvestmentFeeSource.CASH,
    feeAmount: null,
    feeQuantity: "",
    feeAsset: "",
    feeValue: null,
    feeHoldingId: holdings[0]?.id ?? "",
  }) satisfies FormValues;

export function InvestmentOperationForm({
  mode,
  holding,
  holdings,
  accounts,
}: Props) {
  const t = useTranslations("money.investments.operation");
  const locale = useLocale();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<InvestmentErrorCode | null>(null);
  const [pending, startTransition] = useTransition();
  const defaults = createDefaultValues(mode, holding, holdings, accounts);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(operationFormSchema),
    defaultValues: defaults,
  });
  const values = useWatch({ control });
  const ux = investmentUxConfig(holding.assetClass as InvestmentUxType);
  const accountsOptions = accounts.map((account) => ({
    id: account.id,
    label: account.name,
  }));
  const holdingOptions = holdings.map((item) => ({
    id: item.id,
    label: item.symbol || item.name,
  }));
  const showQuantity = quantityModes.has(mode);
  const showAccount =
    mode !== InvestmentFormMode.VALUATION &&
    mode !== InvestmentFormMode.CONVERSION;
  const showFee = showQuantity;
  const valuationPreview =
    mode === InvestmentFormMode.VALUATION
      ? buildUnitPricePreview({
          quantity: holding.quantity,
          unitPrice: values.unitPrice ?? null,
          costBasis: holding.remainingTotalCostBasis,
          manualTotalValue: holding.assetClass === InvestmentAssetClass.BOND,
        })
      : null;
  const disposalPreview =
    mode === InvestmentFormMode.SELL
      ? buildDisposalPreview({
          availableQuantity: holding.quantity,
          soldQuantity: values.quantity ?? "",
          executionPricePerUnit: values.unitPrice ?? null,
          remainingCostBasis: holding.remainingTotalCostBasis,
          feeAmount: values.feeValue ?? null,
          manualTotalValue: holding.assetClass === InvestmentAssetClass.BOND,
        })
      : null;
  const derivedValue =
    mode === InvestmentFormMode.VALUATION
      ? (valuationPreview?.totalValue ?? null)
      : mode === InvestmentFormMode.SELL
        ? (disposalPreview?.grossProceeds ?? null)
        : values.value;
  const money = (value: number | null | undefined) =>
    value == null
      ? t("unknown")
      : formatCurrency(value, DEFAULT_CURRENCY, locale, {
          maximumFractionDigits: 0,
        });
  const display = (value: number | null | undefined) =>
    value == null ? t("unknown") : value.toLocaleString();
  const fieldError = (field: keyof FormValues) =>
    errors[field] ? t("errors.invalid") : undefined;
  const feeSources = (
    mode === InvestmentFormMode.BUY
      ? [
          InvestmentFeeSource.CASH,
          InvestmentFeeSource.DESTINATION_ASSET,
          InvestmentFeeSource.OTHER_INVESTMENT,
        ]
      : mode === InvestmentFormMode.SELL
        ? [
            InvestmentFeeSource.CASH,
            InvestmentFeeSource.SOURCE_ASSET,
            InvestmentFeeSource.OTHER_INVESTMENT,
          ]
        : Object.values(InvestmentFeeSource)
  ).map((source) => ({ id: source, label: t(`feeSource.${source}`) }));

  const submit = handleSubmit((submitted) => {
    setError(null);
    const fee = submitted.hasFee
      ? [
          {
            source: submitted.feeSource,
            feeAsset: submitted.feeAsset || null,
            feeValueVnd: submitted.feeValue as number,
            ...(submitted.feeSource === InvestmentFeeSource.CASH
              ? {
                  amountVnd: submitted.feeAmount ?? undefined,
                  cashAccountId: submitted.accountId,
                }
              : {
                  quantity: submitted.feeQuantity,
                  holdingId:
                    submitted.feeSource === InvestmentFeeSource.OTHER_INVESTMENT
                      ? submitted.feeHoldingId
                      : undefined,
                }),
          },
        ]
      : [];
    const common = {
      effectiveDate: submitted.date,
      notes: submitted.notes || null,
      idempotencyKey: `${INVESTMENT_CREATE_IDEMPOTENCY_KEY_PREFIX}:${crypto.randomUUID()}`,
    };
    startTransition(async () => {
      let result;
      switch (mode) {
        case InvestmentFormMode.BUY:
          result = await recordInvestmentBuyAction({
            holdingId: holding.id,
            cashAccountId: submitted.accountId,
            boughtQuantity: submitted.quantity,
            executedValueVnd: submitted.value as number,
            quotedValueVnd: submitted.quote,
            fees: fee,
            ...common,
          });
          break;
        case InvestmentFormMode.SELL:
          result = await recordInvestmentSellAction({
            holdingId: holding.id,
            cashAccountId: submitted.accountId,
            soldQuantity: submitted.quantity,
            executedValueVnd: derivedValue as number,
            quotedValueVnd: submitted.quote,
            fees: fee,
            ...common,
          });
          break;
        case InvestmentFormMode.CONVERSION:
          result = await recordAssetConversionAction({
            sourceHoldingId: submitted.sourceId,
            destinationHoldingId: submitted.destinationId,
            sourceQuantity: submitted.quantity,
            destinationQuantity: submitted.destinationQuantity,
            executedValueVnd: submitted.value,
            quotedValueVnd: submitted.quote,
            fees: fee,
            ...common,
          });
          break;
        case InvestmentFormMode.INCOME:
          result = await recordInvestmentIncomeAction({
            holdingId: holding.id,
            cashAccountId: submitted.accountId,
            amountVnd: submitted.value as number,
            incomeKind:
              holding.assetClass === InvestmentAssetClass.FUND
                ? InvestmentIncomeKind.DISTRIBUTION
                : InvestmentIncomeKind.DIVIDEND,
            ...common,
          });
          break;
        case InvestmentFormMode.VALUATION:
          result = await recordInvestmentValuationAction({
            holdingId: holding.id,
            valueVnd: derivedValue as number,
            valuationDate: submitted.date,
            source: InvestmentValuationSource.MANUAL,
            notes: submitted.notes || null,
            idempotencyKey: common.idempotencyKey,
          });
          break;
      }
      if (!result.ok) {
        setError(result.code);
        return;
      }
      reset(defaults);
      router.replace(
        `${moneyInvestmentPath(result.receipt.sourceHoldingId ?? holding.id)}?receipt=${result.receipt.correlationId}`,
      );
    });
  });
  const review = () =>
    void handleSubmit(
      () => {
        setError(null);
        setConfirming(true);
      },
      () => setError("invalid"),
    )();

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid={`investment-operation-${mode}`}
    >
      {error ? (
        <StatusAlert variant="danger" title={t(`errors.${error}`)} />
      ) : null}
      {confirming ? (
        <ConfirmSummary
          data-testid="investment-operation-preview"
          rows={[
            {
              id: "holding",
              label: ux.instrumentLabel,
              value: holding.symbol || holding.name,
            },
            ...(showQuantity
              ? [
                  {
                    id: "quantity",
                    label: ux.quantityLabel,
                    value: values.quantity || t("unknown"),
                  },
                ]
              : []),
            {
              id: "value",
              label:
                mode === InvestmentFormMode.VALUATION
                  ? ux.valuationPriceLabel
                  : mode === InvestmentFormMode.SELL
                    ? ux.disposalPriceLabel
                    : ux.priceLabel,
              value: display(
                mode === InvestmentFormMode.VALUATION ||
                  mode === InvestmentFormMode.SELL
                  ? values.unitPrice
                  : values.value,
              ),
            },
            ...(valuationPreview
              ? [
                  {
                    id: "derived-value",
                    label: t("derivedCurrentValue"),
                    value: money(valuationPreview.totalValue),
                  },
                ]
              : []),
            ...(disposalPreview
              ? [
                  {
                    id: "gross",
                    label: t("grossProceeds"),
                    value: money(disposalPreview.grossProceeds),
                  },
                  {
                    id: "net",
                    label: t("netProceeds"),
                    value: money(disposalPreview.netProceeds),
                  },
                  {
                    id: "realized-pnl",
                    label: t("realizedPnl"),
                    value: money(disposalPreview.realizedPnl),
                  },
                ]
              : []),
            {
              id: "cash",
              label: t("cashEffect"),
              value:
                mode === InvestmentFormMode.CONVERSION ||
                mode === InvestmentFormMode.VALUATION
                  ? t("none")
                  : t("oneLedgerMovement"),
            },
          ]}
        />
      ) : (
        <>
          {mode === InvestmentFormMode.VALUATION ? (
            <section className="rounded-(--radius-card) border border-border-subtle bg-surface-muted p-(--space-4)">
              <div className="text-sm font-medium">
                {holding.symbol || holding.name}
              </div>
              <div className="mt-1 text-sm text-text-secondary">
                {holding.quantity} {ux.unitSuffix}
              </div>
            </section>
          ) : null}
          {mode === InvestmentFormMode.CONVERSION ? (
            <>
              <Controller
                name="sourceId"
                control={control}
                render={({ field }) => (
                  <LabeledSelect
                    label={t("source")}
                    value={field.value}
                    options={holdingOptions}
                    onChange={(event) => {
                      const next = event.target.value;
                      field.onChange(next);
                      if (next === values.destinationId)
                        setValue(
                          "destinationId",
                          holdings.find((item) => item.id !== next)?.id ?? "",
                        );
                    }}
                  />
                )}
              />
              <Controller
                name="destinationId"
                control={control}
                render={({ field }) => (
                  <LabeledSelect
                    label={t("destination")}
                    value={field.value}
                    options={holdings
                      .filter((item) => item.id !== values.sourceId)
                      .map((item) => ({
                        id: item.id,
                        label: item.symbol || item.name,
                      }))}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                )}
              />
            </>
          ) : null}
          {showQuantity ? (
            mode === InvestmentFormMode.SELL ? (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-(--space-2)">
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <DecimalField
                      id="investment-operation-quantity"
                      label={ux.quantityLabel}
                      value={field.value}
                      onValueChange={field.onChange}
                      error={fieldError("quantity")}
                    />
                  )}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11 px-(--space-3)"
                  onPress={() =>
                    setValue(
                      "quantity",
                      normalizeAvailableQuantity(holding.quantity),
                    )
                  }
                  aria-label={t("sellAllAccessible", {
                    quantity: holding.quantity,
                    unit: ux.unitSuffix,
                  })}
                >
                  {t("sellAll")}
                </Button>
              </div>
            ) : (
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <DecimalField
                    id="investment-operation-quantity"
                    label={ux.quantityLabel}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={fieldError("quantity")}
                  />
                )}
              />
            )
          ) : null}
          {mode === InvestmentFormMode.CONVERSION ? (
            <TextField
              id="investment-destination-quantity"
              label={t("destinationQuantity")}
              registration={register("destinationQuantity")}
              error={fieldError("destinationQuantity")}
            />
          ) : null}
          {mode === InvestmentFormMode.VALUATION ||
          mode === InvestmentFormMode.SELL ? (
            <ControlledField
              control={control}
              field={{
                type: "amount",
                name: "unitPrice",
                id: "investment-operation-unit-price",
                label:
                  mode === InvestmentFormMode.VALUATION
                    ? ux.valuationPriceLabel
                    : ux.disposalPriceLabel,
                description: `${ux.priceCurrency} / ${ux.unitSuffix}`,
                error: fieldError("unitPrice"),
              }}
            />
          ) : (
            <ControlledField
              control={control}
              field={{
                type: "amount",
                name: "value",
                id: "investment-operation-value",
                label: t("executedValue"),
                error: fieldError("value"),
              }}
            />
          )}
          {valuationPreview ? (
            <section
              data-testid="investment-valuation-live-preview"
              className="rounded-(--radius-card) border border-border-subtle bg-surface-muted p-(--space-4)"
              aria-live="polite"
            >
              <div className="flex justify-between text-sm">
                <span>{t("derivedCurrentValue")}</span>
                <span>{money(valuationPreview.totalValue)}</span>
              </div>
            </section>
          ) : null}
          {disposalPreview ? (
            <section
              data-testid="investment-disposal-live-preview"
              className="flex flex-col gap-(--space-2) rounded-(--radius-card) border border-border-subtle bg-surface-muted p-(--space-4)"
              aria-live="polite"
            >
              <div className="flex justify-between">
                <span>{t("grossProceeds")}</span>
                <span>{money(disposalPreview.grossProceeds)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("feesAndTax")}</span>
                <span>{display(disposalPreview.feeAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("netProceeds")}</span>
                <span>{money(disposalPreview.netProceeds)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("realizedPnl")}</span>
                <span>{money(disposalPreview.realizedPnl)}</span>
              </div>
            </section>
          ) : null}
          {showQuantity && mode !== InvestmentFormMode.SELL ? (
            <ControlledField
              control={control}
              field={{
                type: "amount",
                name: "quote",
                id: "investment-operation-quote",
                label: t("quotedValue"),
              }}
            />
          ) : null}
          {showAccount ? (
            <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
                <LabeledSelect
                  label={
                    mode === InvestmentFormMode.BUY
                      ? holding.assetClass === InvestmentAssetClass.CRYPTO
                        ? t("sourceAccountCrypto")
                        : t("sourceAccountBuy")
                      : mode === InvestmentFormMode.SELL
                        ? t("destinationAccountSell")
                        : t("account")
                  }
                  value={field.value}
                  options={accountsOptions}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              )}
            />
          ) : null}
          <ControlledField
            control={control}
            field={{
              type: "date",
              name: "date",
              id: "investment-operation-date",
              label: t("effectiveDate"),
              error: fieldError("date"),
            }}
          />
          <TextField
            id="investment-operation-notes"
            label={t("notes")}
            registration={register("notes")}
          />
          {showFee ? (
            <section className="flex flex-col gap-(--space-3) rounded-md border border-border-subtle bg-surface p-(--space-4)">
              <label className="flex min-h-11 items-center gap-(--space-2) text-sm">
                <input type="checkbox" {...register("hasFee")} />
                {t("addFee")}
              </label>
              {values.hasFee ? (
                <>
                  <Controller
                    name="feeSource"
                    control={control}
                    render={({ field }) => (
                      <LabeledSelect
                        label={t("feeSourceLabel")}
                        value={field.value}
                        options={feeSources}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    )}
                  />
                  {holding.assetClass === InvestmentAssetClass.CRYPTO ? (
                    <TextField
                      id="investment-fee-asset"
                      label={t("feeAssetLabel")}
                      registration={register("feeAsset")}
                    />
                  ) : null}
                  {values.feeSource === InvestmentFeeSource.CASH ? (
                  <ControlledField
                    control={control}
                    field={{
                      type: "amount",
                      name: "feeAmount",
                      id: "investment-fee-amount",
                      label: t("feeAmount"),
                    }}
                  />
                  ) : (
                    <TextField
                      id="investment-fee-quantity"
                      label={t("feeQuantity")}
                      registration={register("feeQuantity")}
                    />
                  )}
                  {values.feeSource === InvestmentFeeSource.OTHER_INVESTMENT ? (
                    <Controller
                      name="feeHoldingId"
                      control={control}
                      render={({ field }) => (
                        <LabeledSelect
                          label={t("feeHolding")}
                          value={field.value}
                          options={holdingOptions}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                        />
                      )}
                    />
                  ) : null}
                  <ControlledField
                    control={control}
                    field={{
                      type: "amount",
                      name: "feeValue",
                      id: "investment-fee-value",
                      label: t("feeValue"),
                      error: fieldError("feeValue"),
                    }}
                  />
                </>
              ) : null}
            </section>
          ) : null}
        </>
      )}
      <BottomActionBar>
        {confirming ? (
          <>
            <Button
              className="w-full"
              isPending={pending}
              onPress={() => void submit()}
              data-testid="investment-operation-confirm"
            >
              {pending
                ? t("saving")
                : mode === InvestmentFormMode.BUY
                  ? ux.purchaseAction
                  : mode === InvestmentFormMode.SELL
                    ? ux.disposalAction
                    : t("confirm")}
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onPress={() => setConfirming(false)}
            >
              {t("edit")}
            </Button>
          </>
        ) : (
          <Button
            className="w-full"
            onPress={review}
            data-testid="investment-operation-review"
          >
            {t("review")}
          </Button>
        )}
      </BottomActionBar>
    </div>
  );
}
