"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  BankIcon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  SmartPhoneIcon,
  Wallet02Icon,
} from "@hugeicons/core-free-icons";
import {
  moneySavingsPath,
  APP_PATH,
} from "@/modules/tenancy/application/app-path";
import {
  MaturityFallbackPolicy,
  RenewalPolicy,
  SettlementRule,
  SavingType,
  MaturityTargetMode,
  RENEWAL_POLICY_VALUES,
  SETTLEMENT_RULE_VALUES,
} from "@/modules/savings/application/savings-constants";
import {
  addSavingsTerm,
  calculateInterest,
  createSavingInputSchema,
  InterestCalcMethod,
  SavingsTermUnit,
  type SavingsTermUnit as SavingsTermUnitValue,
} from "@/modules/savings/application/client";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import { FinancialScopeField } from "@/shared/patterns/financial-scope-field";
import { AppIcon } from "@/shared/ui/app-icon";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { MotionStep, MotionStepDirection } from "@/shared/motion";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency } from "@/shared/i18n/formatters";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/client";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { createSavingAction } from "../savings-actions";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";

type AccountOption = {
  id: string;
  name: string;
  type: string;
  balance: number;
};
type ProviderOption = { id: string; displayName: string; savingType: string };
type PackageOption = {
  id: string;
  packageName: string;
  durationDays: number;
  annualInterestRate: number;
  minAmount: number | null;
  maxAmount: number | null;
  termAmount?: number | null;
  termUnit?: SavingsTermUnitValue | null;
  interestCalculationMethod?: InterestCalcMethod;
  renewableAvailable?: boolean;
};
type Props = {
  accounts: AccountOption[];
  providers: ProviderOption[];
  packagesByProvider: Record<string, PackageOption[]>;
};
const FlowStep = {
  PRODUCT: "product",
  DEPOSIT: "deposit",
  REVIEW: "review",
} as const;
type FlowStep = (typeof FlowStep)[keyof typeof FlowStep];
type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

const STEPS = [FlowStep.PRODUCT, FlowStep.DEPOSIT, FlowStep.REVIEW] as const;

const savingFormSchema = z.object({
  financialScope: createSavingInputSchema.shape.financialScope,
  fundingAccountId: createSavingInputSchema.shape.fundingAccountId,
  settlementAccountId: createSavingInputSchema.shape.settlementAccountId,
  providerId: createSavingInputSchema.shape.providerId,
  packageId: createSavingInputSchema.shape.packageId,
  principal: createSavingInputSchema.shape.principal.nullable(),
  startDate: createSavingInputSchema.shape.startDate,
  renewalPolicy: createSavingInputSchema.shape.renewalPolicy,
  settlementRule: createSavingInputSchema.shape.settlementRule,
  targetMode: z.enum(
    Object.values(MaturityTargetMode) as [
      MaturityTargetMode,
      ...MaturityTargetMode[],
    ],
  ),
  targetPackageId: z.string().uuid().nullable(),
});
type SavingFormValues = z.input<typeof savingFormSchema>;

function savingTypeLabel(
  t: ReturnType<typeof useTranslations<"money.savingsWizard">>,
  savingType: string,
) {
  switch (savingType) {
    case SavingType.BANK_DEPOSIT:
      return t("savingTypes.bank_deposit");
    case SavingType.DIGITAL_SAVING:
      return t("savingTypes.digital_saving");
    case SavingType.FLEXIBLE_SAVING:
      return t("savingTypes.flexible_saving");
    default:
      return t("savingTypes.manual_saving");
  }
}

function providerIcon(savingType: string) {
  return savingType === SavingType.BANK_DEPOSIT
    ? BankIcon
    : savingType === SavingType.DIGITAL_SAVING
      ? SmartPhoneIcon
      : Wallet02Icon;
}

