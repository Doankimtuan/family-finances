"use client";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  InvestmentAssetClass,
  InvestmentEntryMode,
  INVESTMENT_INPUT_CURRENCY_VALUES,
  INVESTMENT_INPUT_CURRENCY_DEFAULT,
  INVESTMENT_REPORTING_CURRENCY,
  InvestmentInputCurrency,
  InvestmentInputRateSource,
  InvestmentInputRateStatus,
  MarketPricingMode,
  MARKET_PRICING_MODE_VALUES,
  OPENING_POSITION_STEP_VALUES,
  INVESTMENT_CREATE_IDEMPOTENCY_KEY_PREFIX,
  INVESTMENT_ERROR_CODE,
  initialPurchaseInputSchema,
  inputMoneySchema,
  inputRateToVndSchema,
  openingPositionInputSchema,
  type InvestmentErrorCode,
} from "@/modules/investments/application/client";
import { GoldUnit, GOLD_UNIT_VALUES } from "@/modules/investments/domain";
import {
  investmentEntryModeMessageKeys,
  investmentUxConfig,
  resolveInvestmentPricingContract,
  type InvestmentUxType,
} from "@/modules/investments/application/investment-ux";
import type { MarketInstrument } from "@/modules/investments/application/investment-types";
import {
  buildHistoricalImportPreview,
  HistoricalBasisInputMode,
  HistoricalValuationInputMode,
} from "@/modules/investments/application/historical-import-view-model";
import { multiplyQuantityByUnitPrice } from "@/modules/investments/application/investment-operation-view-model";
import {
  convertInvestmentInputUnitPriceToVnd,
  convertInvestmentInputValueToVnd,
  multiplyInvestmentInputQuantityByUnitPrice,
  type InvestmentInputCurrencyRate,
} from "@/modules/investments/application/investment-money";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/client";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import {
  BottomActionBar,
  BottomActionBarLayout,
} from "@/shared/patterns/bottom-action-bar";
import { ChoiceTile } from "@/shared/patterns/choice-tile";
import { Progress } from "@/shared/ui/progress";
import { MotionStep, MotionStepDirection } from "@/shared/motion";
import { FormField, NumberField, SelectField } from "@/shared/ui/form";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { useOnlineStatus } from "@/shared/hooks/use-online-status";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { TextField } from "@/shared/ui/form";
import { Textarea } from "@/shared/ui/textarea";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { FinancialScopeField } from "@/shared/patterns/financial-scope-field";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { formatCurrency, formatNumber } from "@/shared/i18n/formatters";
import {
  createInitialPurchaseAction,
  createOpeningPositionAction,
} from "./investment-creation-actions";
import { getInvestmentInputCurrencyRateAction } from "./investment-input-currency-actions";
import { InstrumentPickerSheet } from "./instrument-picker-sheet";
import { OpeningAssetClassPicker } from "./opening-asset-class-picker";
import { OpeningReviewSection } from "./opening-review-section";
import { InvestmentFactRow, InvestmentFactsCard } from "./investment-facts";
import {
  APP_PATH,
  moneyInvestmentPath,
} from "@/modules/tenancy/application/app-path";

type AccountOption = { id: string; name: string; balance?: number };
type Props = { accounts?: AccountOption[] };

const FIRST_STEP_INDEX = 0;
const DETAILS_STEP_INDEX = 1;
const REVIEW_STEP_INDEX = 2;
const ZERO_AMOUNT = 0;
const ENTRY_MODES = [
  InvestmentEntryMode.HISTORICAL,
  InvestmentEntryMode.PURCHASE,
] as const;
const BASIS_MODES = [
  HistoricalBasisInputMode.PER_UNIT,
  HistoricalBasisInputMode.TOTAL,
] as const;

