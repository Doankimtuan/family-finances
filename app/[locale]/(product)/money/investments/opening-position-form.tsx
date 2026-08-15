"use client";
import { useMemo, useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";
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
  type InvestmentErrorCode,
  type InvestmentEntryMode as InvestmentEntryModeType,
} from "@/modules/investments/application/client";
import {
  GoldUnit,
  GOLD_UNIT_VALUES,
  type GoldUnit as GoldUnitType,
} from "@/modules/investments/domain";
import {
  investmentUxConfig,
  type InvestmentUxType,
} from "@/modules/investments/application/investment-ux";
import {
  buildHistoricalImportPreview,
  type HistoricalBasisInputMode,
} from "@/modules/investments/application/historical-import-view-model";
import { AppIcon } from "@/shared/ui/app-icon";
import { AmountField } from "@/shared/patterns/amount-field";
import { DecimalField } from "@/shared/patterns/decimal-field";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { MotionStep, MotionStepDirection } from "@/shared/motion";
import {
  LabeledDateInput,
  LabeledSelect,
} from "@/shared/patterns/labeled-native-field";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { TextField } from "@/shared/ui/form";
import { Textarea } from "@/shared/ui/textarea";
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

const today = () => new Date().toISOString().slice(0, 10);

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
  const [assetClass, setAssetClass] = useState<InvestmentUxType>(
    InvestmentAssetClass.STOCK,
  );
  const [entryMode, setEntryMode] = useState<InvestmentEntryModeType>(
    InvestmentEntryMode.HISTORICAL,
  );
  const [assetName, setAssetName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [provider, setProvider] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<GoldUnitType>(GoldUnit.CHI);
  const [basisInputMode, setBasisInputMode] =
    useState<HistoricalBasisInputMode>("per-unit");
  const [costPerUnit, setCostPerUnit] = useState<number | null>(null);
  const [totalBasisInput, setTotalBasisInput] = useState<number | null>(null);
  const [currentUnitValuation, setCurrentUnitValuation] = useState<
    number | null
  >(null);
  const [price, setPrice] = useState<number | null>(null);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<InvestmentErrorCode | null>(null);
  const [pending, startTransition] = useTransition();
  const idempotencyKey = useRef<string | null>(null);
  const config = investmentUxConfig(assetClass);
  const historicalPreview = buildHistoricalImportPreview({
    quantity,
    basisInputMode,
    averageCostPerUnit: costPerUnit,
    totalCostBasis: totalBasisInput,
    currentUnitValuation,
  });
  const gross = quantity && price != null ? Number(quantity) * price : null;

  const money = (value: number | null) =>
    value == null
      ? "—"
      : formatCurrency(value, "VND", locale, { maximumFractionDigits: 0 });

  const accountOptions = useMemo(
    () => accounts.map((account) => ({ id: account.id, label: account.name })),
    [accounts],
  );

  const unitOptions = useMemo(
    () =>
      GOLD_UNIT_VALUES.map((u) => ({
        id: u,
        label: t(`units.${u}`),
      })),
    [t],
  );

  const setType = (next: InvestmentUxType) => {
    setAssetClass(next);
    setAssetName("");
    setSymbol("");
    setProvider("");
    setQuantity("");
    setUnit(GoldUnit.CHI);
    setBasisInputMode("per-unit");
    setCostPerUnit(null);
    setTotalBasisInput(null);
    setCurrentUnitValuation(null);
    setPrice(null);
  };

  const canDetails = Boolean(
    assetName.trim() &&
    quantity &&
    (entryMode === InvestmentEntryMode.HISTORICAL
      ? historicalPreview.basisKnown || historicalPreview.valuationKnown
      : price != null && accountId),
  );

  const goNext = () => {
    if (stepIndex === FIRST_STEP_INDEX || canDetails) {
      setError(null);
      setDirection("forward");
      setStepIndex((value) => Math.min(value + 1, REVIEW_STEP_INDEX));
    }
  };

  const goBack = () => {
    setError(null);
    setDirection("backward");
    setStepIndex((value) => Math.max(value - 1, FIRST_STEP_INDEX));
  };

  const submit = () => {
    setError(null);
    const key =
      idempotencyKey.current ??
      (idempotencyKey.current = `investment:create:${crypto.randomUUID()}`);
    startTransition(async () => {
      const result =
        entryMode === InvestmentEntryMode.HISTORICAL
          ? await createOpeningPositionAction({
              assetName,
              assetClass,
              quantity,
              asOfDate: date,
              symbol: symbol || null,
              providerCustodian: provider || null,
              remainingTotalCostBasis: historicalPreview.totalCostBasis,
              currentValuation: historicalPreview.currentTotalValue,
              notes: notes || null,
              idempotencyKey: key,
            })
          : await createInitialPurchaseAction({
              assetName,
              assetClass,
              quantity,
              unitPriceVnd: price ?? ZERO_AMOUNT,
              cashAccountId: accountId,
              asOfDate: date,
              symbol: symbol || null,
              providerCustodian: provider || null,
              fees: [],
              notes: notes || null,
              idempotencyKey: key,
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
    <div
      className="flex min-h-full flex-col gap-(--space-4)"
      data-testid="investment-opening-form"
    >
      {error ? (
        <StatusAlert variant="danger" title={t(`errors.${error}`)} />
      ) : null}
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
                onClick={() => setEntryMode(InvestmentEntryMode.HISTORICAL)}
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
                onClick={() => setEntryMode(InvestmentEntryMode.PURCHASE)}
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
                value={assetName}
                onChange={(event) => setAssetName(event.target.value)}
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
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value)}
                />
              ) : null}
              <TextField
                id="investment-provider"
                label={config.providerHint}
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
              />
              <DecimalField
                id="investment-quantity"
                label={config.quantityLabel}
                value={quantity}
                onValueChange={setQuantity}
              />
              {assetClass === InvestmentAssetClass.GOLD ? (
                <LabeledSelect
                  label={t("unitLabel")}
                  value={unit}
                  options={unitOptions}
                  onChange={(event) =>
                    setUnit(event.target.value as GoldUnitType)
                  }
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
                        setBasisInputMode(
                          basisInputMode === "per-unit" ? "total" : "per-unit",
                        )
                      }
                    >
                      {basisInputMode === "per-unit"
                        ? "Theo tổng giá vốn"
                        : "Theo giá mỗi đơn vị"}
                    </button>
                  </div>
                  {basisInputMode === "per-unit" ? (
                    <AmountField
                      id="investment-cost-per-unit"
                      label={
                        t("remainingBasisOptional") +
                        " / " +
                        config.quantityLabel
                      }
                      value={costPerUnit}
                      onValueChange={setCostPerUnit}
                    />
                  ) : (
                    <AmountField
                      id="investment-total-basis"
                      label={t("remainingBasisOptional")}
                      value={totalBasisInput}
                      onValueChange={setTotalBasisInput}
                    />
                  )}
                  <AmountField
                    id="investment-current-unit-valuation"
                    label={
                      assetClass === InvestmentAssetClass.GOLD
                        ? t("goldBuyBackValuationOptional")
                        : t("currentValuationOptional")
                    }
                    value={currentUnitValuation}
                    onValueChange={setCurrentUnitValuation}
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
                      <span className="text-text-secondary">P&amp;L</span>
                      <span>
                        {historicalPreview.unrealizedPnl == null
                          ? "—"
                          : (historicalPreview.unrealizedPnl > 0 ? "+" : "") +
                            money(historicalPreview.unrealizedPnl)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AmountField
                    id="investment-price"
                    label={config.priceLabel}
                    value={price}
                    onValueChange={setPrice}
                  />
                  <LabeledSelect
                    label={t("sourceAccountLabel")}
                    value={accountId}
                    options={accountOptions}
                    onChange={(event) => setAccountId(event.target.value)}
                    disabled={accountOptions.length === 0}
                  />
                </>
              )}
              <LabeledDateInput
                label={
                  entryMode === InvestmentEntryMode.HISTORICAL
                    ? t("asOfDate")
                    : assetClass === InvestmentAssetClass.FUND
                      ? t("investmentDate")
                      : t("transactionDate")
                }
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
              <label className="flex flex-col gap-1">
                <span className="text-sm text-text-secondary">
                  {t("notesOptional")}
                </span>
                <Textarea
                  value={notes}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setNotes(event.target.value)
                  }
                />
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
                    {quantity || "—"}
                    {assetClass === InvestmentAssetClass.GOLD
                      ? ` ${t(`units.${unit}`)}`
                      : ""}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-text-secondary">
                    {t("providerLabel")}
                  </span>
                  <span>{provider || "—"}</span>
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
                    <span className="text-text-secondary">P&amp;L</span>
                    <span>
                      {historicalPreview.unrealizedPnl == null
                        ? "—"
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
                        ?.name || "—"}
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
            onPress={submit}
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