function createDefaultValues(
  accounts: AccountOption[],
  providers: ProviderOption[],
  packagesByProvider: Record<string, PackageOption[]>,
) {
  const providerId = providers[0]?.id ?? "";
  const packageId = packagesByProvider[providerId]?.[0]?.id ?? "";
  return {
    financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
    fundingAccountId: accounts[0]?.id ?? "",
    settlementAccountId: accounts[0]?.id ?? "",
    providerId,
    packageId,
    principal: null,
    startDate: new Date().toISOString().slice(0, 10),
    renewalPolicy: RenewalPolicy.ALWAYS_ASK,
    settlementRule: SettlementRule.WITHDRAW_EVERYTHING,
    targetMode: MaturityTargetMode.KEEP_CURRENT_PACKAGE,
    targetPackageId: packageId || null,
  } satisfies SavingFormValues;
}

function SummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-(--space-3) border-b border-border-subtle/60 py-(--space-3) last:border-b-0">
      <Text size="sm" tone="secondary">
        {label}
      </Text>
      <Text
        size="sm"
        weight={emphasis ? "semibold" : "medium"}
        tabular={emphasis}
        className="text-right"
      >
        {value}
      </Text>
    </div>
  );
}

function SelectionCard({
  selected,
  onPress,
  children,
  testId,
}: {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      data-testid={testId}
      onClick={onPress}
      className={`group flex w-full items-center justify-between gap-(--space-3) rounded-[var(--radius-control)] border px-(--space-3) py-(--space-3) text-left transition-[border-color,background-color,box-shadow] duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-focus-ring ${selected ? "border-accent bg-accent-soft shadow-[var(--elevation-1)]" : "border-border-subtle bg-surface hover:border-accent/50 hover:bg-surface-hover"}`}
    >
      {children}
      {selected ? (
        <AppIcon
          icon={CheckmarkCircle02Icon}
          size="sm"
          className="shrink-0 text-accent"
        />
      ) : null}
    </button>
  );
}