const openingPositionFormSchema = z
  .object({
    financialScope: openingPositionInputSchema.shape.financialScope,
    entryMode: z.enum(ENTRY_MODES),
    assetName: openingPositionInputSchema.shape.assetName,
    assetClass: openingPositionInputSchema.shape.assetClass,
    instrumentId: openingPositionInputSchema.shape.instrumentId,
    pricingMode: z.enum(MARKET_PRICING_MODE_VALUES),
    symbol: openingPositionInputSchema.shape.symbol,
    provider: openingPositionInputSchema.shape.providerCustodian,
    quantity: openingPositionInputSchema.shape.quantity,
    unit: z.enum(GOLD_UNIT_VALUES),
    basisInputMode: z.enum(BASIS_MODES),
    costPerUnit: inputMoneySchema.nullable().optional(),
    totalBasisInput: inputMoneySchema.nullable().optional(),
    currentUnitValuation: inputMoneySchema.nullable().optional(),
    inputCurrency: z.enum(INVESTMENT_INPUT_CURRENCY_VALUES),
    inputRateToVnd: inputRateToVndSchema.nullable().optional(),
    price: inputMoneySchema.nullable().optional(),
    totalPurchaseValue: inputMoneySchema.nullable().optional(),
    accountId: z
      .union([initialPurchaseInputSchema.shape.cashAccountId, z.literal("")])
      .optional(),
    date: openingPositionInputSchema.shape.asOfDate,
    notes: openingPositionInputSchema.shape.notes,
  })
  .superRefine((value, context) => {
    if (value.entryMode !== InvestmentEntryMode.PURCHASE) return;
    if (
      value.pricingMode === MarketPricingMode.TOTAL_VALUE
        ? value.totalPurchaseValue == null
        : value.price == null
    ) {
      context.addIssue({
        code: "custom",
        path: [
          value.pricingMode === MarketPricingMode.TOTAL_VALUE
            ? "totalPurchaseValue"
            : "price",
        ],
        message: "Required",
      });
    }
    if (!value.accountId) {
      context.addIssue({
        code: "custom",
        path: ["accountId"],
        message: "Required",
      });
    }
    if (
      value.assetClass === InvestmentAssetClass.CRYPTO &&
      value.inputCurrency !== InvestmentInputCurrency.VND &&
      value.inputRateToVnd != null &&
      value.inputRateToVnd <= 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["inputRateToVnd"],
        message: "Invalid",
      });
    }
  });

type OpeningPositionFormValues = z.input<typeof openingPositionFormSchema>;

const today = () => new Date().toISOString().slice(0, 10);

function formatSignedMoney(
  value: number | null,
  format: (amount: number | null) => string,
  unknownLabel: string,
) {
  if (value == null) return unknownLabel;
  return `${value > 0 ? "+" : ""}${format(value)}`;
}

function resolveOpeningConfirmLabel(input: {
  pending: boolean;
  isHistorical: boolean;
  savingLabel: string;
  importLabel: string;
  purchaseLabel: string;
}) {
  if (input.pending) return input.savingLabel;
  if (input.isHistorical) return input.importLabel;
  return input.purchaseLabel;
}

const createDefaultValues = (accounts: AccountOption[]) =>
  ({
    financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
    entryMode: InvestmentEntryMode.HISTORICAL,
    assetName: "",
    assetClass: InvestmentAssetClass.STOCK,
    instrumentId: null,
    pricingMode: MarketPricingMode.UNIT_PRICE,
    symbol: "",
    provider: "",
    quantity: "",
    unit: GoldUnit.CHI,
    basisInputMode: HistoricalBasisInputMode.PER_UNIT,
    costPerUnit: null,
    totalBasisInput: null,
    currentUnitValuation: null,
    price: null,
    totalPurchaseValue: null,
    accountId: accounts[0]?.id ?? undefined,
    date: today(),
    notes: "",
    inputCurrency: InvestmentInputCurrency.VND,
    inputRateToVnd: null,
  }) satisfies Partial<OpeningPositionFormValues>;

