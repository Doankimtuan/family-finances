"use client";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  BankIcon,
  ChartBarLineIcon,
  SmartPhoneIcon,
  Wallet02Icon,
} from "@hugeicons/core-free-icons";
import {
  InvestmentAssetClass,
  InvestmentEntryMode,
  OPENING_POSITION_STEP_VALUES,
  INVESTMENT_CREATE_IDEMPOTENCY_KEY_PREFIX,
  initialPurchaseInputSchema,
  openingPositionInputSchema,
  type InvestmentErrorCode,
} from "@/modules/investments/application/client";
import { GoldUnit, GOLD_UNIT_VALUES } from "@/modules/investments/domain";
import {
  investmentUxConfig,
  type InvestmentUxType,
} from "@/modules/investments/application/investment-ux";
import {
  buildHistoricalImportPreview,
  HistoricalBasisInputMode,
} from "@/modules/investments/application/historical-import-view-model";
import { multiplyQuantityByUnitPrice } from "@/modules/investments/application/investment-operation-view-model";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/client";
import { AppIcon } from "@/shared/ui/app-icon";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { MotionStep, MotionStepDirection } from "@/shared/motion";
import { LabeledSelect } from "@/shared/patterns/labeled-native-field";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { TextField } from "@/shared/ui/form";
import { Textarea } from "@/shared/ui/textarea";
import { FinancialScopeField } from "@/shared/patterns/financial-scope-field";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  createInitialPurchaseAction,
  createOpeningPositionAction,
} from "./investment-actions";
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
    symbol: openingPositionInputSchema.shape.symbol,
    provider: openingPositionInputSchema.shape.providerCustodian,
    quantity: openingPositionInputSchema.shape.quantity,
    unit: z.enum(GOLD_UNIT_VALUES),
    basisInputMode: z.enum(BASIS_MODES),
    costPerUnit: openingPositionInputSchema.shape.remainingTotalCostBasis,
    totalBasisInput: openingPositionInputSchema.shape.remainingTotalCostBasis,
    currentUnitValuation:
      openingPositionInputSchema.shape.remainingTotalCostBasis,
    price: initialPurchaseInputSchema.shape.unitPriceVnd.nullable().optional(),
    accountId: z
      .union([initialPurchaseInputSchema.shape.cashAccountId, z.literal("")])
      .optional(),
    date: openingPositionInputSchema.shape.asOfDate,
    notes: openingPositionInputSchema.shape.notes,
  })
  .superRefine((value, context) => {
    if (value.entryMode !== InvestmentEntryMode.PURCHASE) return;
    if (value.price == null) {
      context.addIssue({
        code: "custom",
        path: ["price"],
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
  });

type OpeningPositionFormValues = z.input<typeof openingPositionFormSchema>;

const today = () => new Date().toISOString().slice(0, 10);

const createDefaultValues = (accounts: AccountOption[]) =>
  ({
    financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
    entryMode: InvestmentEntryMode.HISTORICAL,
    assetName: "",
    assetClass: InvestmentAssetClass.STOCK,
    symbol: "",
    provider: "",
    quantity: "",
    unit: GoldUnit.CHI,
    basisInputMode: HistoricalBasisInputMode.PER_UNIT,
    costPerUnit: null,
    totalBasisInput: null,
    currentUnitValuation: null,
    price: null,
    accountId: accounts[0]?.id ?? undefined,
    date: today(),
    notes: "",
  }) satisfies Partial<OpeningPositionFormValues>;

const iconFor = (asset: InvestmentUxType) =>
  asset === InvestmentAssetClass.STOCK
    ? ChartBarLineIcon
    : asset === InvestmentAssetClass.CRYPTO
      ? SmartPhoneIcon
      : asset === InvestmentAssetClass.GOLD
        ? BankIcon
        : Wallet02Icon;

export function OpeningPositionForm({ accounts = [] }: Props) {
  const t = useTranslations("money.investments.opening");
  const locale = useLocale();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(FIRST_STEP_INDEX);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [error, setError] = useState<InvestmentErrorCode | null>(null);
  const [pending, startTransition] = useTransition();
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
    accountId,
    date = today(),
    financialScope = FINANCIAL_SCOPE.HOUSEHOLD,
  } = values;
  const config = investmentUxConfig(assetClass);
  const historicalPreview = buildHistoricalImportPreview({
    quantity,
    basisInputMode,
    averageCostPerUnit: costPerUnit,
    totalCostBasis: totalBasisInput,
    currentUnitValuation,
  });
  const gross = quantity ? multiplyQuantityByUnitPrice(quantity, price) : null;

  const money = (value: number | null) =>
    value == null
      ? t("unknown")
      : formatCurrency(value, DEFAULT_CURRENCY, locale, {
          maximumFractionDigits: 0,
        });

  const accountOptions = accounts.map((account) => ({
    id: account.id,
    label: account.name,
  }));

  const unitOptions = GOLD_UNIT_VALUES.map((value) => ({
    id: value,
    label: t(`units.${value}`),
  }));

  const setType = (next: InvestmentUxType) => {
    setValue("assetClass", next);
    resetField("assetName");
    resetField("symbol");
    resetField("provider");
    resetField("quantity");
    resetField("unit");
    resetField("basisInputMode");
    resetField("costPerUnit");
    resetField("totalBasisInput");
    resetField("currentUnitValuation");
    resetField("price");
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
    const key = `${INVESTMENT_CREATE_IDEMPOTENCY_KEY_PREFIX}:${crypto.randomUUID()}`;
    startTransition(async () => {
      const result =
        submitted.entryMode === InvestmentEntryMode.HISTORICAL
          ? await createOpeningPositionAction({
              financialScope,
              assetName: submitted.assetName,
              assetClass: submitted.assetClass,
              quantity: submitted.quantity,
              asOfDate: submitted.date,
              symbol: submitted.symbol || null,
              providerCustodian: submitted.provider || null,
              remainingTotalCostBasis: historicalPreview.totalCostBasis,
              currentValuation: historicalPreview.currentTotalValue,
              notes: submitted.notes || null,
              idempotencyKey: key,
            })
          : await createInitialPurchaseAction({
              financialScope,
              assetName: submitted.assetName,
              assetClass: submitted.assetClass,
              quantity: submitted.quantity,
              unitPriceVnd: submitted.price ?? ZERO_AMOUNT,
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
      router.replace(
        result.receipt.holdingId
          ? moneyInvestmentPath(result.receipt.holdingId)
          : APP_PATH.MONEY_INVESTMENTS,
      );
    });
  });

  return (
    <div
      className="flex min-h-full flex-col gap-(--space-4)"
      data-testid="investment-opening-form"
    >
      {error ? (
        <StatusAlert variant="danger" title={t(`errors.${error}`)} />
      ) : null}
      <FinancialScopeField
        value={financialScope}
        onChange={(next) => setValue("financialScope", next)}
        testId="investment-financial-scope"
      />
      <div
        className="flex items-center justify-between"
        data-testid="investment-step-indicator"
      >
        <div className="flex gap-(--space-2)">
          {OPENING_POSITION_STEP_VALUES.map((item, index) => (
            <span
              key={item}
              className={`h-1.5 rounded-full ${index === stepIndex ? "w-8 bg-accent" : index < stepIndex ? "w-4 bg-accent/55" : "w-4 bg-border-subtle"}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <Text size="xs" tone="secondary" weight="medium">
          {stepIndex + 1} / {OPENING_POSITION_STEP_VALUES.length}
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
            className="flex flex-col gap-(--space-4)"
            aria-labelledby="investment-type-title"
          >
            <div>
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
              <Text tone="secondary" className="mt-(--space-1)">
                {t("stepQuestionDescription")}
              </Text>
            </div>
            <div className="grid grid-cols-2 gap-(--space-2)">
              {(
                [
                  InvestmentAssetClass.STOCK,
                  InvestmentAssetClass.FUND,
                  InvestmentAssetClass.CRYPTO,
                  InvestmentAssetClass.GOLD,
                  InvestmentAssetClass.BOND,
                ] as InvestmentUxType[]
              ).map((item) => {
                const itemConfig = investmentUxConfig(item);
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={assetClass === item}
                    onClick={() => setType(item)}
                    data-testid={`investment-type-${item}`}
                    className={`flex min-h-32 flex-col items-start gap-(--space-2) rounded-(--radius-card) border p-(--space-3) text-left transition-colors ${assetClass === item ? "border-accent bg-primary-soft" : "border-border-subtle bg-surface"}`}
                  >
                    <AppIcon icon={iconFor(item)} size="lg" emphasized />
                    <Text weight="semibold">{itemConfig.title}</Text>
                    <Text size="sm" tone="secondary" className="leading-snug">
                      {itemConfig.description}
                    </Text>
                  </button>
                );
              })}
            </div>
          </section>
        ) : stepIndex === DETAILS_STEP_INDEX ? (
          <section
            className="flex flex-col gap-(--space-4)"
            aria-labelledby="investment-details-title"
          >
            <div>
              <Text
                as="div"
                role="heading"
                aria-level={1}
                size="lg"
                weight="semibold"
                id="investment-details-title"
              >
                {config.title}
              </Text>
              <Text tone="secondary" className="mt-(--space-1)">
                {config.description}
              </Text>
            </div>
            <div className="grid gap-(--space-2) sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={entryMode === InvestmentEntryMode.HISTORICAL}
                onClick={() =>
                  setValue("entryMode", InvestmentEntryMode.HISTORICAL)
                }
                className={`rounded-(--radius-control) border px-(--space-3) py-(--space-3) text-left ${entryMode === InvestmentEntryMode.HISTORICAL ? "border-accent bg-primary-soft" : "border-border-subtle bg-surface"}`}
              >
                <Text weight="medium">{t("historicalModeTitle")}</Text>
                <Text size="sm" tone="secondary" className="mt-1">
                  {t("historicalModeSubtitle")}
                </Text>
              </button>
              <button
                type="button"
                aria-pressed={entryMode === InvestmentEntryMode.PURCHASE}
                onClick={() =>
                  setValue("entryMode", InvestmentEntryMode.PURCHASE)
                }
                className={`rounded-(--radius-control) border px-(--space-3) py-(--space-3) text-left ${entryMode === InvestmentEntryMode.PURCHASE ? "border-accent bg-primary-soft" : "border-border-subtle bg-surface"}`}
              >
                <Text weight="medium">{t("purchaseModeTitle")}</Text>
                <Text size="sm" tone="secondary" className="mt-1">
                  {t("purchaseModeSubtitle")}
                </Text>
              </button>
            </div>
            <div className="flex flex-col gap-(--space-3)">
              <TextField
                id="investment-name"
                label={config.instrumentLabel}
                registration={register("assetName")}
                error={errors.assetName ? t("errors.invalid") : undefined}
              />
              {assetClass !== InvestmentAssetClass.GOLD &&
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
                label={config.providerHint}
                registration={register("provider")}
                error={errors.provider ? t("errors.invalid") : undefined}
              />
              <ControlledField
                control={control}
                field={{
                  type: "decimal",
                  name: "quantity",
                  id: "investment-quantity",
                  label: config.quantityLabel,
                  error: errors.quantity ? t("errors.invalid") : undefined,
                }}
              />
              {assetClass === InvestmentAssetClass.GOLD ? (
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <LabeledSelect
                      label={t("unitLabel")}
                      value={field.value}
                      options={unitOptions}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  )}
                />
              ) : null}
              {entryMode === InvestmentEntryMode.HISTORICAL ? (
                <>
                  <div className="flex items-center justify-between gap-3">
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
                        type: "amount",
                        name: "costPerUnit",
                        id: "investment-cost-per-unit",
                        label: t("remainingBasisOptional"),
                        error: errors.costPerUnit
                          ? t("errors.invalid")
                          : undefined,
                      }}
                    />
                  ) : (
                    <ControlledField
                      control={control}
                      field={{
                        type: "amount",
                        name: "totalBasisInput",
                        id: "investment-total-basis",
                        label: t("remainingBasisOptional"),
                        error: errors.totalBasisInput
                          ? t("errors.invalid")
                          : undefined,
                      }}
                    />
                  )}
                  <ControlledField
                    control={control}
                    field={{
                      type: "amount",
                      name: "currentUnitValuation",
                      id: "investment-current-unit-valuation",
                      label:
                        assetClass === InvestmentAssetClass.GOLD
                          ? t("goldBuyBackValuationOptional")
                          : t("currentValuationOptional"),
                      error: errors.currentUnitValuation
                        ? t("errors.invalid")
                        : undefined,
                    }}
                  />
                  <div className="rounded-(--radius-card) border border-border-subtle bg-surface-muted p-(--space-3) text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-text-secondary">
                        {t("remainingBasisOptional")}
                      </span>
                      <span>{money(historicalPreview.totalCostBasis)}</span>
                    </div>
                    <div className="mt-1 flex justify-between gap-3">
                      <span className="text-text-secondary">
                        {t("currentValuationOptional")}
                      </span>
                      <span>{money(historicalPreview.currentTotalValue)}</span>
                    </div>
                    <div className="mt-1 flex justify-between gap-3">
                      <span className="text-text-secondary">
                        {t("estimatedPnl")}
                      </span>
                      <span>
                        {historicalPreview.unrealizedPnl == null
                          ? t("unknown")
                          : (historicalPreview.unrealizedPnl > 0 ? "+" : "") +
                            money(historicalPreview.unrealizedPnl)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <ControlledField
                    control={control}
                    field={{
                      type: "amount",
                      name: "price",
                      id: "investment-price",
                      label: config.priceLabel,
                      error: errors.price ? t("errors.invalid") : undefined,
                    }}
                  />
                  <Controller
                    name="accountId"
                    control={control}
                    render={({ field }) => (
                      <LabeledSelect
                        label={t("sourceAccountLabel")}
                        value={field.value ?? ""}
                        options={accountOptions}
                        onChange={(event) => field.onChange(event.target.value)}
                        disabled={accountOptions.length === 0}
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
              <label className="flex flex-col gap-1">
                <span className="text-sm text-text-secondary">
                  {t("notesOptional")}
                </span>
                <Textarea {...register("notes")} />
              </label>
            </div>
          </section>
        ) : (
          <section
            className="flex flex-col gap-(--space-4)"
            aria-labelledby="investment-review-title"
            data-testid="investment-opening-preview"
          >
            <div>
              <Text
                as="div"
                role="heading"
                aria-level={1}
                size="lg"
                weight="semibold"
                id="investment-review-title"
              >
                {t("reviewTitle")}
              </Text>
              <Text tone="secondary" className="mt-(--space-1)">
                {t("reviewSubtitle")}
              </Text>
            </div>
            <div className="rounded-(--radius-card) bg-surface-muted p-(--space-4)">
              <Text weight="semibold">
                {config.title} · {assetName || t("unnamedAsset")}
              </Text>
              <div className="mt-(--space-3) grid gap-(--space-2) text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-text-secondary">
                    {t("quantityLabel")}
                  </span>
                  <span>
                    {quantity || t("unknown")}
                    {assetClass === InvestmentAssetClass.GOLD
                      ? ` ${t(`units.${unit}`)}`
                      : ""}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-text-secondary">
                    {t("providerLabel")}
                  </span>
                  <span>{provider || t("unknown")}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-text-secondary">{t("dateLabel")}</span>
                  <span>{date}</span>
                </div>
              </div>
            </div>
            {entryMode === InvestmentEntryMode.HISTORICAL ? (
              <div className="rounded-(--radius-card) border border-border-subtle p-(--space-4)">
                <Text weight="medium">{t("historicalCardTitle")}</Text>
                <Text size="sm" tone="secondary" className="mt-1">
                  {t("historicalCardSubtitle")}
                </Text>
                <div className="mt-(--space-3) grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">
                      {t("remainingBasisOptional")}
                    </span>
                    <span>{money(historicalPreview.totalCostBasis)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">
                      {t("pricePerUnitLabel")}
                    </span>
                    <span>{money(historicalPreview.averageCostPerUnit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">
                      {t("currentValuationOptional")}
                    </span>
                    <span>{money(historicalPreview.currentTotalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">
                      {t("estimatedPnl")}
                    </span>
                    <span>
                      {historicalPreview.unrealizedPnl == null
                        ? t("unknown")
                        : (historicalPreview.unrealizedPnl > 0 ? "+" : "") +
                          money(historicalPreview.unrealizedPnl)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-(--radius-card) border border-accent/30 bg-primary-soft p-(--space-4)">
                <Text weight="medium">{t("purchaseCardTitle")}</Text>
                <div className="mt-(--space-3) grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">
                      {t("pricePerUnitLabel")}
                    </span>
                    <span>{money(price)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>{t("totalCashNeeded")}</span>
                    <span>{money(gross)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">
                      {t("fromAccount")}
                    </span>
                    <span>
                      {accounts.find((account) => account.id === accountId)
                        ?.name || t("unknown")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </MotionStep>
      <BottomActionBar>
        {stepIndex > FIRST_STEP_INDEX ? (
          <Button variant="secondary" onPress={goBack}>
            {stepIndex === REVIEW_STEP_INDEX ? t("back") : t("changeType")}
          </Button>
        ) : null}
        {stepIndex < REVIEW_STEP_INDEX ? (
          <Button
            className="w-full"
            onPress={goNext}
            data-testid={
              stepIndex === DETAILS_STEP_INDEX
                ? "investment-opening-review"
                : "investment-opening-next"
            }
          >
            {stepIndex === FIRST_STEP_INDEX ? t("continue") : t("review")}
          </Button>
        ) : (
          <Button
            className="w-full"
            isPending={pending}
            onPress={() => void submit()}
            data-testid="investment-opening-confirm"
          >
            {pending
              ? t("saving")
              : entryMode === InvestmentEntryMode.HISTORICAL
                ? t("confirmImport")
                : t("confirmAction", {
                    action: config.purchaseAction.toLowerCase(),
                  })}
          </Button>
        )}
      </BottomActionBar>
    </div>
  );
}
