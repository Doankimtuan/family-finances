"use client";

import { useEffect, useState, useTransition } from "react";
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
  INVESTMENT_INPUT_CURRENCY_DEFAULT,
  INVESTMENT_INPUT_CURRENCY_VALUES,
  INVESTMENT_REPORTING_CURRENCY,
  INVESTMENT_ERROR_CODE,
  InvestmentInputCurrency,
  InvestmentInputRateSource,
  InvestmentInputRateStatus,
  INVESTMENT_OPERATION_TYPE_VALUES,
  INVESTMENT_CREATE_IDEMPOTENCY_KEY_PREFIX,
  positiveUnitPriceVndSchema,
  positiveVndSchema,
  unitPriceVndSchema,
  investmentBuyInputSchema,
  investmentIncomeInputSchema,
  investmentValuationInputSchema,
  assetConversionInputSchema,
  feeSchema,
  dateSchema,
  positiveInputMoneySchema,
  inputRateToVndSchema,
  type InvestmentFormMode as InvestmentFormModeValue,
  type InvestmentHolding,
  type InvestmentErrorCode,
} from "@/modules/investments/application/client";
import { moneyInvestmentPath } from "@/modules/tenancy/application/app-path";
import {
  buildDisposalPreview,
  buildPurchasePreview,
  buildUnitPricePreview,
  normalizeAvailableQuantity,
} from "@/modules/investments/application/investment-operation-view-model";
import {
  convertInvestmentInputUnitPriceToVnd,
  convertInvestmentInputValueToVnd,
  multiplyInvestmentInputQuantityByUnitPrice,
  type InvestmentInputCurrencyRate,
} from "@/modules/investments/application/investment-money";
import {
  investmentUxConfig,
  resolveInvestmentPricingContract,
  type InvestmentUxType,
} from "@/modules/investments/application/investment-ux";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/client";
import {
  CheckboxField,
  NumberField,
  SelectField,
  TextField,
} from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import { DecimalField } from "@/shared/patterns/decimal-field";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Sheet } from "@/shared/patterns/sheet";
import { formatCurrency, formatNumber } from "@/shared/i18n/formatters";
import {
  recordAssetConversionAction,
  recordInvestmentBuyAction,
  recordInvestmentIncomeAction,
  recordInvestmentSellAction,
  recordInvestmentValuationAction,
} from "./investment-actions";
import { getInvestmentInputCurrencyRateAction } from "./investment-input-currency-actions";
import { InvestmentValuationMeta } from "./investment-valuation-meta";