export function OpeningPositionForm({ accounts = [] }: Props) {
  const t = useTranslations("money.investments.opening");
  const tUx = useTranslations("money.investments");
  const locale = useLocale();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(FIRST_STEP_INDEX);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [error, setError] = useState<InvestmentErrorCode | null>(null);
  const [selectedInstrument, setSelectedInstrument] =
    useState<MarketInstrument | null>(null);
  const [resolvedInputRate, setResolvedInputRate] = useState<{
    currency: InvestmentInputCurrency;
    rate: InvestmentInputCurrencyRate | null;
  } | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const online = useOnlineStatus();
  const {
    control,
    register,
    handleSubmit,
    reset,
    resetField,
    setValue,
    formState: { errors },
  } = useForm<OpeningPositionFormValues>({
    resolver: zodResolver(openingPositionFormSchema),
    defaultValues: createDefaultValues(accounts),
  });
  const values = useWatch({ control });
  const {
    assetClass = InvestmentAssetClass.STOCK,
    entryMode = InvestmentEntryMode.HISTORICAL,
    assetName = "",
    provider = "",
    quantity = "",
    unit = GoldUnit.CHI,
    basisInputMode = HistoricalBasisInputMode.PER_UNIT,
    costPerUnit = null,
    totalBasisInput = null,
    currentUnitValuation = null,
    price = null,
    totalPurchaseValue = null,
    accountId,
    date = today(),
    financialScope = FINANCIAL_SCOPE.HOUSEHOLD,
    inputCurrency = InvestmentInputCurrency.VND,
    inputRateToVnd = null,
  } = values;
  const isCrypto = assetClass === InvestmentAssetClass.CRYPTO;
  const usesQuotedCurrency =
    isCrypto && inputCurrency !== InvestmentInputCurrency.VND;
  useEffect(() => {
    if (!isCrypto || inputCurrency === InvestmentInputCurrency.VND) return;
    let active = true;
    void getInvestmentInputCurrencyRateAction(inputCurrency).then((result) => {
      if (!active) return;
      setResolvedInputRate({ currency: inputCurrency, rate: result });
    });
    return () => {
      active = false;
    };
  }, [inputCurrency, isCrypto]);
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
  const config = investmentUxConfig(assetClass);
  const pricingContract = resolveInvestmentPricingContract(
    assetClass,
    selectedInstrument,
  );
  const historicalPreview = buildHistoricalImportPreview({
    quantity,
    basisInputMode,
    averageCostPerUnit:
      effectiveInputRate == null
        ? null
        : convertInvestmentInputUnitPriceToVnd(costPerUnit, effectiveInputRate),
    totalCostBasis:
      effectiveInputRate == null
        ? null
        : convertInvestmentInputValueToVnd(totalBasisInput, effectiveInputRate),
    currentUnitValuation:
      effectiveInputRate == null
        ? null
        : convertInvestmentInputUnitPriceToVnd(
            currentUnitValuation,
            effectiveInputRate,
          ),
    currentValuationInputMode: pricingContract.usesTotalValue
      ? HistoricalValuationInputMode.TOTAL
      : HistoricalValuationInputMode.PER_UNIT,
  });
  const gross = pricingContract.usesTotalValue
    ? effectiveInputRate == null
      ? null
      : convertInvestmentInputValueToVnd(totalPurchaseValue, effectiveInputRate)
    : quantity
      ? multiplyQuantityByUnitPrice(
          quantity,
          effectiveInputRate == null
            ? null
            : convertInvestmentInputUnitPriceToVnd(price, effectiveInputRate),
        )
      : null;
  const rawPurchaseTotal = pricingContract.usesTotalValue
    ? totalPurchaseValue
    : multiplyInvestmentInputQuantityByUnitPrice(quantity ?? "", price);

  const money = (value: number | null) =>
    value == null
      ? t("unknown")
      : formatCurrency(value, DEFAULT_CURRENCY, locale, {
          maximumFractionDigits: 0,
        });
  const quotedMoney = (value: number | null | undefined) =>
    value == null
      ? t("unknown")
      : `${formatNumber(value, locale, { maximumFractionDigits: 8 })} ${inputCurrency}`;

  const accountOptions = accounts.map((account) => ({
    id: account.id,
    label: account.name,
  }));

  const unitOptions = GOLD_UNIT_VALUES.map((value) => ({
    id: value,
    label: t(`units.${value}`),
  }));
  const inputCurrencyOptions = INVESTMENT_INPUT_CURRENCY_VALUES.map(
    (value) => ({
      id: value,
      label: value,
    }),
  );
  const quoteFormatOptions = {
    style: "decimal" as const,
    maximumFractionDigits: usesQuotedCurrency ? 8 : 0,
  };
  const inputCurrencyLabel = `${t("inputCurrencyLabel")} (${inputCurrency})`;
  const quotedLabel = (label: string) =>
    usesQuotedCurrency ? `${label} (${inputCurrency})` : label;
  const inputRateDescription =
    effectiveInputRate == null
      ? null
      : `${formatNumber(effectiveInputRate, locale, {
          maximumFractionDigits: 8,
        })} ${INVESTMENT_REPORTING_CURRENCY}/${inputCurrency} · ${inputRateToVnd != null ? today() : (inputRate?.rateDate ?? t("unknown"))} · ${inputRateToVnd != null ? t("inputRateManual") : t("inputRateAutomatic")}`;
  const rawHistoricalTotalBasis =
    basisInputMode === HistoricalBasisInputMode.PER_UNIT &&
    costPerUnit != null &&
    quantity
      ? multiplyInvestmentInputQuantityByUnitPrice(quantity, costPerUnit)
      : totalBasisInput;
  const rawHistoricalCurrentValuation = pricingContract.usesTotalValue
    ? currentUnitValuation
    : currentUnitValuation != null && quantity
      ? multiplyInvestmentInputQuantityByUnitPrice(
          quantity,
          currentUnitValuation,
        )
      : null;

  const setType = (next: InvestmentUxType) => {
    setValue("assetClass", next);
    setResolvedInputRate(null);
    setValue(
      "inputCurrency",
      next === InvestmentAssetClass.CRYPTO
        ? INVESTMENT_INPUT_CURRENCY_DEFAULT
        : InvestmentInputCurrency.VND,
    );
    setValue("inputRateToVnd", null);
    setValue(
      "pricingMode",
      next === InvestmentAssetClass.BOND
        ? MarketPricingMode.TOTAL_VALUE
        : MarketPricingMode.UNIT_PRICE,
    );
    setSelectedInstrument(null);
    resetField("assetName");
    resetField("instrumentId");
    resetField("symbol");
    resetField("provider");
    resetField("quantity");
    resetField("unit");
    resetField("basisInputMode");
    resetField("costPerUnit");
    resetField("totalBasisInput");
    resetField("currentUnitValuation");
    resetField("price");
    resetField("totalPurchaseValue");
  };

  const setInstrument = (instrument: MarketInstrument | null) => {
    setSelectedInstrument(instrument);
    setValue("instrumentId", instrument?.id ?? null);
    setValue(
      "pricingMode",
      instrument?.pricingMode ??
        (assetClass === InvestmentAssetClass.BOND
          ? MarketPricingMode.TOTAL_VALUE
          : MarketPricingMode.UNIT_PRICE),
    );
    if (instrument) setValue("symbol", "");
  };

  const goNext = () => {
    if (stepIndex === FIRST_STEP_INDEX) {
      setError(null);
      setDirection("forward");
      setStepIndex(DETAILS_STEP_INDEX);
      return;
    }
    void handleSubmit(
      () => {
        setError(null);
        setDirection("forward");
        setStepIndex(REVIEW_STEP_INDEX);
      },
      () => setError("invalid"),
    )();
  };

  const goBack = () => {
    setError(null);
    setDirection("backward");
    setStepIndex((value) => Math.max(value - 1, FIRST_STEP_INDEX));
  };

  const submit = handleSubmit((submitted) => {
    setError(null);
    if (needsManualInputRate) {
      setError(INVESTMENT_ERROR_CODE.CURRENCY_RATE_UNAVAILABLE);
      return;
    }
    const key =
      idempotencyKey ??
      `${INVESTMENT_CREATE_IDEMPOTENCY_KEY_PREFIX}:${crypto.randomUUID()}`;
    setIdempotencyKey(key);
    startTransition(async () => {
      const result =
        submitted.entryMode === InvestmentEntryMode.HISTORICAL
          ? await createOpeningPositionAction({
              financialScope,
              assetName: submitted.assetName,
              assetClass: submitted.assetClass,
              instrumentId: submitted.instrumentId ?? null,
              quantity: submitted.quantity,
              asOfDate: submitted.date,
              symbol: submitted.symbol || null,
              providerCustodian: submitted.provider || null,
              remainingTotalCostBasis: historicalPreview.totalCostBasis,
              currentValuation: historicalPreview.currentTotalValue,
              inputCurrency: submitted.inputCurrency,
              inputRemainingTotalCostBasis: usesQuotedCurrency
                ? rawHistoricalTotalBasis
                : null,
              inputCurrentValuation: usesQuotedCurrency
                ? rawHistoricalCurrentValuation
                : null,
              inputRateToVnd: usesQuotedCurrency
                ? (submitted.inputRateToVnd ?? inputRate?.rateToVnd ?? null)
                : 1,
              inputRateSource,
              notes: submitted.notes || null,
              idempotencyKey: key,
            })
          : await createInitialPurchaseAction({
              financialScope,
              assetName: submitted.assetName,
              assetClass: submitted.assetClass,
              instrumentId: submitted.instrumentId ?? null,
              quantity: submitted.quantity,
              unitPriceVnd: pricingContract.usesTotalValue
                ? null
                : usesQuotedCurrency
                  ? null
                  : (submitted.price ?? ZERO_AMOUNT),
              totalValueVnd: pricingContract.usesTotalValue
                ? usesQuotedCurrency
                  ? null
                  : (submitted.totalPurchaseValue ?? ZERO_AMOUNT)
                : null,
              inputCurrency: submitted.inputCurrency,
              inputUnitPrice:
                usesQuotedCurrency && !pricingContract.usesTotalValue
                  ? submitted.price
                  : null,
              inputTotalValue:
                usesQuotedCurrency && pricingContract.usesTotalValue
                  ? submitted.totalPurchaseValue
                  : usesQuotedCurrency
                    ? multiplyInvestmentInputQuantityByUnitPrice(
                        submitted.quantity,
                        submitted.price,
                      )
                    : null,
              inputRateToVnd: usesQuotedCurrency
                ? (submitted.inputRateToVnd ?? inputRate?.rateToVnd ?? null)
                : 1,
              inputRateSource,
              cashAccountId: submitted.accountId ?? "",
              asOfDate: submitted.date,
              symbol: submitted.symbol || null,
              providerCustodian: submitted.provider || null,
              fees: [],
              notes: submitted.notes || null,
              idempotencyKey: key,
            });
      if (!result.ok) {
        setError(result.code);
        return;
      }
      reset(createDefaultValues(accounts));
      setSelectedInstrument(null);
      setIdempotencyKey(null);
      router.replace(
        result.receipt.holdingId
          ? moneyInvestmentPath(result.receipt.holdingId)
          : APP_PATH.MONEY_INVESTMENTS,
      );
    });
  });

  const quantityDisplay = `${quantity || t("unknown")}${
    assetClass === InvestmentAssetClass.GOLD ? ` ${t(`units.${unit}`)}` : ""
  }`;
  const holdingName = assetName || t("unnamedAsset");
  const trackedAssetLabel = selectedInstrument
    ? `${t("trackedAsset")}: ${selectedInstrument.symbol} — ${selectedInstrument.name}`
    : undefined;
  const isHistoricalEntry = entryMode === InvestmentEntryMode.HISTORICAL;
  const confirmLabel = resolveOpeningConfirmLabel({
    pending,
    isHistorical: isHistoricalEntry,
    savingLabel: t("saving"),
    importLabel: t("confirmImport"),
    purchaseLabel: t("confirmAction", {
      action: tUx(config.purchaseActionKey).toLowerCase(),
    }),
  });
  const reviewFacts = [
    { label: t("quantityLabel"), value: quantityDisplay },
    { label: t("providerLabel"), value: provider || t("unknown") },
    { label: t("dateLabel"), value: date },
  ];
  const historicalSideFacts = [
    ...(usesQuotedCurrency
      ? [
          {
            label: t("inputCurrencyLabel"),
            value: (
              <FinancialValue>
                {quotedMoney(rawHistoricalTotalBasis)}
              </FinancialValue>
            ),
          },
        ]
      : []),
    {
      label: t("remainingBasisOptional"),
      value: (
        <FinancialValue>
          {money(historicalPreview.totalCostBasis)}
        </FinancialValue>
      ),
    },
    {
      label: t("pricePerUnitLabel"),
      value: (
        <FinancialValue>
          {money(historicalPreview.averageCostPerUnit)}
        </FinancialValue>
      ),
    },
    {
      label: t("currentValuationOptional"),
      value: (
        <FinancialValue>
          {money(historicalPreview.currentTotalValue)}
        </FinancialValue>
      ),
    },
    {
      label: t("estimatedPnl"),
      value: (
        <FinancialValue>
          {formatSignedMoney(
            historicalPreview.unrealizedPnl,
            money,
            t("unknown"),
          )}
        </FinancialValue>
      ),
    },
    ...(usesQuotedCurrency
      ? [
          {
            label: t("inputRate", { currency: inputCurrency }),
            value: inputRateDescription ?? t("inputRateUnavailable"),
          },
        ]
      : []),
  ];
  const purchaseUnitPrice = usesQuotedCurrency
    ? quotedMoney(price)
    : money(price);
  const purchaseSideFacts = [
    {
      label: t("pricePerUnitLabel"),
      value: <FinancialValue>{purchaseUnitPrice}</FinancialValue>,
    },
    ...(usesQuotedCurrency
      ? [
          {
            label: t("inputTotalValue", { currency: inputCurrency }),
            value: (
              <FinancialValue>{quotedMoney(rawPurchaseTotal)}</FinancialValue>
            ),
          },
        ]
      : []),
    {
      label: t("totalCashNeeded"),
      value: <FinancialValue>{money(gross)}</FinancialValue>,
    },
    ...(usesQuotedCurrency
      ? [
          {
            label: t("inputRate", { currency: inputCurrency }),
            value: inputRateDescription ?? t("inputRateUnavailable"),
          },
        ]
      : []),
    {
      label: t("fromAccount"),
      value:
        accounts.find((account) => account.id === accountId)?.name ||
        t("unknown"),
    },
  ];
  const reviewHeroLabel = isHistoricalEntry
    ? t("reviewHeroValue")
    : t("reviewHeroPurchase");
  const reviewHeroAmount = isHistoricalEntry
    ? money(historicalPreview.currentTotalValue)
    : money(gross);
  const reviewSideTitle = isHistoricalEntry
    ? t("historicalCardTitle")
    : t("purchaseCardTitle");
  const reviewSideSubtitle = isHistoricalEntry
    ? t("historicalCardSubtitle")
    : undefined;
  const reviewSideFacts = isHistoricalEntry
    ? historicalSideFacts
    : purchaseSideFacts;
  const hasBackAction = stepIndex > FIRST_STEP_INDEX;
  const isReviewStep = stepIndex === REVIEW_STEP_INDEX;
  const primaryActionClassName = hasBackAction
    ? "min-h-11 min-w-0 flex-[1.6]"
    : "min-h-11 w-full";

  return (
    <div
      className="flex min-h-full flex-col gap-(--space-4)"
      data-testid="investment-opening-form"
    >
      <MoneyOfflineBanner />
      {error ? (
        <StatusAlert variant="danger" title={t(`errors.${error}`)} />
      ) : null}
      <div
        className="flex flex-col gap-(--space-2)"
        data-testid="investment-step-indicator"
      >
        <Progress
          value={stepIndex + 1}
          max={OPENING_POSITION_STEP_VALUES.length}
          label={t("stepOf", {
            current: stepIndex + 1,
            total: OPENING_POSITION_STEP_VALUES.length,
          })}
          showLabel={false}
        />
        <Text size="xs" tone="secondary" weight="medium">
          {t("stepOf", {
            current: stepIndex + 1,
            total: OPENING_POSITION_STEP_VALUES.length,
          })}
        </Text>
      </div>
      <MotionStep
        stepKey={OPENING_POSITION_STEP_VALUES[stepIndex]}
        direction={
          direction === "forward"
            ? MotionStepDirection.FORWARD
            : MotionStepDirection.BACKWARD
        }
      >
        {stepIndex === FIRST_STEP_INDEX ? (
          <section
            className="flex flex-col gap-(--space-5)"
            aria-labelledby="investment-type-title"
          >
            <div className="space-y-(--space-1)">
              <Text
                as="div"
                role="heading"
                aria-level={1}
                size="lg"
                weight="semibold"
                id="investment-type-title"
              >
                {t("stepQuestion")}
              </Text>
              <Text size="sm" tone="secondary">
                {t("stepQuestionDescription")}
              </Text>
            </div>
            <OpeningAssetClassPicker selected={assetClass} onSelect={setType} />
            <FinancialScopeField
              value={financialScope}
              onChange={(next) => setValue("financialScope", next)}
              testId="investment-financial-scope"
            />
          </section>
        ) : stepIndex === DETAILS_STEP_INDEX ? (
          <section
            className="flex flex-col gap-(--space-5)"
            aria-labelledby="investment-details-title"
          >
            <div className="space-y-(--space-1)">
              <Text
                as="div"
                role="heading"
                aria-level={1}
                size="lg"
                weight="semibold"
                id="investment-details-title"
              >
                {tUx(config.titleKey)}
              </Text>
              <Text size="sm" tone="secondary">
                {tUx(config.descriptionKey)}
              </Text>
            </div>
            <div
              className="grid gap-(--space-2)"
              role="radiogroup"
              aria-labelledby="investment-details-title"
            >
              <ChoiceTile
                selected={entryMode === InvestmentEntryMode.HISTORICAL}
                role="radio"
                onPress={() =>
                  setValue("entryMode", InvestmentEntryMode.HISTORICAL)
                }
                testId="investment-entry-mode-historical"
              >
                <span className="flex min-w-0 flex-col gap-(--space-1) py-(--space-1)">
                  <Text size="sm" weight="medium">
                    {tUx(
                      investmentEntryModeMessageKeys[
                        InvestmentEntryMode.HISTORICAL
                      ],
                    )}
                  </Text>
                  <Text
                    size="xs"
                    tone="secondary"
                    className="text-pretty leading-snug"
                  >
                    {t("historicalModeSubtitle")}
                  </Text>
                </span>
              </ChoiceTile>
              <ChoiceTile
                selected={entryMode === InvestmentEntryMode.PURCHASE}
                role="radio"
                onPress={() =>
                  setValue("entryMode", InvestmentEntryMode.PURCHASE)
                }
                testId="investment-entry-mode-purchase"
              >
                <span className="flex min-w-0 flex-col gap-(--space-1) py-(--space-1)">
                  <Text size="sm" weight="medium">
                    {tUx(
                      investmentEntryModeMessageKeys[
                        InvestmentEntryMode.PURCHASE
                      ],
                    )}
                  </Text>
                  <Text
                    size="xs"
                    tone="secondary"
                    className="text-pretty leading-snug"
                  >
                    {t("purchaseModeSubtitle")}
                  </Text>
                </span>
              </ChoiceTile>
            </div>
            <div className="flex flex-col gap-(--space-3)">
              <TextField
                id="investment-name"
                label={t("holdingName")}
                registration={register("assetName")}
                error={errors.assetName ? t("errors.invalid") : undefined}
              />
              <div className="flex flex-col gap-(--space-2)">
                <InstrumentPickerSheet
                  assetClass={assetClass}
                  selected={selectedInstrument}
                  onSelect={setInstrument}
                />
                <Text size="sm" tone="secondary" aria-live="polite">
                  {selectedInstrument
                    ? selectedInstrument.autoPriceSupported
                      ? t("automaticPricing")
                      : t("automaticPricingUnavailable")
                    : t("manualPricing")}
                </Text>
              </div>
              {!selectedInstrument &&
              assetClass !== InvestmentAssetClass.GOLD &&
              assetClass !== InvestmentAssetClass.BOND ? (
                <TextField
                  id="investment-symbol"
                  label={
                    assetClass === InvestmentAssetClass.FUND
                      ? t("fundSymbol")
                      : t("symbolLabel")
                  }
                  registration={register("symbol")}
                  error={errors.symbol ? t("errors.invalid") : undefined}
                />
              ) : null}
              <TextField
                id="investment-provider"
                label={tUx(config.providerHintKey)}
                registration={register("provider")}
                error={errors.provider ? t("errors.invalid") : undefined}
              />
              <ControlledField
                control={control}
                field={{
                  type: "decimal",
                  name: "quantity",
                  id: "investment-quantity",
                  label: tUx(config.quantityLabelKey),
                  error: errors.quantity ? t("errors.invalid") : undefined,
                }}
              />
              {isCrypto ? (
                <>
                  <Controller
                    name="inputCurrency"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        id="investment-input-currency"
                        label={inputCurrencyLabel}
                        value={field.value}
                        options={inputCurrencyOptions}
                        onChange={(next) => {
                          field.onChange(next);
                          setResolvedInputRate(null);
                          setValue("inputRateToVnd", null);
                        }}
                        data-testid="investment-input-currency"
                      />
                    )}
                  />
                  {inputRateLoading ? (
                    <Text size="sm" tone="secondary" aria-live="polite">
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
                    <Text size="sm" tone="secondary" aria-live="polite">
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
                          id="investment-input-rate"
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
                </>
              ) : null}
              {assetClass === InvestmentAssetClass.GOLD ? (
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      id="investment-unit"
                      label={t("unitLabel")}
                      value={field.value}
                      options={unitOptions}
                      onChange={field.onChange}
                    />
                  )}
                />
              ) : null}
              {entryMode === InvestmentEntryMode.HISTORICAL ? (
                <>
                  <div className="flex items-center justify-between gap-(--space-3)">
                    <Text size="sm" tone="secondary">
                      {t("remainingBasisOptional")}
                    </Text>
                    <button
                      type="button"
                      className="text-sm font-medium text-accent underline-offset-4 hover:underline"
                      onClick={() =>
                        setValue(
                          "basisInputMode",
                          basisInputMode === HistoricalBasisInputMode.PER_UNIT
                            ? HistoricalBasisInputMode.TOTAL
                            : HistoricalBasisInputMode.PER_UNIT,
                        )
                      }
                    >
                      {basisInputMode === HistoricalBasisInputMode.PER_UNIT
                        ? t("basisTotal")
                        : t("basisPerUnit")}
                    </button>
                  </div>
                  {basisInputMode === HistoricalBasisInputMode.PER_UNIT ? (
                    <ControlledField
                      control={control}
                      field={{
                        type: "number",
                        name: "costPerUnit",
                        id: "investment-cost-per-unit",
                        label: quotedLabel(t("remainingBasisOptional")),
                        description: t("remainingBasisDescription"),
                        minValue: 0,
                        step: usesQuotedCurrency ? 0.00000001 : 1,
                        formatOptions: quoteFormatOptions,
                        error: errors.costPerUnit
                          ? t("errors.invalid")
                          : undefined,
                      }}
                    />
                  ) : (
                    <ControlledField
                      control={control}
                      field={{
                        type: "number",
                        name: "totalBasisInput",
                        id: "investment-total-basis",
                        label: quotedLabel(t("remainingBasisOptional")),
                        description: t("remainingBasisDescription"),
                        minValue: 0,
                        step: usesQuotedCurrency ? 0.00000001 : 1,
                        formatOptions: quoteFormatOptions,
                        error: errors.totalBasisInput
                          ? t("errors.invalid")
                          : undefined,
                      }}
                    />
                  )}
                  <ControlledField
                    control={control}
                    field={{
                      type: "number",
                      name: "currentUnitValuation",
                      id: "investment-current-unit-valuation",
                      label: pricingContract.usesTotalValue
                        ? quotedLabel(t("totalValue"))
                        : assetClass === InvestmentAssetClass.GOLD
                          ? t("goldBuyBackValuationOptional")
                          : quotedLabel(t("currentValuationOptional")),
                      description: t("currentValuationDescription"),
                      minValue: 0,
                      step: usesQuotedCurrency ? 0.00000001 : 1,
                      formatOptions: quoteFormatOptions,
                      error: errors.currentUnitValuation
                        ? t("errors.invalid")
                        : undefined,
                    }}
                  />
                  <InvestmentFactsCard>
                    <InvestmentFactRow
                      label={t("remainingBasisOptional")}
                      value={
                        <FinancialValue>
                          {money(historicalPreview.totalCostBasis)}
                        </FinancialValue>
                      }
                    />
                    <InvestmentFactRow
                      label={t("currentValuationOptional")}
                      value={
                        <FinancialValue>
                          {money(historicalPreview.currentTotalValue)}
                        </FinancialValue>
                      }
                    />
                    <InvestmentFactRow
                      label={t("estimatedPnl")}
                      value={
                        <FinancialValue>
                          {formatSignedMoney(
                            historicalPreview.unrealizedPnl,
                            money,
                            t("unknown"),
                          )}
                        </FinancialValue>
                      }
                    />
                  </InvestmentFactsCard>
                </>
              ) : (
                <>
                  <ControlledField
                    control={control}
                    field={{
                      type: "number",
                      name: pricingContract.usesTotalValue
                        ? "totalPurchaseValue"
                        : "price",
                      id: "investment-price",
                      label: pricingContract.usesTotalValue
                        ? quotedLabel(t("totalValue"))
                        : selectedInstrument?.pricingMode ===
                            MarketPricingMode.NAV_PER_UNIT
                          ? quotedLabel(tUx(config.priceLabelKey))
                          : selectedInstrument
                            ? quotedLabel(
                                t("purchasePriceFor", {
                                  symbol: selectedInstrument.symbol,
                                }),
                              )
                            : quotedLabel(tUx(config.priceLabelKey)),
                      minValue: 0,
                      step: usesQuotedCurrency ? 0.00000001 : 1,
                      formatOptions: quoteFormatOptions,
                      error: (
                        pricingContract.usesTotalValue
                          ? errors.totalPurchaseValue
                          : errors.price
                      )
                        ? t("errors.invalid")
                        : undefined,
                    }}
                  />
                  <Controller
                    name="accountId"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        id="investment-source-account"
                        label={t("sourceAccountLabel")}
                        value={field.value ?? ""}
                        options={accountOptions}
                        onChange={field.onChange}
                        isDisabled={accountOptions.length === 0}
                      />
                    )}
                  />
                </>
              )}
              <ControlledField
                control={control}
                field={{
                  type: "date",
                  name: "date",
                  id: "investment-date",
                  label:
                    entryMode === InvestmentEntryMode.HISTORICAL
                      ? t("asOfDate")
                      : assetClass === InvestmentAssetClass.FUND
                        ? t("investmentDate")
                        : t("transactionDate"),
                  error: errors.date ? t("errors.invalid") : undefined,
                }}
              />
              <FormField id="investment-notes" label={t("notesOptional")}>
                <Textarea id="investment-notes" {...register("notes")} />
              </FormField>
            </div>
          </section>
        ) : (
          <OpeningReviewSection
            title={t("reviewTitle")}
            subtitle={t("reviewSubtitle")}
            holdingName={holdingName}
            trackedAsset={trackedAssetLabel}
            heroLabel={reviewHeroLabel}
            heroAmount={reviewHeroAmount}
            heroMeta={`${tUx(config.titleKey)} · ${quantityDisplay}`}
            facts={reviewFacts}
            sideTitle={reviewSideTitle}
            sideSubtitle={reviewSideSubtitle}
            sideFacts={reviewSideFacts}
          />
        )}
      </MotionStep>
      <BottomActionBar
        className="mt-auto"
        layout={
          hasBackAction
            ? BottomActionBarLayout.SPLIT
            : BottomActionBarLayout.STACKED
        }
      >
        {hasBackAction ? (
          <Button
            variant="secondary"
            className="min-h-11 min-w-0 flex-1 px-(--space-3) text-pretty"
            onPress={goBack}
          >
            {isReviewStep ? t("back") : t("changeType")}
          </Button>
        ) : null}
        {isReviewStep ? (
          <Button
            className={primaryActionClassName}
            isPending={pending}
            isDisabled={!online}
            onPress={() => void submit()}
            data-testid="investment-opening-confirm"
          >
            {confirmLabel}
          </Button>
        ) : (
          <Button
            className={primaryActionClassName}
            onPress={goNext}
            data-testid={
              stepIndex === DETAILS_STEP_INDEX
                ? "investment-opening-review"
                : "investment-opening-next"
            }
          >
            {stepIndex === FIRST_STEP_INDEX ? t("continue") : t("review")}
          </Button>
        )}
      </BottomActionBar>
    </div>
  );
}