export function CreateSavingWizard({
  accounts,
  providers,
  packagesByProvider,
}: Props) {
  const t = useTranslations("money.savingsWizard");
  const tErr = useTranslations("money.products.errors");
  const locale = useLocale();
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const defaultValues = createDefaultValues(
    accounts,
    providers,
    packagesByProvider,
  );
  const { control, handleSubmit, reset, setValue } = useForm<SavingFormValues>({
    resolver: zodResolver(savingFormSchema),
    defaultValues,
  });
  const values = useWatch({ control });
  const fundingAccountId = values.fundingAccountId ?? "";
  const financialScope = values.financialScope ?? FINANCIAL_SCOPE.HOUSEHOLD;
  const settlementAccountId = values.settlementAccountId ?? "";
  const providerId = values.providerId ?? "";
  const packageId = values.packageId ?? "";
  const principal = values.principal ?? null;
  const startDate = values.startDate ?? "";
  const settlementRule =
    values.settlementRule ?? SettlementRule.WITHDRAW_EVERYTHING;
  const renewalPolicy = values.renewalPolicy ?? RenewalPolicy.ALWAYS_ASK;
  const targetMode =
    values.targetMode ?? MaturityTargetMode.KEEP_CURRENT_PACKAGE;
  const targetPackageId = values.targetPackageId ?? "";

  const step = STEPS[stepIndex];
  const packages = packagesByProvider[providerId] ?? [];
  const selectedPackage =
    packages.find((item) => item.id === packageId) ?? null;
  const selectedProvider =
    providers.find((item) => item.id === providerId) ?? null;
  const fundingAccount =
    accounts.find((item) => item.id === fundingAccountId) ?? null;
  const settlementAccount =
    accounts.find((item) => item.id === settlementAccountId) ?? null;
  const principalAmount = principal ?? 0;
  const selectProvider = (nextProviderId: string) => {
    const nextPackageId = packagesByProvider[nextProviderId]?.[0]?.id ?? "";
    setValue("providerId", nextProviderId);
    setValue("packageId", nextPackageId);
    setValue("targetPackageId", nextPackageId || null);
  };
  const maturityDateForPackage = (pkg: PackageOption, value: string) =>
    value
      ? addSavingsTerm(value, {
          amount: pkg.termAmount ?? pkg.durationDays,
          unit: pkg.termUnit ?? SavingsTermUnit.DAY,
        })
      : "";

  const estimate = (() => {
    if (!selectedPackage || !startDate || principalAmount <= 0) return null;
    const maturityDate = maturityDateForPackage(selectedPackage, startDate);
    const interest = calculateInterest({
      principal: principalAmount,
      annualRate: selectedPackage.annualInterestRate,
      startDate,
      endDate: maturityDate,
      method:
        selectedPackage.interestCalculationMethod ?? InterestCalcMethod.SIMPLE,
    }).totalInterest;
    return { maturityDate, interest, total: principalAmount + interest };
  })();

  const money = (value: number) =>
    formatCurrency(value, DEFAULT_CURRENCY, locale, {
      maximumFractionDigits: 0,
    });
  const date = (value: string) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(`${value}T00:00:00`))
      : t("unknown");
  const rate = (value: number) =>
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 1,
    }).format(value);
  const amountIsValid = Boolean(
    selectedPackage &&
    principalAmount > 0 &&
    (selectedPackage.minAmount == null ||
      principalAmount >= selectedPackage.minAmount) &&
    (selectedPackage.maxAmount == null ||
      principalAmount <= selectedPackage.maxAmount),
  );
  const targetPackages = packages.filter(
    (pkg) =>
      pkg.renewableAvailable !== false &&
      (pkg.minAmount == null || principalAmount >= pkg.minAmount) &&
      (pkg.maxAmount == null || principalAmount <= pkg.maxAmount),
  );
  const needsPayout = settlementRule !== SettlementRule.ROLL_PRINCIPAL_INTEREST;
  const canContinue =
    step === FlowStep.PRODUCT
      ? Boolean(providerId && selectedPackage)
      : step === FlowStep.DEPOSIT
        ? Boolean(amountIsValid && fundingAccountId && startDate)
        : Boolean(
            (!needsPayout || settlementAccountId) &&
            renewalPolicy &&
            settlementRule &&
            (settlementRule === SettlementRule.WITHDRAW_EVERYTHING ||
              targetMode === MaturityTargetMode.KEEP_CURRENT_PACKAGE ||
              targetPackageId),
          );
  const goNext = () => {
    if (!canContinue) return;
    setErrorCode(null);
    setDirection("forward");
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
  };
  const goBack = () => {
    setErrorCode(null);
    setDirection("backward");
    setStepIndex((index) => Math.max(index - 1, 0));
  };
  const exitFlow = () => router.push(APP_PATH.MONEY_SAVINGS);

  const confirm = handleSubmit((submitted) => {
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (!selectedPackage || !amountIsValid) return;
    if (submitted.principal == null) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    const input = {
      financialScope: submitted.financialScope,
      fundingAccountId: submitted.fundingAccountId,
      settlementAccountId: submitted.settlementAccountId,
      providerId: submitted.providerId,
      packageId: submitted.packageId,
      principal: submitted.principal,
      startDate: submitted.startDate,
      renewalPolicy: submitted.renewalPolicy,
      settlementRule: submitted.settlementRule,
      renewalConfig: {
        preferredPackageId:
          submitted.settlementRule === SettlementRule.WITHDRAW_EVERYTHING
            ? null
            : submitted.targetMode === MaturityTargetMode.SELECT_PACKAGE
              ? submitted.targetPackageId
              : submitted.packageId,
        preferredSettlementRule: submitted.settlementRule,
        preferredSettlementAccountId: needsPayout
          ? submitted.settlementAccountId
          : null,
        targetMode: submitted.targetMode,
        targetPackageId:
          submitted.settlementRule === SettlementRule.WITHDRAW_EVERYTHING
            ? null
            : submitted.targetMode === MaturityTargetMode.SELECT_PACKAGE
              ? submitted.targetPackageId
              : submitted.packageId,
        payoutAccountId: needsPayout ? submitted.settlementAccountId : null,
        fallbackPolicy: MaturityFallbackPolicy.ASK_USER,
      },
      idempotencyKey: crypto.randomUUID(),
    };
    startTransition(async () => {
      const result = await createSavingAction(input);
      if (result.status === "success" && result.id) {
        reset(defaultValues);
        router.replace(moneySavingsPath(result.id));
        return;
      }
      setErrorCode(
        result.status === "error"
          ? result.code
          : CLIENT_ACTION_ERROR_CODE.OFFLINE,
      );
    });
  });

  return (
    <div
      className="flex min-h-full flex-col gap-(--space-4)"
      data-testid="savings-create-wizard"
    >
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      <div
        className="flex items-center justify-between gap-(--space-3)"
        data-testid="savings-step-indicator"
      >
        <div className="flex items-center gap-(--space-2)">
          {STEPS.map((item, index) => (
            <span
              key={item}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-[var(--duration-fast)] ${index === stepIndex ? "w-8 bg-accent" : index < stepIndex ? "w-4 bg-accent/55" : "w-4 bg-border-subtle"}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <Text size="xs" tone="secondary" weight="medium">
          {t("stepCount", { current: stepIndex + 1, total: STEPS.length })}
        </Text>
      </div>

      <MotionStep
        stepKey={step}
        direction={
          direction === "forward"
            ? MotionStepDirection.FORWARD
            : MotionStepDirection.BACKWARD
        }
      >
        {step === FlowStep.PRODUCT ? (
          <section
            className="flex flex-col gap-(--space-5)"
            aria-labelledby="savings-product-title"
          >
            <div className="space-y-(--space-1)">
              <Text
                as="div"
                role="heading"
                aria-level={1}
                id="savings-product-title"
                size="lg"
                weight="semibold"
              >
                {t("productTitle")}
              </Text>
              <Text size="sm" tone="secondary">
                {t("productSubtitle")}
              </Text>
            </div>
            {Array.from(new Set(providers.map((item) => item.savingType)))
              .length > 1 ? (
              <div className="space-y-(--space-2)">
                <Text size="sm" weight="semibold">
                  {t("savingTypeLabel")}
                </Text>
                <div className="grid grid-cols-2 gap-(--space-2)">
                  {Array.from(
                    new Set(providers.map((item) => item.savingType)),
                  ).map((type) => (
                    <SelectionCard
                      key={type}
                      selected={selectedProvider?.savingType === type}
                      onPress={() => {
                        const provider = providers.find(
                          (item) => item.savingType === type,
                        );
                        if (provider) selectProvider(provider.id);
                      }}
                      testId={`savings-type-${type}`}
                    >
                      <span className="flex items-center gap-(--space-2)">
                        <AppIcon
                          icon={providerIcon(type)}
                          size="sm"
                          className="text-accent"
                        />
                        <span>
                          <Text size="sm" weight="medium">
                            {savingTypeLabel(t, type)}
                          </Text>
                          <Text size="xs" tone="secondary">
                            {t("typeHint")}
                          </Text>
                        </span>
                      </span>
                    </SelectionCard>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="space-y-(--space-2)">
              <FinancialScopeField
                value={financialScope}
                onChange={(next) => setValue("financialScope", next)}
                testId="savings-financial-scope"
              />
            </div>
            <div className="space-y-(--space-2)">
              <Text size="sm" weight="semibold">
                {t("providerLabel")}
              </Text>
              <div className="grid gap-(--space-2)">
                {providers.map((provider) => (
                  <SelectionCard
                    key={provider.id}
                    selected={provider.id === providerId}
                    onPress={() => selectProvider(provider.id)}
                    testId={`savings-provider-${provider.id}`}
                  >
                    <span className="flex min-w-0 items-center gap-(--space-3)">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-accent-soft text-accent">
                        <AppIcon
                          icon={providerIcon(provider.savingType)}
                          size="sm"
                        />
                      </span>
                      <span className="min-w-0">
                        <Text size="sm" weight="semibold" className="truncate">
                          {provider.displayName}
                        </Text>
                        <Text size="xs" tone="secondary">
                          {savingTypeLabel(t, provider.savingType)}
                        </Text>
                      </span>
                    </span>
                  </SelectionCard>
                ))}
              </div>
            </div>
            <div className="space-y-(--space-2)">
              <div className="flex items-end justify-between gap-(--space-2)">
                <Text size="sm" weight="semibold">
                  {t("packageLabel")}
                </Text>
                <Text size="xs" tone="secondary">
                  {t("packageHint")}
                </Text>
              </div>
              {packages.length ? (
                <div className="grid gap-(--space-2)">
                  {packages.map((pkg) => (
                    <SelectionCard
                      key={pkg.id}
                      selected={pkg.id === packageId}
                      onPress={() => {
                        setValue("packageId", pkg.id);
                        setValue("targetPackageId", pkg.id);
                      }}
                      testId={`savings-package-${pkg.id}`}
                    >
                      <span className="min-w-0">
                        <Text size="sm" weight="semibold">
                          {t("termDays", { days: pkg.durationDays })}
                        </Text>
                        <Text size="xs" tone="secondary">
                          {rate(pkg.annualInterestRate)}% / {t("year")}
                        </Text>
                      </span>
                      <Text size="xs" tone="secondary" className="shrink-0">
                        {t("maturityPreview", {
                          date: date(maturityDateForPackage(pkg, startDate)),
                        })}
                      </Text>
                    </SelectionCard>
                  ))}
                </div>
              ) : (
                <StatusAlert variant="warning" title={t("noPackages")} />
              )}
            </div>
          </section>
        ) : null}

        {step === FlowStep.DEPOSIT ? (
          <section
            className="flex flex-col gap-(--space-5)"
            aria-labelledby="savings-deposit-title"
          >
            <div className="space-y-(--space-1)">
              <Text
                as="div"
                role="heading"
                aria-level={1}
                id="savings-deposit-title"
                size="lg"
                weight="semibold"
              >
                {t("depositTitle")}
              </Text>
              <Text size="sm" tone="secondary">
                {t("depositSubtitle")}
              </Text>
            </div>
            <div className="space-y-(--space-2)">
              <Text size="sm" weight="semibold">
                {t("amountSection")}
              </Text>
              <ControlledField
                control={control}
                field={{
                  type: "amount",
                  name: "principal",
                  id: "savings-principal",
                  label: t("principalLabel"),
                  placeholder: t("amountPlaceholder"),
                  required: true,
                  testId: "savings-wizard-principal",
                  className: "text-xl font-semibold",
                }}
              />
              {selectedPackage && principal != null && !amountIsValid ? (
                <Text size="xs" tone="danger">
                  {selectedPackage.minAmount != null &&
                  principal < selectedPackage.minAmount
                    ? t("minimumAmount", {
                        amount: money(selectedPackage.minAmount),
                      })
                    : selectedPackage.maxAmount != null
                      ? t("maximumAmount", {
                          amount: money(selectedPackage.maxAmount),
                        })
                      : t("invalidAmount")}
                </Text>
              ) : null}
            </div>
            <div className="space-y-(--space-2)">
              <Text size="sm" weight="semibold">
                {t("sourceSection")}
              </Text>
              <div className="grid gap-(--space-2)">
                {accounts.map((account) => (
                  <SelectionCard
                    key={account.id}
                    selected={account.id === fundingAccountId}
                    onPress={() => setValue("fundingAccountId", account.id)}
                    testId={`savings-source-${account.id}`}
                  >
                    <span className="flex min-w-0 items-center gap-(--space-3)">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-surface-hover text-text-secondary">
                        <AppIcon icon={Wallet02Icon} size="sm" />
                      </span>
                      <span className="min-w-0">
                        <Text size="sm" weight="semibold" className="truncate">
                          {account.name}
                        </Text>
                        <Text size="xs" tone="secondary">
                          {t("availableBalance", {
                            amount: money(account.balance),
                          })}
                        </Text>
                      </span>
                    </span>
                  </SelectionCard>
                ))}
              </div>
            </div>
            <ControlledField
              control={control}
              field={{
                type: "date",
                name: "startDate",
                id: "savings-start-date",
                label: t("startDateLabel"),
                description: t("startDateHint"),
                required: true,
                testId: "savings-wizard-start-date",
              }}
            />
            <div
              className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-elevated px-(--space-4) py-(--space-4)"
              data-testid="savings-estimate"
            >
              <div className="mb-(--space-3) flex items-center justify-between gap-(--space-2)">
                <Text size="sm" weight="semibold">
                  {t("estimateTitle")}
                </Text>
                <AppIcon
                  icon={Calendar03Icon}
                  size="sm"
                  className="text-accent"
                />
              </div>
              {selectedPackage && estimate ? (
                <div>
                  <SummaryRow
                    label={t("principalLabel")}
                    value={money(principalAmount)}
                  />
                  <SummaryRow
                    label={t("rateLabel")}
                    value={`${rate(selectedPackage.annualInterestRate)}% / ${t("year")}`}
                  />
                  <SummaryRow
                    label={t("maturityLabel")}
                    value={date(estimate.maturityDate)}
                  />
                  <SummaryRow
                    label={t("interestLabel")}
                    value={money(estimate.interest)}
                  />
                  <div className="mt-(--space-2) flex items-end justify-between gap-(--space-3) border-t border-border-subtle pt-(--space-3)">
                    <Text size="sm" weight="semibold">
                      {t("maturityAmountLabel")}
                    </Text>
                    <Text
                      size="lg"
                      weight="semibold"
                      tabular
                      className="text-accent"
                    >
                      {money(estimate.total)}
                    </Text>
                  </div>
                </div>
              ) : (
                <Text size="sm" tone="secondary">
                  {t("estimateEmpty")}
                </Text>
              )}
            </div>
          </section>
        ) : null}

        {step === FlowStep.REVIEW ? (
          <section
            className="flex flex-col gap-(--space-5)"
            aria-labelledby="savings-review-title"
          >
            <div className="space-y-(--space-1)">
              <Text
                as="div"
                role="heading"
                aria-level={1}
                id="savings-review-title"
                size="lg"
                weight="semibold"
              >
                {t("reviewTitle")}
              </Text>
              <Text size="sm" tone="secondary">
                {t("reviewSubtitle")}
              </Text>
            </div>
            <div className="rounded-[var(--radius-card)] border border-accent/35 bg-accent-soft px-(--space-4) py-(--space-5)">
              <Text size="sm" tone="secondary">
                {t("reviewHeroLabel")}
              </Text>
              <Text
                as="p"
                size="lg"
                weight="semibold"
                tabular
                className="mt-(--space-1) text-2xl"
              >
                {money(principalAmount)}
              </Text>
              <Text size="sm" tone="secondary" className="mt-(--space-1)">
                {selectedPackage
                  ? `${t("termDays", { days: selectedPackage.durationDays })} · ${rate(selectedPackage.annualInterestRate)}% / ${t("year")} · ${selectedProvider?.displayName ?? t("unknown")}`
                  : t("unknown")}
              </Text>
              <div className="mt-(--space-4) border-t border-accent/20 pt-(--space-3)">
                <Text size="sm" tone="secondary">
                  {t("maturityAmountLabel")}
                </Text>
                <Text
                  as="p"
                  size="lg"
                  weight="semibold"
                  tabular
                  className="text-accent"
                >
                  {estimate ? money(estimate.total) : t("unknown")}
                </Text>
                <Text size="xs" tone="secondary">
                  {estimate
                    ? `${t("interestLabel")}: ${money(estimate.interest)} · ${t("maturityLabel")}: ${date(estimate.maturityDate)}`
                    : t("estimateEmpty")}
                </Text>
              </div>
            </div>
            <div
              className="rounded-[var(--radius-card)] border border-border-subtle bg-surface px-(--space-4) py-(--space-2)"
              data-testid="savings-review-summary"
            >
              <SummaryRow
                label={t("sourceSection")}
                value={fundingAccount?.name ?? t("unknown")}
              />
              <SummaryRow
                label={t("providerLabel")}
                value={selectedProvider?.displayName ?? t("unknown")}
              />
              <SummaryRow
                label={t("packageLabel")}
                value={
                  selectedPackage
                    ? t("termDays", { days: selectedPackage.durationDays })
                    : t("unknown")
                }
              />
              <SummaryRow label={t("startDateLabel")} value={date(startDate)} />
            </div>
            <div
              className="space-y-(--space-3)"
              data-testid="savings-wizard-maturity-instruction"
            >
              <div>
                <Text size="sm" weight="semibold">
                  {t("maturityStrategyLabel")}
                </Text>
                <Text size="xs" tone="secondary">
                  {t("maturityStrategyHint")}
                </Text>
              </div>
              <div
                className="grid gap-(--space-2)"
                role="group"
                aria-label={t("maturityStrategyLabel")}
              >
                {SETTLEMENT_RULE_VALUES.map((value) => (
                  <SelectionCard
                    key={value}
                    selected={settlementRule === value}
                    onPress={() => setValue("settlementRule", value)}
                    testId={`savings-maturity-strategy-${value}`}
                  >
                    <span>
                      <Text size="sm" weight="medium">
                        {t(
                          `settlementRules.${value}` as
                            | "settlementRules.roll_principal_interest"
                            | "settlementRules.roll_principal_only"
                            | "settlementRules.withdraw_everything",
                        )}
                      </Text>
                      <Text size="xs" tone="secondary">
                        {t(
                          `settlementRuleHints.${value}` as
                            | "settlementRuleHints.roll_principal_interest"
                            | "settlementRuleHints.roll_principal_only"
                            | "settlementRuleHints.withdraw_everything",
                        )}
                      </Text>
                    </span>
                  </SelectionCard>
                ))}
              </div>
              {settlementRule !== SettlementRule.WITHDRAW_EVERYTHING ? (
                <>
                  <div>
                    <Text size="sm" weight="semibold">
                      {t("targetPackageLabel")}
                    </Text>
                    <Text size="xs" tone="secondary">
                      {t("targetPackageHint")}
                    </Text>
                  </div>
                  <div
                    className="grid grid-cols-2 gap-(--space-2)"
                    role="group"
                    aria-label={t("targetPackageLabel")}
                  >
                    <SelectionCard
                      selected={
                        targetMode === MaturityTargetMode.KEEP_CURRENT_PACKAGE
                      }
                      onPress={() => {
                        setValue(
                          "targetMode",
                          MaturityTargetMode.KEEP_CURRENT_PACKAGE,
                        );
                        setValue(
                          "targetPackageId",
                          selectedPackage?.id ?? targetPackageId,
                        );
                      }}
                      testId="savings-target-current"
                    >
                      <span>
                        <Text size="sm" weight="medium">
                          {t("keepCurrentPackage")}
                        </Text>
                        <Text size="xs" tone="secondary">
                          {selectedPackage?.packageName ?? t("packageHint")}
                        </Text>
                      </span>
                    </SelectionCard>
                    <SelectionCard
                      selected={
                        targetMode === MaturityTargetMode.SELECT_PACKAGE
                      }
                      onPress={() =>
                        setValue(
                          "targetMode",
                          MaturityTargetMode.SELECT_PACKAGE,
                        )
                      }
                      testId="savings-target-other"
                    >
                      <span>
                        <Text size="sm" weight="medium">
                          {t("chooseOtherPackage")}
                        </Text>
                        <Text size="xs" tone="secondary">
                          {t("targetPackageHint")}
                        </Text>
                      </span>
                    </SelectionCard>
                  </div>
                  {targetMode === MaturityTargetMode.SELECT_PACKAGE ? (
                    <div className="grid gap-(--space-2)">
                      {targetPackages.map((pkg) => (
                        <SelectionCard
                          key={pkg.id}
                          selected={targetPackageId === pkg.id}
                          onPress={() => setValue("targetPackageId", pkg.id)}
                          testId={`savings-target-package-${pkg.id}`}
                        >
                          <span>
                            <Text size="sm" weight="medium">
                              {pkg.packageName ||
                                t("termDays", { days: pkg.durationDays })}
                            </Text>
                            <Text size="xs" tone="secondary">
                              {t("termDays", { days: pkg.durationDays })} ·{" "}
                              {rate(pkg.annualInterestRate)}% / {t("year")}
                            </Text>
                          </span>
                        </SelectionCard>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
              {needsPayout ? (
                <div className="space-y-(--space-2)">
                  <Text size="sm" weight="semibold">
                    {t("payoutAccountLabel")}
                  </Text>
                  <div className="grid gap-(--space-2)">
                    {accounts.map((account) => (
                      <SelectionCard
                        key={account.id}
                        selected={settlementAccountId === account.id}
                        onPress={() =>
                          setValue("settlementAccountId", account.id)
                        }
                        testId={`savings-payout-account-${account.id}`}
                      >
                        <Text size="sm" weight="medium">
                          {account.name}
                        </Text>
                      </SelectionCard>
                    ))}
                  </div>
                </div>
              ) : (
                <Text size="xs" tone="secondary">
                  {t("noPayoutNeeded")}
                </Text>
              )}
              <div className="space-y-(--space-2)">
                <Text size="sm" weight="semibold">
                  {t("renewalPolicyLabel")}
                </Text>
                <div className="grid gap-(--space-2)">
                  {RENEWAL_POLICY_VALUES.map((value) => (
                    <SelectionCard
                      key={value}
                      selected={renewalPolicy === value}
                      onPress={() => setValue("renewalPolicy", value)}
                      testId={`savings-renewal-policy-${value}`}
                    >
                      <Text size="sm" weight="medium">
                        {t(
                          `renewalPolicies.${value}` as
                            | "renewalPolicies.always_ask"
                            | "renewalPolicies.use_saved_preference"
                            | "renewalPolicies.auto_renew_until_cancelled"
                            | "renewalPolicies.one_time_renewal",
                        )}
                      </Text>
                    </SelectionCard>
                  ))}
                </div>
              </div>
              <Text size="xs" tone="secondary">
                {t("settlementHint", {
                  account: settlementAccount?.name ?? t("noPayoutNeeded"),
                })}
              </Text>
            </div>
            <div className="rounded-[var(--radius-card)] bg-surface-hover px-(--space-4) py-(--space-3)">
              <Text size="sm" weight="medium">
                {t("flowTitle")}
              </Text>
              <Text size="sm" tone="secondary" className="mt-(--space-1)">
                {t("flowDescription", {
                  source: fundingAccount?.name ?? t("unknown"),
                  amount: money(principalAmount),
                })}
              </Text>
            </div>
          </section>
        ) : null}
      </MotionStep>

      <BottomActionBar className="mt-auto">
        <div
          className={`flex gap-(--space-2) ${stepIndex === 0 ? "justify-end" : "justify-between"}`}
        >
          {stepIndex > 0 ? (
            <Button
              variant="secondary"
              className="min-h-11 flex-1"
              data-testid="savings-wizard-back"
              onPress={goBack}
            >
              {t("back")}
            </Button>
          ) : (
            <Button variant="secondary" className="min-h-11" onPress={exitFlow}>
              {t("cancel")}
            </Button>
          )}
          {step === FlowStep.REVIEW ? (
            <Button
              variant="primary"
              className="min-h-11 flex-[1.6]"
              data-testid="savings-wizard-confirm"
              isDisabled={isPending || !canContinue}
              onPress={() => void confirm()}
            >
              {isPending ? t("confirming") : t("confirm")}
            </Button>
          ) : (
            <Button
              variant="primary"
              className="min-h-11 flex-[1.6]"
              data-testid="savings-wizard-next"
              isDisabled={!canContinue}
              onPress={goNext}
            >
              {step === FlowStep.DEPOSIT ? t("reviewCta") : t("next")}
            </Button>
          )}
        </div>
      </BottomActionBar>
    </div>
  );
}