type AccountOption = { id: string; name: string; balance?: number };
type Props = {
  mode: InvestmentFormModeValue;
  holding: InvestmentHolding;
  holdings: InvestmentHolding[];
  accounts: AccountOption[];
  title: string;
};
const today = () => new Date().toISOString().slice(0, 10);
const CRYPTO_DECIMAL_DIGITS = 8;
const STANDARD_DECIMAL_DIGITS = 2;
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
    inputCurrency: z.enum(INVESTMENT_INPUT_CURRENCY_VALUES),
    inputRateToVnd: inputRateToVndSchema.nullable().optional(),
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
    const usesInputCurrency =
      value.inputCurrency !== InvestmentInputCurrency.VND;
    const positive = (field: "value" | "unitPrice" | "feeValue") => {
      const schema =
        field === "feeValue"
          ? usesInputCurrency
            ? positiveInputMoneySchema
            : feeSchema.shape.feeValueVnd
          : field === "value"
            ? usesInputCurrency
              ? positiveInputMoneySchema
              : positiveVndSchema
            : usesInputCurrency
              ? positiveInputMoneySchema
              : positiveUnitPriceVndSchema;
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
      if (
        !(usesInputCurrency
          ? positiveInputMoneySchema.safeParse(value.unitPrice).success
          : positiveUnitPriceVndSchema.safeParse(value.unitPrice).success) &&
        !(usesInputCurrency
          ? positiveInputMoneySchema.safeParse(value.value).success
          : positiveVndSchema.safeParse(value.value).success)
      )
        issue("unitPrice");
      if (!value.accountId) issue("accountId");
    }
    if (value.mode === InvestmentFormMode.SELL) {
      quantity("quantity");
      if (
        !(usesInputCurrency
          ? positiveInputMoneySchema.safeParse(value.unitPrice).success
          : positiveUnitPriceVndSchema.safeParse(value.unitPrice).success) &&
        !(usesInputCurrency
          ? positiveInputMoneySchema.safeParse(value.value).success
          : positiveVndSchema.safeParse(value.value).success)
      )
        issue("unitPrice");
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
        !(
          usesInputCurrency
            ? positiveInputMoneySchema
            : investmentIncomeInputSchema.shape.amountVnd
        ).safeParse(value.value).success
      )
        issue("value");
      if (!value.accountId) issue("accountId");
    }
    if (value.mode === InvestmentFormMode.VALUATION) {
      if (
        !(usesInputCurrency
          ? positiveInputMoneySchema.safeParse(value.unitPrice).success
          : unitPriceVndSchema.safeParse(value.unitPrice).success) &&
        !(usesInputCurrency
          ? positiveInputMoneySchema.safeParse(value.value).success
          : investmentValuationInputSchema.shape.totalValueVnd.safeParse(
              value.value,
            ).success)
      )
        issue("unitPrice");
    }
    if (value.hasFee) {
      positive("feeValue");
      const fee = feeSchema.safeParse({
        source: value.feeSource,
        ...(usesInputCurrency
          ? { inputAmount: value.feeAmount ?? undefined }
          : { amountVnd: value.feeAmount ?? undefined }),
        quantity: value.feeQuantity || undefined,
        ...(usesInputCurrency
          ? { inputFeeValue: value.feeValue }
          : { feeValueVnd: value.feeValue }),
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
    inputCurrency:
      holding.assetClass === InvestmentAssetClass.CRYPTO ||
      (mode === InvestmentFormMode.CONVERSION &&
        holdings.some(
          (item) => item.assetClass === InvestmentAssetClass.CRYPTO,
        ))
        ? INVESTMENT_INPUT_CURRENCY_DEFAULT
        : InvestmentInputCurrency.VND,
    inputRateToVnd: null,
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
  title,
}: Props) {
  const t = useTranslations("money.investments.operation");
  const tUx = useTranslations("money.investments");
  const locale = useLocale();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
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
  const quantity = useWatch({ control, name: "quantity" });
  const value = useWatch({ control, name: "value" });
  const unitPrice = useWatch({ control, name: "unitPrice" });
  const quote = useWatch({ control, name: "quote" });
  const destinationId = useWatch({ control, name: "destinationId" });
  const sourceId = useWatch({ control, name: "sourceId" });
  const hasFee = useWatch({ control, name: "hasFee" });
  const feeSource = useWatch({ control, name: "feeSource" });
  const feeAmount = useWatch({ control, name: "feeAmount" });
  const feeValue = useWatch({ control, name: "feeValue" });
  const inputCurrency = useWatch({ control, name: "inputCurrency" });
  const inputRateToVnd = useWatch({ control, name: "inputRateToVnd" });
  const sourceHolding = holdings.find((item) => item.id === sourceId);
  const destinationHolding = holdings.find((item) => item.id === destinationId);
  const hasCryptoLeg =
    holding.assetClass === InvestmentAssetClass.CRYPTO ||
    sourceHolding?.assetClass === InvestmentAssetClass.CRYPTO ||
    destinationHolding?.assetClass === InvestmentAssetClass.CRYPTO;
  const usesQuotedCurrency =
    hasCryptoLeg && inputCurrency !== InvestmentInputCurrency.VND;
  const [resolvedInputRate, setResolvedInputRate] = useState<{
    currency: InvestmentInputCurrency;
    rate: InvestmentInputCurrencyRate | null;
  } | null>(null);
  useEffect(() => {
    if (!hasCryptoLeg || inputCurrency === InvestmentInputCurrency.VND) return;
    let active = true;
    void getInvestmentInputCurrencyRateAction(inputCurrency).then((result) => {
      if (!active) return;
      setResolvedInputRate({ currency: inputCurrency, rate: result });
    });
    return () => {
      active = false;
    };
  }, [hasCryptoLeg, inputCurrency]);
  const inputRate =
    resolvedInputRate?.currency === inputCurrency
      ? resolvedInputRate.rate
      : null;
  const inputRateLoading =
    usesQuotedCurrency && resolvedInputRate?.currency !== inputCurrency;
  const effectiveInputRate = usesQuotedCurrency
    ? (inputRateToVnd ??
      (inputRate?.status === InvestmentInputRateStatus.CURRENT
        ? inputRate.rateToVnd
        : null))
    : 1;
  const needsManualInputRate =
    usesQuotedCurrency &&
    !inputRateLoading &&
    inputRate?.status !== InvestmentInputRateStatus.CURRENT &&
    inputRateToVnd == null;
  const inputRateSource = usesQuotedCurrency
    ? inputRateToVnd != null
      ? InvestmentInputRateSource.MANUAL
      : InvestmentInputRateSource.AUTOMATIC
    : InvestmentInputRateSource.IDENTITY;
  const ux = investmentUxConfig(holding.assetClass as InvestmentUxType);
  const pricingContract = resolveInvestmentPricingContract(
    holding.assetClass,
    holding.instrument ?? null,
  );
  const usesUnitPrice = !pricingContract.usesTotalValue;
  const executionAssetLabel =
    holding.instrument?.symbol || holding.symbol || holding.name;
  const purchasePriceLabel =
    holding.assetClass === InvestmentAssetClass.FUND
      ? tUx(ux.priceLabelKey)
      : t("purchasePrice", { asset: executionAssetLabel });
  const operationPriceLabel =
    mode === InvestmentFormMode.VALUATION
      ? tUx(ux.valuationPriceLabelKey)
      : mode === InvestmentFormMode.BUY
        ? purchasePriceLabel
        : tUx(ux.disposalPriceLabelKey);
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
  const unitPriceVnd =
    effectiveInputRate == null
      ? null
      : convertInvestmentInputUnitPriceToVnd(unitPrice, effectiveInputRate);
  const valueVnd =
    effectiveInputRate == null
      ? null
      : convertInvestmentInputValueToVnd(value, effectiveInputRate);
  const quoteVnd =
    effectiveInputRate == null
      ? null
      : convertInvestmentInputValueToVnd(quote, effectiveInputRate);
  const inputTransactionQuantity =
    mode === InvestmentFormMode.VALUATION ? holding.quantity : (quantity ?? "");
  const inputTransactionTotal = usesQuotedCurrency
    ? usesUnitPrice
      ? multiplyInvestmentInputQuantityByUnitPrice(
          inputTransactionQuantity,
          unitPrice,
        )
      : value
    : null;
  const feeAmountVnd =
    effectiveInputRate == null
      ? null
      : convertInvestmentInputValueToVnd(feeAmount, effectiveInputRate);
  const feeValueVnd =
    effectiveInputRate == null
      ? null
      : convertInvestmentInputValueToVnd(feeValue, effectiveInputRate);
  const valuationPreview =
    mode === InvestmentFormMode.VALUATION
      ? buildUnitPricePreview({
          quantity: holding.quantity,
          unitPrice: usesUnitPrice ? unitPriceVnd : valueVnd,
          costBasis: holding.remainingTotalCostBasis,
          manualTotalValue: pricingContract.usesTotalValue,
        })
      : null;
  const disposalPreview =
    mode === InvestmentFormMode.SELL
      ? buildDisposalPreview({
          availableQuantity: holding.quantity,
          soldQuantity: quantity ?? "",
          executionPricePerUnit: usesUnitPrice ? unitPriceVnd : valueVnd,
          remainingCostBasis: holding.remainingTotalCostBasis,
          cashFeeAmount: hasFee ? feeAmountVnd : null,
          feeValue: hasFee ? feeValueVnd : null,
          manualTotalValue: pricingContract.usesTotalValue,
          accountingMethod: holding.accountingMethod,
          lots: holding.lots,
        })
      : null;
  const remainingUnitsText =
    disposalPreview?.remainingQuantity != null
      ? `${formatNumber(Number(disposalPreview.remainingQuantity), locale, {
          maximumFractionDigits:
            holding.assetClass === InvestmentAssetClass.CRYPTO
              ? CRYPTO_DECIMAL_DIGITS
              : STANDARD_DECIMAL_DIGITS,
        })} ${tUx(ux.unitSuffixKey)}`
      : null;
  const purchasePreview =
    mode === InvestmentFormMode.BUY
      ? buildPurchasePreview({
          quantity: quantity ?? "",
          executionPricePerUnit: usesUnitPrice ? unitPriceVnd : null,
          totalValue: usesUnitPrice ? null : valueVnd,
          cashFeeAmount: hasFee ? feeAmountVnd : null,
          feeValue: hasFee ? feeValueVnd : null,
          manualTotalValue: pricingContract.usesTotalValue,
        })
      : null;
  const accountId = useWatch({ control, name: "accountId" });
  const selectedAccount = accounts.find((account) => account.id === accountId);
  const insufficientBuyBalance =
    mode === InvestmentFormMode.BUY &&
    purchasePreview?.cashLeavingAccount != null &&
    selectedAccount?.balance != null &&
    purchasePreview.cashLeavingAccount > selectedAccount.balance;
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
  const inputCurrencyOptions = INVESTMENT_INPUT_CURRENCY_VALUES.map(
    (value) => ({
      id: value,
      label: value,
    }),
  );
  const inputRateDescription =
    effectiveInputRate == null
      ? null
      : `${formatNumber(effectiveInputRate, locale, {
          maximumFractionDigits: 8,
        })} ${INVESTMENT_REPORTING_CURRENCY}/${inputCurrency} · ${inputRateToVnd != null ? today() : (inputRate?.rateDate ?? t("unknown"))} · ${inputRateToVnd != null ? t("inputRateManual") : t("inputRateAutomatic")}`;
  const inputDisplay = (amount: number | null | undefined) =>
    amount == null
      ? t("unknown")
      : `${formatNumber(amount, locale, { maximumFractionDigits: 8 })} ${inputCurrency}`;

  const submit = handleSubmit((submitted) => {
    setError(null);
    if (needsManualInputRate) {
      setError(INVESTMENT_ERROR_CODE.CURRENCY_RATE_UNAVAILABLE);
      return;
    }
    if (!idempotencyKey) {
      setError("invalid");
      return;
    }
    const fee = submitted.hasFee
      ? [
          {
            source: submitted.feeSource,
            feeAsset: submitted.feeAsset || null,
            feeValueVnd: usesQuotedCurrency
              ? undefined
              : (submitted.feeValue as number),
            inputFeeValue: usesQuotedCurrency
              ? (submitted.feeValue as number)
              : undefined,
            ...(submitted.feeSource === InvestmentFeeSource.CASH
              ? {
                  amountVnd: usesQuotedCurrency
                    ? undefined
                    : (submitted.feeAmount ?? undefined),
                  inputAmount: usesQuotedCurrency
                    ? (submitted.feeAmount ?? undefined)
                    : undefined,
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
      idempotencyKey,
      inputCurrency: hasCryptoLeg ? inputCurrency : InvestmentInputCurrency.VND,
      inputRateToVnd: hasCryptoLeg ? effectiveInputRate : 1,
      inputRateSource: hasCryptoLeg
        ? inputRateSource
        : InvestmentInputRateSource.IDENTITY,
    };
    startTransition(async () => {
      let result;
      switch (mode) {
        case InvestmentFormMode.BUY:
          result = await recordInvestmentBuyAction({
            holdingId: holding.id,
            cashAccountId: submitted.accountId,
            boughtQuantity: submitted.quantity,
            unitPriceVnd: usesUnitPrice ? unitPriceVnd : null,
            totalValueVnd: usesUnitPrice ? null : valueVnd,
            quotedValueVnd: quoteVnd,
            inputUnitPrice: usesQuotedCurrency ? submitted.unitPrice : null,
            inputTotalValue: usesQuotedCurrency ? inputTransactionTotal : null,
            inputQuotedValue: usesQuotedCurrency ? submitted.quote : null,
            fees: fee,
            ...common,
          });
          break;
        case InvestmentFormMode.SELL:
          result = await recordInvestmentSellAction({
            holdingId: holding.id,
            cashAccountId: submitted.accountId,
            soldQuantity: submitted.quantity,
            unitPriceVnd: usesUnitPrice ? unitPriceVnd : null,
            totalValueVnd: usesUnitPrice ? null : valueVnd,
            quotedValueVnd: quoteVnd,
            inputUnitPrice: usesQuotedCurrency ? submitted.unitPrice : null,
            inputTotalValue: usesQuotedCurrency ? inputTransactionTotal : null,
            inputQuotedValue: usesQuotedCurrency ? submitted.quote : null,
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
            executedValueVnd: valueVnd,
            quotedValueVnd: quoteVnd,
            inputExecutedValue: usesQuotedCurrency ? submitted.value : null,
            inputQuotedValue: usesQuotedCurrency ? submitted.quote : null,
            fees: fee,
            ...common,
          });
          break;
        case InvestmentFormMode.INCOME:
          result = await recordInvestmentIncomeAction({
            holdingId: holding.id,
            cashAccountId: submitted.accountId,
            amountVnd: valueVnd as number,
            inputAmount: usesQuotedCurrency ? submitted.value : null,
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
            unitPriceVnd: usesUnitPrice ? unitPriceVnd : null,
            totalValueVnd: usesUnitPrice ? null : valueVnd,
            inputUnitPrice: usesQuotedCurrency ? submitted.unitPrice : null,
            inputTotalValue: usesQuotedCurrency ? inputTransactionTotal : null,
            inputCurrency: common.inputCurrency,
            inputRateToVnd: common.inputRateToVnd,
            inputRateSource: common.inputRateSource,
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
      setIdempotencyKey(null);
      router.replace(
        `${moneyInvestmentPath(result.receipt.sourceHoldingId ?? holding.id)}?receipt=${result.receipt.correlationId}`,
      );
    });
  });
  const review = () =>
    void handleSubmit(
      () => {
        if (needsManualInputRate) {
          setError(INVESTMENT_ERROR_CODE.CURRENCY_RATE_UNAVAILABLE);
          return;
        }
        if (insufficientBuyBalance) {
          setError("invalid");
          return;
        }
        if (
          mode === InvestmentFormMode.SELL &&
          !disposalPreview?.remainingQuantity
        ) {
          setError("insufficient_quantity");
          return;
        }
        setError(null);
        setIdempotencyKey(
          (current) =>
            current ??
            `${INVESTMENT_CREATE_IDEMPOTENCY_KEY_PREFIX}:${crypto.randomUUID()}`,
        );
        setConfirming(true);
      },
      () => setError("invalid"),
    )();

  return (
    <ActionSheetLayout>
      <ActionSheetLayout.Header>
        <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
          {title}
        </Sheet.Heading>
      </ActionSheetLayout.Header>
      <ActionSheetLayout.Body className="flex flex-col gap-(--space-4)">
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
                  label: tUx(ux.instrumentLabelKey),
                  value: holding.symbol || holding.name,
                },
                ...(showQuantity
                  ? [
                      {
                        id: "quantity",
                        label: tUx(ux.quantityLabelKey),
                        value: quantity || t("unknown"),
                      },
                    ]
                  : []),
                {
                  id: "value",
                  label:
                    mode === InvestmentFormMode.VALUATION
                      ? tUx(ux.valuationPriceLabelKey)
                      : mode === InvestmentFormMode.SELL
                        ? tUx(ux.disposalPriceLabelKey)
                        : purchasePriceLabel,
                  value: usesQuotedCurrency
                    ? inputDisplay(usesUnitPrice ? unitPrice : value)
                    : display(usesUnitPrice ? unitPrice : value),
                },
                ...(hasCryptoLeg &&
                mode !== InvestmentFormMode.CONVERSION &&
                inputTransactionTotal != null
                  ? [
                      {
                        id: "input-total",
                        label: t("inputTotalValue", {
                          currency: inputCurrency,
                        }),
                        value: inputDisplay(inputTransactionTotal),
                      },
                    ]
                  : []),
                ...(hasCryptoLeg
                  ? [
                      {
                        id: "input-rate",
                        label: t("inputRate", { currency: inputCurrency }),
                        value:
                          inputRateDescription ?? t("inputRateUnavailable"),
                      },
                    ]
                  : []),
                ...(purchasePreview
                  ? [
                      {
                        id: "invested-principal",
                        label: t("investedPrincipal"),
                        value: money(purchasePreview.investedPrincipal),
                      },
                      {
                        id: "buy-fee",
                        label: t("feeValue"),
                        value: money(purchasePreview.feeValue),
                      },
                      {
                        id: "cash-leaving",
                        label: t("cashLeavingAccount"),
                        value: money(purchasePreview.cashLeavingAccount),
                      },
                    ]
                  : []),
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
                      ...(remainingUnitsText != null
                        ? [
                            {
                              id: "remaining-units",
                              label: t("remainingUnitsLabel"),
                              value: remainingUnitsText,
                            },
                          ]
                        : []),
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
                <section className="flex flex-col gap-(--space-2) rounded-(--radius-card) border border-border-subtle bg-surface-muted p-(--space-4)">
                  <div className="text-sm font-medium">
                    {holding.symbol || holding.name}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {holding.quantity} {tUx(ux.unitSuffixKey)}
                  </div>
                  <InvestmentValuationMeta holding={holding} variant="inline" />
                </section>
              ) : null}
              {mode === InvestmentFormMode.CONVERSION ? (
                <>
                  <Controller
                    name="sourceId"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        id="investment-operation-source"
                        label={t("source")}
                        value={field.value}
                        options={holdingOptions}
                        onChange={(next) => {
                          field.onChange(next);
                          setResolvedInputRate(null);
                          if (next === destinationId)
                            setValue(
                              "destinationId",
                              holdings.find((item) => item.id !== next)?.id ??
                                "",
                            );
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="destinationId"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        id="investment-operation-destination"
                        label={t("destination")}
                        value={field.value}
                        options={holdings
                          .filter((item) => item.id !== sourceId)
                          .map((item) => ({
                            id: item.id,
                            label: item.symbol || item.name,
                          }))}
                        onChange={(next) => {
                          field.onChange(next);
                          setResolvedInputRate(null);
                        }}
                      />
                    )}
                  />
                </>
              ) : null}
              {hasCryptoLeg ? (
                <section className="flex flex-col gap-(--space-2)">
                  <Controller
                    name="inputCurrency"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        id="investment-operation-input-currency"
                        label={t("inputCurrencyLabel")}
                        value={field.value}
                        options={inputCurrencyOptions}
                        onChange={(next) => {
                          field.onChange(next);
                          setResolvedInputRate(null);
                          setValue("inputRateToVnd", null);
                        }}
                        data-testid="investment-operation-input-currency"
                      />
                    )}
                  />
                  {inputRateLoading ? (
                    <Text
                      className="text-sm text-text-secondary"
                      aria-live="polite"
                    >
                      {t("inputRateLoading")}
                    </Text>
                  ) : needsManualInputRate ? (
                    <StatusAlert
                      variant="warning"
                      title={
                        inputRate?.status === InvestmentInputRateStatus.STALE
                          ? t("inputRateStale")
                          : t("inputRateUnavailable")
                      }
                    />
                  ) : inputRateDescription ? (
                    <Text
                      className="text-sm text-text-secondary"
                      aria-live="polite"
                    >
                      {inputRateDescription}
                    </Text>
                  ) : null}
                  {usesQuotedCurrency &&
                  (needsManualInputRate || inputRateToVnd != null) ? (
                    <Controller
                      name="inputRateToVnd"
                      control={control}
                      render={({ field }) => (
                        <NumberField
                          id="investment-operation-input-rate"
                          label={t("inputRateManual")}
                          value={
                            typeof field.value === "number"
                              ? field.value
                              : undefined
                          }
                          onChange={field.onChange}
                          minValue={0}
                          step={0.00000001}
                          formatOptions={{
                            style: "decimal",
                            maximumFractionDigits: 8,
                          }}
                          description={t("inputRateHint")}
                          error={
                            errors.inputRateToVnd
                              ? t("errors.invalid")
                              : undefined
                          }
                        />
                      )}
                    />
                  ) : null}
                </section>
              ) : null}
              {mode === InvestmentFormMode.BUY ||
              mode === InvestmentFormMode.SELL ? (
                <section className="flex flex-col gap-(--space-2) rounded-(--radius-card) bg-surface-muted p-(--space-3)">
                  {holding.instrument?.autoPriceSupported ? (
                    <InvestmentValuationMeta holding={holding} />
                  ) : null}
                  <p className="text-sm text-text-secondary">
                    {t("marketPriceValuationOnly")}
                  </p>
                </section>
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
                          label={tUx(ux.quantityLabelKey)}
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
                        unit: tUx(ux.unitSuffixKey),
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
                        label={tUx(ux.quantityLabelKey)}
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
              {usesUnitPrice &&
              (mode === InvestmentFormMode.VALUATION ||
                mode === InvestmentFormMode.SELL ||
                mode === InvestmentFormMode.BUY) ? (
                usesQuotedCurrency ? (
                  <ControlledField
                    control={control}
                    field={{
                      type: "number",
                      name: "unitPrice",
                      id: "investment-operation-unit-price",
                      label: `${operationPriceLabel} (${inputCurrency})`,
                      description:
                        mode === InvestmentFormMode.VALUATION
                          ? `${inputCurrency} / ${tUx(ux.unitSuffixKey)}`
                          : `${t("actualExecutionPrice")} · ${inputCurrency} / ${tUx(ux.unitSuffixKey)}`,
                      minValue: 0,
                      step: 0.00000001,
                      formatOptions: {
                        style: "decimal",
                        maximumFractionDigits: CRYPTO_DECIMAL_DIGITS,
                      },
                      error: fieldError("unitPrice"),
                    }}
                  />
                ) : (
                  <ControlledField
                    control={control}
                    field={{
                      type: "amount",
                      name: "unitPrice",
                      id: "investment-operation-unit-price",
                      label: operationPriceLabel,
                      description:
                        mode === InvestmentFormMode.VALUATION
                          ? `${tUx(ux.priceCurrencyKey)} / ${tUx(ux.unitSuffixKey)}`
                          : `${t("actualExecutionPrice")} · ${tUx(ux.priceCurrencyKey)} / ${tUx(ux.unitSuffixKey)}`,
                      error: fieldError("unitPrice"),
                    }}
                  />
                )
              ) : (
                <ControlledField
                  control={control}
                  field={{
                    type: usesQuotedCurrency ? "number" : "amount",
                    name: "value",
                    id: "investment-operation-value",
                    label: usesQuotedCurrency
                      ? `${t("executedValue")} (${inputCurrency})`
                      : t("executedValue"),
                    minValue: usesQuotedCurrency ? 0 : undefined,
                    step: usesQuotedCurrency ? 0.00000001 : undefined,
                    formatOptions: usesQuotedCurrency
                      ? {
                          style: "decimal",
                          maximumFractionDigits: CRYPTO_DECIMAL_DIGITS,
                        }
                      : undefined,
                    error: fieldError("value"),
                  }}
                />
              )}
              {purchasePreview ? (
                <section
                  data-testid="investment-buy-live-preview"
                  className="flex flex-col gap-(--space-2) rounded-(--radius-card) border border-border-subtle bg-surface-muted p-(--space-4)"
                  aria-live="polite"
                >
                  {usesQuotedCurrency ? (
                    <div className="flex justify-between gap-(--space-3)">
                      <span>
                        {t("inputTotalValue", { currency: inputCurrency })}
                      </span>
                      <FinancialValue>
                        {inputDisplay(inputTransactionTotal)}
                      </FinancialValue>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-(--space-3)">
                    <span>{t("investedPrincipal")}</span>
                    <FinancialValue>
                      {money(purchasePreview.investedPrincipal)}
                    </FinancialValue>
                  </div>
                  <div className="flex justify-between gap-(--space-3)">
                    <span>{t("feeValue")}</span>
                    <FinancialValue>
                      {money(purchasePreview.feeValue)}
                    </FinancialValue>
                  </div>
                  <div className="flex justify-between gap-(--space-3) font-medium">
                    <span>{t("cashLeavingAccount")}</span>
                    <FinancialValue>
                      {money(purchasePreview.cashLeavingAccount)}
                    </FinancialValue>
                  </div>
                  {insufficientBuyBalance ? (
                    <StatusAlert
                      variant="danger"
                      title={t("errors.insufficient_balance")}
                    />
                  ) : null}
                </section>
              ) : null}
              {valuationPreview ? (
                <section
                  data-testid="investment-valuation-live-preview"
                  className="rounded-(--radius-card) border border-border-subtle bg-surface-muted p-(--space-4)"
                  aria-live="polite"
                >
                  {usesQuotedCurrency ? (
                    <div className="flex justify-between text-sm">
                      <span>
                        {t("inputTotalValue", { currency: inputCurrency })}
                      </span>
                      <FinancialValue>
                        {inputDisplay(inputTransactionTotal)}
                      </FinancialValue>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-sm">
                    <span>{t("derivedCurrentValue")}</span>
                    <FinancialValue>
                      {money(valuationPreview.totalValue)}
                    </FinancialValue>
                  </div>
                </section>
              ) : null}
              {disposalPreview ? (
                <section
                  data-testid="investment-disposal-live-preview"
                  className="flex flex-col gap-(--space-2) rounded-(--radius-card) border border-border-subtle bg-surface-muted p-(--space-4)"
                  aria-live="polite"
                >
                  {usesQuotedCurrency ? (
                    <div className="flex justify-between">
                      <span>
                        {t("inputTotalValue", { currency: inputCurrency })}
                      </span>
                      <FinancialValue>
                        {inputDisplay(inputTransactionTotal)}
                      </FinancialValue>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span>{t("grossProceeds")}</span>
                    <FinancialValue>
                      {money(disposalPreview.grossProceeds)}
                    </FinancialValue>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("feesAndTax")}</span>
                    <FinancialValue>
                      {money(disposalPreview.feeValue)}
                    </FinancialValue>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("netProceeds")}</span>
                    <FinancialValue>
                      {money(disposalPreview.netProceeds)}
                    </FinancialValue>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("realizedPnl")}</span>
                    <FinancialValue>
                      {money(disposalPreview.realizedPnl)}
                    </FinancialValue>
                  </div>
                  {disposalPreview.remainingQuantity != null ? (
                    <div className="flex justify-between">
                      <span>{t("remainingUnitsLabel")}</span>
                      <FinancialValue>{remainingUnitsText}</FinancialValue>
                    </div>
                  ) : null}
                </section>
              ) : null}
              {showQuantity && mode !== InvestmentFormMode.SELL ? (
                <ControlledField
                  control={control}
                  field={{
                    type: usesQuotedCurrency ? "number" : "amount",
                    name: "quote",
                    id: "investment-operation-quote",
                    label: usesQuotedCurrency
                      ? `${t("quotedValue")} (${inputCurrency})`
                      : t("quotedValue"),
                    minValue: usesQuotedCurrency ? 0 : undefined,
                    step: usesQuotedCurrency ? 0.00000001 : undefined,
                    formatOptions: usesQuotedCurrency
                      ? {
                          style: "decimal",
                          maximumFractionDigits: CRYPTO_DECIMAL_DIGITS,
                        }
                      : undefined,
                  }}
                />
              ) : null}
              {showAccount ? (
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      id="investment-operation-account"
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
                      onChange={field.onChange}
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
                <section className="flex flex-col gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4)">
                  <CheckboxField
                    id="investment-fee-toggle"
                    label={t("addFee")}
                    checked={hasFee}
                    onChange={(event) =>
                      setValue("hasFee", event.target.checked)
                    }
                  />
                  {hasFee ? (
                    <>
                      <Controller
                        name="feeSource"
                        control={control}
                        render={({ field }) => (
                          <SelectField
                            id="investment-fee-source"
                            label={t("feeSourceLabel")}
                            value={field.value}
                            options={feeSources}
                            onChange={field.onChange}
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
                      {feeSource === InvestmentFeeSource.CASH ? (
                        <ControlledField
                          control={control}
                          field={{
                            type: usesQuotedCurrency ? "number" : "amount",
                            name: "feeAmount",
                            id: "investment-fee-amount",
                            label: usesQuotedCurrency
                              ? `${t("feeAmount")} (${inputCurrency})`
                              : t("feeAmount"),
                            minValue: usesQuotedCurrency ? 0 : undefined,
                            step: usesQuotedCurrency ? 0.00000001 : undefined,
                            formatOptions: usesQuotedCurrency
                              ? {
                                  style: "decimal",
                                  maximumFractionDigits: CRYPTO_DECIMAL_DIGITS,
                                }
                              : undefined,
                          }}
                        />
                      ) : (
                        <TextField
                          id="investment-fee-quantity"
                          label={t("feeQuantity")}
                          registration={register("feeQuantity")}
                        />
                      )}
                      {feeSource === InvestmentFeeSource.OTHER_INVESTMENT ? (
                        <Controller
                          name="feeHoldingId"
                          control={control}
                          render={({ field }) => (
                            <SelectField
                              id="investment-fee-holding"
                              label={t("feeHolding")}
                              value={field.value}
                              options={holdingOptions}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      ) : null}
                      <ControlledField
                        control={control}
                        field={{
                          type: usesQuotedCurrency ? "number" : "amount",
                          name: "feeValue",
                          id: "investment-fee-value",
                          label: usesQuotedCurrency
                            ? `${t("feeValue")} (${inputCurrency})`
                            : t("feeValue"),
                          minValue: usesQuotedCurrency ? 0 : undefined,
                          step: usesQuotedCurrency ? 0.00000001 : undefined,
                          formatOptions: usesQuotedCurrency
                            ? {
                                style: "decimal",
                                maximumFractionDigits: CRYPTO_DECIMAL_DIGITS,
                              }
                            : undefined,
                          error: fieldError("feeValue"),
                        }}
                      />
                    </>
                  ) : null}
                </section>
              ) : null}
            </>
          )}
        </div>
      </ActionSheetLayout.Body>
      <ActionSheetLayout.Footer>
        {confirming ? (
          <SheetActionFooter
            secondaryLabel={t("edit")}
            primaryLabel={
              pending
                ? t("saving")
                : mode === InvestmentFormMode.BUY
                  ? tUx(ux.purchaseActionKey)
                  : mode === InvestmentFormMode.SELL
                    ? tUx(ux.disposalActionKey)
                    : t("confirm")
            }
            onSecondary={() => {
              setConfirming(false);
              setIdempotencyKey(null);
            }}
            onPrimary={() => void submit()}
            isPending={pending}
            primaryTestId="investment-operation-confirm"
          />
        ) : (
          <Button
            className="w-full"
            onPress={review}
            isDisabled={Boolean(insufficientBuyBalance || needsManualInputRate)}
            data-testid="investment-operation-review"
          >
            {t("review")}
          </Button>
        )}
      </ActionSheetLayout.Footer>
    </ActionSheetLayout>
  );
}
