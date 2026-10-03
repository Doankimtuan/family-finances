"use client";

import {
  Suspense,
  use,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import type { ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { moneySavingsPath } from "@/modules/tenancy/application/app-path";
import { useSavingsReturn } from "./create-saving-navigation";
import {
  MaturityFallbackPolicy,
  RenewalPolicy,
  SettlementRule,
  SavingType,
  MaturityTargetMode,
  RENEWAL_POLICY_VALUES,
  SETTLEMENT_RULE_VALUES,
  SavingsCreateMode,
  SAVINGS_PRINCIPAL_QUICK_ADD_VALUES,
} from "@/modules/savings/application/savings-constants";
import {
  addSavingsTerm,
  minimumSavingsStartDate,
  calculateInterest,
  calculateSettlementBreakdown,
  createSavingCommonInputSchema,
  InterestCalcMethod,
  SavingsTermUnit,
  SavingsTaxRule,
  type SavingsTermUnit as SavingsTermUnitValue,
} from "@/modules/savings/application/client";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import { FinancialScopeField } from "@/shared/patterns/financial-scope-field";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { SavingsUnavailable } from "../savings-unavailable";
import { Progress } from "@/shared/ui/progress";
import { Card } from "@/shared/patterns/card";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { StatusAlert } from "@/shared/ui/status-alert";
import { InlineAlert } from "@/shared/ui/inline-alert";
import {
  CurrencyInput,
  FormField,
  SelectField,
  TextField,
} from "@/shared/ui/form";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "@/shared/patterns/financial-value";
import {
  BottomActionBar,
  BottomActionBarLayout,
} from "@/shared/patterns/bottom-action-bar";
import {
  ChoiceTile,
  ChoiceTileGroup,
  ChoiceTileLayout,
} from "@/shared/patterns/choice-tile";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import {
  ACTION_ICONS,
  FINANCE_ICONS,
  SAVINGS_PROVIDER_ICONS,
  UTILITY_ICONS,
} from "@/shared/ui/icon-registry";
import { MotionStep, MotionStepDirection } from "@/shared/motion";
import { cn } from "@/shared/utils/cn";
import { SavingsFactRow, SavingsFactsCard } from "../savings-facts";
import { SavingsSectionTitle } from "../savings-section-title";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency } from "@/shared/i18n/formatters";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/client";
import { todayIsoDate } from "@/shared/utils/iso-date";
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
  taxRule?: SavingsTaxRule;
  taxRatePercent?: number;
  renewableAvailable?: boolean;
};
type CreateSavingData = {
  accounts: AccountOption[];
  providers: ProviderOption[];
  packagesByProvider: Record<string, PackageOption[]>;
};
type Props = {
  data: Promise<CreateSavingData>;
  unavailable: Parameters<typeof SavingsUnavailable>[0];
};

function DeferredSavingData({
  data,
  onReady,
}: {
  data: Promise<CreateSavingData>;
  onReady: (data: CreateSavingData) => void;
}) {
  const resolved = use(data);
  // Hand the streamed server result to the already-mounted form; no browser fetch.
  useEffect(() => onReady(resolved), [resolved, onReady]);
  return null;
}

const FlowStep = {
  SETUP: "setup",
  REVIEW: "review",
} as const;
type FlowStep = (typeof FlowStep)[keyof typeof FlowStep];
type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

const STEPS = [FlowStep.SETUP, FlowStep.REVIEW] as const;

const savingFormSchema = z.object({
  financialScope: createSavingCommonInputSchema.shape.financialScope,
  creationMode: z.enum([
    SavingsCreateMode.LIVE_DEPOSIT,
    SavingsCreateMode.HISTORICAL_OPENING,
  ]),
  fundingAccountId: z.string().uuid().nullable(),
  settlementAccountId: createSavingCommonInputSchema.shape.settlementAccountId,
  providerId: z.string().uuid().nullable(),
  packageId: z.string().uuid().nullable(),
  principal: createSavingCommonInputSchema.shape.principal.nullable(),
  startDate: z.string().min(1),
  renewalPolicy: createSavingCommonInputSchema.shape.renewalPolicy,
  settlementRule: createSavingCommonInputSchema.shape.settlementRule,
  productName: z.string().trim().min(1),
  targetMode: z.enum(
    Object.values(MaturityTargetMode) as [
      MaturityTargetMode,
      ...MaturityTargetMode[],
    ],
  ),
  targetPackageId: z.string().uuid().nullable(),
});
type SavingFormValues = z.input<typeof savingFormSchema>;

function createDefaultValues(
  accounts: AccountOption[],
  providers: ProviderOption[],
  packagesByProvider: Record<string, PackageOption[]>,
) {
  const providerId =
    providers.find(
      (provider) =>
        provider.savingType === SavingType.MANUAL_SAVING &&
        packagesByProvider[provider.id]?.length,
    )?.id ??
    providers.find((provider) => packagesByProvider[provider.id]?.length)?.id ??
    providers[0]?.id ??
    "";
  const packageId = packagesByProvider[providerId]?.[0]?.id ?? "";
  return {
    financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
    creationMode: SavingsCreateMode.LIVE_DEPOSIT,
    fundingAccountId: accounts[0]?.id ?? null,
    settlementAccountId: accounts[1]?.id ?? accounts[0]?.id ?? "",
    providerId,
    packageId,
    productName:
      providers.find((item) => item.id === providerId)?.displayName ?? "",
    principal: null,
    startDate: new Date().toISOString().slice(0, 10),
    renewalPolicy: RenewalPolicy.ALWAYS_ASK,
    settlementRule: SettlementRule.WITHDRAW_EVERYTHING,
    targetMode: MaturityTargetMode.KEEP_CURRENT_PACKAGE,
    targetPackageId: packageId || null,
  } satisfies SavingFormValues;
}

function accountSelectOptions(
  accounts: AccountOption[],
  money: (amount: number) => string,
  availablePrefix: string,
) {
  return accounts.map((account) => ({
    id: account.id,
    textValue: account.name,
    label: (
      <span className="flex min-w-0 flex-1 items-center justify-between gap-(--space-3)">
        <span className="truncate">{account.name}</span>
        <span className="shrink-0 text-xs text-text-secondary">
          {availablePrefix}{" "}
          <FinancialValue>{money(account.balance)}</FinancialValue>
        </span>
      </span>
    ),
  }));
}

function StepHeader({
  id,
  title,
  subtitle,
}: {
  id: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-(--space-1)">
      <Text
        as="div"
        role="heading"
        aria-level={2}
        id={id}
        size="lg"
        weight="semibold"
        className="text-pretty tracking-tight"
      >
        {title}
      </Text>
      <Text size="sm" tone="secondary" className="text-pretty">
        {subtitle}
      </Text>
    </div>
  );
}

function SelectionGroup({
  label,
  hint,
  ariaLabel,
  children,
}: {
  label?: string;
  hint?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-(--space-2)">
      {label || hint ? (
        <div className="flex items-end justify-between gap-(--space-2)">
          {label ? <SavingsSectionTitle>{label}</SavingsSectionTitle> : null}
          {hint ? (
            <Text size="xs" tone="secondary" className="shrink-0 text-pretty">
              {hint}
            </Text>
          ) : null}
        </div>
      ) : null}
      <div role="group" aria-label={ariaLabel ?? label}>
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <div className="divide-y divide-divider">{children}</div>
        </Card>
      </div>
    </div>
  );
}

function SelectionRow({
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
      className={cn(
        "flex min-h-14 w-full items-center gap-(--space-3) px-(--space-4) py-(--space-3) text-left",
        "transition-[background-color,transform] duration-(--duration-fast)",
        "hover:bg-surface-hover active:scale-(--press-scale)",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring",
        selected && "bg-primary-soft",
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {selected ? (
        <AppIcon
          icon={ACTION_ICONS.check}
          size={AppIconSize.SM}
          className="shrink-0 text-primary"
        />
      ) : null}
    </button>
  );
}

export function CreateSavingWizard({ data, unavailable }: Props) {
  const [readyData, setReadyData] = useState<
    (CreateSavingData & { defaults: SavingFormValues }) | null
  >(null);
  const receiveData = useCallback((resolved: CreateSavingData) => {
    setReadyData((previous) => ({
      ...resolved,
      // Seed once; refreshed options must not silently replace selected accounts.
      defaults:
        previous?.defaults ??
        createDefaultValues(
          resolved.accounts,
          resolved.providers,
          resolved.packagesByProvider,
        ),
    }));
  }, []);
  const accounts = readyData?.accounts ?? [];
  const providers = readyData?.providers ?? [];
  const packagesByProvider = readyData?.packagesByProvider ?? {};
  const t = useTranslations("money.savingsWizard");
  const tErr = useTranslations("money.products.errors");
  const locale = useLocale();
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const defaultValues = readyData?.defaults ?? createDefaultValues([], [], {});
  const { control, handleSubmit, reset, setValue, register, formState } =
    useForm<SavingFormValues>({
      resolver: zodResolver(savingFormSchema),
      defaultValues,
      values: defaultValues,
      // Server defaults arrive once. Preserve edits made during streaming.
      resetOptions: { keepDirtyValues: true },
    });
  // RHF needs the dirty-fields subscription to preserve controlled early edits.
  void formState.dirtyFields;
  const values = useWatch({ control });
  const fundingAccountId = values.fundingAccountId ?? "";
  const creationMode = values.creationMode ?? SavingsCreateMode.LIVE_DEPOSIT;
  const financialScope = values.financialScope ?? FINANCIAL_SCOPE.HOUSEHOLD;
  const settlementAccountId = values.settlementAccountId ?? "";
  const providerId = values.providerId ?? "";
  const packageId = values.packageId ?? "";
  const principal = values.principal ?? null;
  const startDate = values.startDate ?? "";
  const today = todayIsoDate();
  const historicalStartInvalid =
    creationMode === SavingsCreateMode.HISTORICAL_OPENING &&
    (!startDate || startDate >= today);
  const settlementRule =
    values.settlementRule ?? SettlementRule.WITHDRAW_EVERYTHING;
  const renewalPolicy = values.renewalPolicy ?? RenewalPolicy.ALWAYS_ASK;
  const targetMode =
    values.targetMode ?? MaturityTargetMode.KEEP_CURRENT_PACKAGE;
  const targetPackageId = values.targetPackageId ?? "";

  const step = STEPS[stepIndex];
  const stepLabels = [t("stepSetup"), t("stepReview")];
  const packages = packagesByProvider[providerId] ?? [];
  const selectedPackage =
    packages.find((item) => item.id === packageId) ?? null;
  const selectedProvider =
    providers.find((item) => item.id === providerId) ?? null;
  const manualProvider = providers.find(
    (provider) => provider.savingType === SavingType.MANUAL_SAVING,
  );
  const platformProvider = providers.find(
    (provider) => provider.savingType !== SavingType.MANUAL_SAVING,
  );
  const isManualSaving =
    selectedProvider?.savingType === SavingType.MANUAL_SAVING;
  const providerOptions = isManualSaving
    ? providers.filter(
        (provider) => provider.savingType === SavingType.MANUAL_SAVING,
      )
    : providers.filter(
        (provider) => provider.savingType !== SavingType.MANUAL_SAVING,
      );
  const fundingAccount =
    accounts.find((item) => item.id === fundingAccountId) ?? null;
  const settlementAccount =
    accounts.find((item) => item.id === settlementAccountId) ?? null;
  const hasValidSettlementAccount = settlementAccount != null;
  const hasValidFundingSelection =
    creationMode === SavingsCreateMode.HISTORICAL_OPENING ||
    Boolean(
      fundingAccount &&
      settlementAccount &&
      fundingAccount.id !== settlementAccount.id,
    );
  const principalAmount = principal ?? 0;
  const selectProvider = (nextProviderId: string) => {
    const currentProvider = providers.find(
      (provider) => provider.id === providerId,
    );
    const nextProvider = providers.find(
      (provider) => provider.id === nextProviderId,
    );
    const nextPackageId = packagesByProvider[nextProviderId]?.[0]?.id ?? "";
    setValue("providerId", nextProviderId);
    setValue("packageId", nextPackageId);
    setValue("targetPackageId", nextPackageId || null);
    if (
      !values.productName?.trim() ||
      values.productName === currentProvider?.displayName
    ) {
      setValue("productName", nextProvider?.displayName ?? "");
    }
  };
  const selectCreationMode = (nextMode: SavingsCreateMode) => {
    setValue("creationMode", nextMode, { shouldDirty: true });
    if (nextMode === SavingsCreateMode.HISTORICAL_OPENING) {
      setValue("fundingAccountId", null, { shouldDirty: true });
      return;
    }
    if (!fundingAccount || fundingAccount.id === settlementAccountId) {
      setValue(
        "fundingAccountId",
        accounts.find((account) => account.id !== settlementAccountId)?.id ??
          accounts[0]?.id ??
          null,
      );
    }
  };
  const maturityDateForPackage = (pkg: PackageOption, value: string) =>
    value
      ? addSavingsTerm(value, {
          amount: pkg.termAmount ?? pkg.durationDays,
          unit: pkg.termUnit ?? SavingsTermUnit.DAY,
        })
      : "";
  const minimumStartDate = selectedPackage
    ? minimumSavingsStartDate(today, {
        amount: selectedPackage.termAmount ?? selectedPackage.durationDays,
        unit: selectedPackage.termUnit ?? SavingsTermUnit.DAY,
      })
    : today;
  const startDateOutsideTerm =
    !startDate || startDate < minimumStartDate || startDate > today;

  const estimate = (() => {
    if (!selectedPackage || !startDate || principalAmount <= 0) return null;
    const maturityDate = maturityDateForPackage(selectedPackage, startDate);
    const fullTermInterest = calculateInterest({
      principal: principalAmount,
      annualRate: selectedPackage.annualInterestRate,
      startDate,
      endDate: maturityDate,
      method:
        selectedPackage.interestCalculationMethod ?? InterestCalcMethod.SIMPLE,
    }).totalInterest;
    const accruedInterest = calculateInterest({
      principal: principalAmount,
      annualRate: selectedPackage.annualInterestRate,
      startDate,
      endDate: maturityDate,
      method:
        selectedPackage.interestCalculationMethod ?? InterestCalcMethod.SIMPLE,
      asOfDate: today < maturityDate ? today : maturityDate,
    }).totalInterest;
    const breakdown = calculateSettlementBreakdown({
      principal: principalAmount,
      grossInterest: fullTermInterest,
      taxRule: selectedPackage.taxRule,
      taxRatePercent: selectedPackage.taxRatePercent,
    });
    const accruedBreakdown = calculateSettlementBreakdown({
      principal: principalAmount,
      grossInterest: accruedInterest,
      taxRule: selectedPackage.taxRule,
      taxRatePercent: selectedPackage.taxRatePercent,
    });
    return { maturityDate, breakdown, accruedBreakdown };
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
  const hasValidMaturitySelection = Boolean(
    hasValidSettlementAccount &&
    renewalPolicy &&
    settlementRule &&
    (settlementRule === SettlementRule.WITHDRAW_EVERYTHING ||
      targetMode === MaturityTargetMode.KEEP_CURRENT_PACKAGE ||
      targetPackageId),
  );
  const canContinue =
    step === FlowStep.SETUP
      ? Boolean(
          selectedProvider &&
          selectedPackage &&
          values.productName?.trim() &&
          amountIsValid &&
          startDate &&
          !historicalStartInvalid &&
          !startDateOutsideTerm &&
          estimate?.maturityDate != null &&
          estimate.maturityDate >= today &&
          hasValidFundingSelection &&
          hasValidMaturitySelection,
        )
      : Boolean(hasValidFundingSelection && hasValidMaturitySelection);
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
  const exitFlow = useSavingsReturn();

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
    const hasValidSubmittedAccounts =
      accounts.some(
        (account) => account.id === submitted.settlementAccountId,
      ) &&
      (submitted.creationMode === SavingsCreateMode.HISTORICAL_OPENING ||
        Boolean(
          submitted.fundingAccountId &&
          submitted.fundingAccountId !== submitted.settlementAccountId &&
          accounts.some((account) => account.id === submitted.fundingAccountId),
        ));
    if (!hasValidSubmittedAccounts) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    const baseInput = {
      financialScope: submitted.financialScope,
      settlementAccountId: submitted.settlementAccountId,
      principal: submitted.principal ?? 0,
      productName: submitted.productName,
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
      idempotencyKey,
    };
    const input =
      submitted.creationMode === SavingsCreateMode.HISTORICAL_OPENING
        ? {
            ...baseInput,
            creationMode: SavingsCreateMode.HISTORICAL_OPENING,
            fundingAccountId: null,
            providerId: submitted.providerId,
            packageId: submitted.packageId,
            startDate: submitted.startDate ?? "",
          }
        : {
            ...baseInput,
            creationMode: SavingsCreateMode.LIVE_DEPOSIT,
            fundingAccountId: submitted.fundingAccountId ?? "",
            providerId: submitted.providerId ?? "",
            packageId: submitted.packageId ?? "",
          };
    startTransition(async () => {
      const result = await createSavingAction(input);
      if (result.status === "success" && result.id) {
        reset(defaultValues, { keepDirtyValues: false });
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

  if (readyData && accounts.length === 0) {
    return <SavingsUnavailable {...unavailable} />;
  }

  return (
    <div
      className="flex min-h-full flex-col gap-(--space-4)"
      data-testid="savings-create-wizard"
      data-ready={readyData !== null}
    >
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      <div
        className="flex flex-col gap-(--space-2) rounded-(--radius-card) border border-border-subtle bg-surface px-(--space-3) py-(--space-3)"
        data-testid="savings-step-indicator"
      >
        <div className="flex items-center justify-between gap-(--space-3)">
          <Text size="xs" tone="secondary" weight="medium">
            {t("stepOf", {
              current: stepIndex + 1,
              total: STEPS.length,
            })}
          </Text>
          <Text size="xs" weight="semibold" className="text-savings">
            {stepLabels[stepIndex]}
          </Text>
        </div>
        <Progress
          value={stepIndex + 1}
          max={STEPS.length}
          label={t("stepOf", {
            current: stepIndex + 1,
            total: STEPS.length,
          })}
          showLabel={false}
          tone={IconContainerTone.SAVINGS}
          className="gap-0"
          trackClassName="h-(--space-2) bg-progress-track"
          indicatorClassName="bg-savings"
        />
        <ol
          className="grid grid-cols-2 gap-(--space-2)"
          aria-label={t("stepOf", {
            current: stepIndex + 1,
            total: STEPS.length,
          })}
        >
          {stepLabels.map((label, index) => (
            <li
              key={STEPS[index]}
              aria-current={index === stepIndex ? "step" : undefined}
              className={cn(
                "min-w-0 text-center text-xs leading-snug",
                index === stepIndex
                  ? "font-semibold text-text-primary"
                  : "text-text-muted",
              )}
            >
              {label}
            </li>
          ))}
        </ol>
      </div>

      <MotionStep
        stepKey={step}
        direction={
          direction === "forward"
            ? MotionStepDirection.FORWARD
            : MotionStepDirection.BACKWARD
        }
      >
        {step === FlowStep.SETUP ? (
          <section
            className="flex flex-col gap-(--space-5)"
            aria-labelledby="savings-product-title"
          >
            <StepHeader
              id="savings-product-title"
              title={t("productTitle")}
              subtitle={t("productSubtitle")}
            />
            <div className="flex flex-col gap-(--space-2)">
              <SavingsSectionTitle>
                {t("creationModeLabel")}
              </SavingsSectionTitle>
              <div role="radiogroup" aria-label={t("creationModeLabel")}>
                <ChoiceTileGroup>
                  <ChoiceTile
                    selected={creationMode === SavingsCreateMode.LIVE_DEPOSIT}
                    onPress={() =>
                      selectCreationMode(SavingsCreateMode.LIVE_DEPOSIT)
                    }
                    testId="savings-create-mode-live"
                    role="radio"
                  >
                    <span>
                      <Text size="sm" weight="medium">
                        {t("liveDepositMode")}
                      </Text>
                      <Text size="xs" tone="secondary" className="text-pretty">
                        {t("liveDepositHint")}
                      </Text>
                    </span>
                  </ChoiceTile>
                  <ChoiceTile
                    selected={
                      creationMode === SavingsCreateMode.HISTORICAL_OPENING
                    }
                    onPress={() =>
                      selectCreationMode(SavingsCreateMode.HISTORICAL_OPENING)
                    }
                    testId="savings-create-mode-historical"
                    role="radio"
                  >
                    <span>
                      <Text size="sm" weight="medium">
                        {t("historicalOpeningMode")}
                      </Text>
                      <Text size="xs" tone="secondary" className="text-pretty">
                        {t("historicalOpeningHint")}
                      </Text>
                    </span>
                  </ChoiceTile>
                </ChoiceTileGroup>
              </div>
            </div>
            <TextField
              id="savings-product-name"
              label={t("savingNameLabel")}
              required
              registration={register("productName")}
            />
            {manualProvider || platformProvider ? (
              <div className="flex flex-col gap-(--space-2)">
                <SavingsSectionTitle>
                  {t("savingTypeLabel")}
                </SavingsSectionTitle>
                <div role="radiogroup" aria-label={t("savingTypeLabel")}>
                  <ChoiceTileGroup>
                    {manualProvider ? (
                      <ChoiceTile
                        selected={isManualSaving}
                        onPress={() => selectProvider(manualProvider.id)}
                        testId="savings-type-manual"
                        role="radio"
                        layout={ChoiceTileLayout.STACKED}
                        icon={
                          <IconContainer
                            tone={
                              isManualSaving
                                ? IconContainerTone.SAVINGS
                                : IconContainerTone.NEUTRAL
                            }
                            size="md"
                            className="border border-border-subtle bg-surface"
                          >
                            <AppIcon
                              icon={SAVINGS_PROVIDER_ICONS.wallet}
                              size={AppIconSize.XL}
                              emphasized
                            />
                          </IconContainer>
                        }
                        className="min-h-28 gap-(--space-3) py-(--space-4)"
                      >
                        <span>
                          <Text size="sm" weight="medium">
                            {t("savingTypes.manual_saving")}
                          </Text>
                          <Text
                            size="xs"
                            tone="secondary"
                            className="text-pretty"
                          >
                            {t("typeHintManual")}
                          </Text>
                        </span>
                      </ChoiceTile>
                    ) : null}
                    {platformProvider ? (
                      <ChoiceTile
                        selected={Boolean(selectedProvider) && !isManualSaving}
                        onPress={() => selectProvider(platformProvider.id)}
                        testId="savings-type-platform"
                        role="radio"
                        layout={ChoiceTileLayout.STACKED}
                        icon={
                          <IconContainer
                            tone={
                              !isManualSaving
                                ? IconContainerTone.SAVINGS
                                : IconContainerTone.NEUTRAL
                            }
                            size="md"
                            className="border border-border-subtle bg-surface"
                          >
                            <AppIcon
                              icon={SAVINGS_PROVIDER_ICONS.smartphone}
                              size={AppIconSize.XL}
                              emphasized
                            />
                          </IconContainer>
                        }
                        className="min-h-28 gap-(--space-3) py-(--space-4)"
                      >
                        <span>
                          <Text size="sm" weight="medium">
                            {t("savingTypes.digital_saving")}
                          </Text>
                          <Text
                            size="xs"
                            tone="secondary"
                            className="text-pretty"
                          >
                            {t("typeHintPlatform")}
                          </Text>
                        </span>
                      </ChoiceTile>
                    ) : null}
                  </ChoiceTileGroup>
                </div>
              </div>
            ) : null}
            <div className="flex flex-col gap-(--space-2)">
              <FinancialScopeField
                value={financialScope}
                onChange={(next) =>
                  setValue("financialScope", next, { shouldDirty: true })
                }
                testId="savings-financial-scope"
              />
            </div>
          </section>
        ) : null}

        <Suspense
          fallback={
            <section
              aria-busy="true"
              aria-label={t("depositTitle")}
              data-testid="savings-create-data-loading"
              className="flex flex-col gap-(--space-3)"
            >
              <Skeleton.Text width="60%" />
              <Skeleton.Card />
            </section>
          }
        >
          <DeferredSavingData data={data} onReady={receiveData} />
        </Suspense>

        {readyData && step === FlowStep.SETUP ? (
          <section
            className="flex flex-col gap-(--space-5)"
            aria-labelledby="savings-deposit-title"
          >
            <StepHeader
              id="savings-deposit-title"
              title={t("depositTitle")}
              subtitle={t("depositSubtitle")}
            />
            <InlineAlert>{t("ledgerCaptureInfo")}</InlineAlert>
            <Card tone="default" className="gap-(--space-3) p-(--space-3)">
              <div className="flex flex-col gap-(--space-2)">
                <SavingsSectionTitle>
                  {t("providerSectionTitle")}
                </SavingsSectionTitle>
                <div
                  role="radiogroup"
                  aria-label={t("providerLabel")}
                  data-testid="savings-provider"
                  className="-mx-(--space-3) flex max-w-full snap-x gap-(--space-2) overflow-x-auto px-(--space-3) pb-(--space-1)"
                >
                  {providerOptions.map((provider) => (
                    <ChoiceTile
                      key={provider.id}
                      selected={provider.id === providerId}
                      onPress={() => selectProvider(provider.id)}
                      role="radio"
                      testId={`savings-provider-${provider.id}`}
                      icon={
                        <IconContainer
                          tone={IconContainerTone.SAVINGS}
                          size="sm"
                        >
                          <AppIcon
                            icon={
                              provider.savingType === SavingType.MANUAL_SAVING
                                ? SAVINGS_PROVIDER_ICONS.wallet
                                : SAVINGS_PROVIDER_ICONS.bank
                            }
                            size={AppIconSize.MD}
                          />
                        </IconContainer>
                      }
                      className="w-44 flex-none snap-start"
                    >
                      <Text size="xs" weight="medium" className="line-clamp-2">
                        {provider.displayName}
                      </Text>
                    </ChoiceTile>
                  ))}
                </div>
              </div>
              {packages.length ? (
                <div className="flex flex-col gap-(--space-2)">
                  <SavingsSectionTitle>{t("packageLabel")}</SavingsSectionTitle>
                  <div role="radiogroup" aria-label={t("packageLabel")}>
                    <ChoiceTileGroup>
                      {packages.map((pkg) => (
                        <ChoiceTile
                          key={pkg.id}
                          selected={pkg.id === packageId}
                          onPress={() => {
                            setValue("packageId", pkg.id);
                            setValue("targetPackageId", pkg.id);
                          }}
                          role="radio"
                          testId={`savings-package-${pkg.id}`}
                          className="min-h-20"
                        >
                          <span>
                            <Text size="sm" weight="semibold">
                              {t("termDays", { days: pkg.durationDays })}
                            </Text>
                            <Text size="xs" tone="secondary">
                              {rate(pkg.annualInterestRate)}% / {t("year")}
                            </Text>
                          </span>
                        </ChoiceTile>
                      ))}
                    </ChoiceTileGroup>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-(--space-2)">
                  <SavingsSectionTitle>{t("packageLabel")}</SavingsSectionTitle>
                  <StatusAlert variant="warning" title={t("noPackages")} />
                </div>
              )}
            </Card>
            <Card tone="default" className="gap-(--space-3) p-(--space-3)">
              <div className="flex flex-col gap-(--space-2)">
                <SavingsSectionTitle>{t("amountSection")}</SavingsSectionTitle>
                <Controller
                  control={control}
                  name="principal"
                  render={({ field, fieldState }) => (
                    <CurrencyInput
                      id="savings-principal"
                      label={t("principalLabel")}
                      value={field.value ?? null}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder={t("amountPlaceholder")}
                      required
                      showWordsPreview={false}
                      error={fieldState.error?.message}
                      data-testid="savings-wizard-principal"
                      className="text-xl font-semibold"
                    />
                  )}
                />
                {selectedPackage && principal != null && !amountIsValid ? (
                  <Text size="xs" tone="danger">
                    {selectedPackage.minAmount != null &&
                    principal < selectedPackage.minAmount ? (
                      <>
                        {t("minimumAmountPrefix")}{" "}
                        <FinancialValue>
                          {money(selectedPackage.minAmount)}
                        </FinancialValue>
                      </>
                    ) : selectedPackage.maxAmount != null ? (
                      <>
                        {t("maximumAmountPrefix")}{" "}
                        <FinancialValue>
                          {money(selectedPackage.maxAmount)}
                        </FinancialValue>
                      </>
                    ) : (
                      t("invalidAmount")
                    )}
                  </Text>
                ) : null}
                <div
                  className="grid grid-cols-4 gap-(--space-2)"
                  role="group"
                  aria-label={t("quickAddAmountLabel")}
                >
                  {SAVINGS_PRINCIPAL_QUICK_ADD_VALUES.map((increment) => (
                    <Button
                      key={increment}
                      variant="secondary"
                      size="sm"
                      className="min-h-11 min-w-0 w-full px-(--space-1)"
                      onPress={() =>
                        setValue("principal", (principal ?? 0) + increment, {
                          shouldValidate: true,
                        })
                      }
                    >
                      +
                      {formatCurrency(increment, DEFAULT_CURRENCY, locale, {
                        maximumFractionDigits: 0,
                        notation: "compact",
                      })}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-(--space-3) rounded-(--radius-control) border border-border-subtle bg-surface-muted p-(--space-3)">
                  <div className="flex min-w-0 items-center gap-(--space-2)">
                    <IconContainer tone={IconContainerTone.SAVINGS} size="sm">
                      <AppIcon
                        icon={SAVINGS_PROVIDER_ICONS.vault}
                        size={AppIconSize.SM}
                      />
                    </IconContainer>
                    <div className="min-w-0">
                      <Text size="sm" weight="medium">
                        {t("interestLockTitle")}
                      </Text>
                      <Text size="xs" tone="secondary">
                        {selectedPackage
                          ? t("termDays", {
                              days: selectedPackage.durationDays,
                            })
                          : t("packageHint")}
                      </Text>
                    </div>
                  </div>
                  <Text
                    size="sm"
                    weight="semibold"
                    className="shrink-0 text-primary"
                  >
                    {selectedPackage
                      ? `${rate(selectedPackage.annualInterestRate)}%/${t("year")}`
                      : t("unknown")}
                  </Text>
                </div>
              </div>
            </Card>
            <div className="flex flex-col gap-(--space-3)">
              <SavingsSectionTitle>{t("timingTitle")}</SavingsSectionTitle>
              <div className="grid grid-cols-2 gap-(--space-3)">
                <ControlledField
                  control={control}
                  field={{
                    type: "date",
                    name: "startDate",
                    id: "savings-start-date",
                    label: t("startDateLabel"),
                    description: t("startDateHint"),
                    required: true,
                    minValue: minimumStartDate,
                    maxValue: today,
                    testId: "savings-wizard-start-date",
                  }}
                />
                <FormField
                  id="savings-maturity-date"
                  label={t("maturityLabel")}
                >
                  <output
                    id="savings-maturity-date"
                    className="flex min-h-11 items-center rounded-(--radius-control) border border-border-subtle bg-surface-muted px-(--space-3)"
                  >
                    <Text size="sm" weight="semibold">
                      {estimate ? date(estimate.maturityDate) : t("unknown")}
                    </Text>
                  </output>
                </FormField>
              </div>
            </div>
            {startDateOutsideTerm ? (
              <Text size="xs" tone="danger">
                {t("startDateOutsideTerm")}
              </Text>
            ) : null}
            {historicalStartInvalid ? (
              <Text size="xs" tone="danger">
                {t("historicalStartMustBePast")}
              </Text>
            ) : null}
            <Card
              tone="elevated"
              className="gap-0 overflow-hidden p-0"
              data-testid="savings-estimate"
            >
              <div className="flex items-center justify-between gap-(--space-2) px-(--space-4) pt-(--space-4) pb-(--space-2)">
                <Text size="sm" weight="semibold">
                  {t("estimateTitle")}
                </Text>
                <AppIcon
                  icon={UTILITY_ICONS.calendar}
                  size={AppIconSize.SM}
                  className="text-text-tertiary"
                />
              </div>
              {selectedPackage && estimate ? (
                <dl className="divide-y divide-divider">
                  <SavingsFactRow
                    label={t("principalLabel")}
                    value={
                      <FinancialValue>{money(principalAmount)}</FinancialValue>
                    }
                  />
                  <SavingsFactRow
                    label={t("rateLabel")}
                    value={`${rate(selectedPackage.annualInterestRate)}% / ${t("year")}`}
                  />
                  <SavingsFactRow
                    label={t("maturityLabel")}
                    value={date(estimate.maturityDate)}
                  />
                  {startDate < today ? (
                    <SavingsFactRow
                      label={t("accruedInterestLabel")}
                      value={
                        <FinancialValue>
                          {money(estimate.accruedBreakdown.grossInterest)}
                        </FinancialValue>
                      }
                    />
                  ) : null}
                  <SavingsFactRow
                    label={t("interestLabel")}
                    value={
                      <FinancialValue>
                        {money(estimate.breakdown.grossInterest)}
                      </FinancialValue>
                    }
                  />
                  {estimate.breakdown.tax > 0 ? (
                    <SavingsFactRow
                      label={t("taxLabel")}
                      value={
                        <FinancialValue>
                          {money(estimate.breakdown.tax)}
                        </FinancialValue>
                      }
                    />
                  ) : null}
                  {estimate.breakdown.fee > 0 ? (
                    <SavingsFactRow
                      label={t("feeLabel")}
                      value={
                        <FinancialValue>
                          {money(estimate.breakdown.fee)}
                        </FinancialValue>
                      }
                    />
                  ) : null}
                  <SavingsFactRow
                    label={t("netInterestLabel")}
                    value={
                      <FinancialValue>
                        {money(estimate.breakdown.netInterest)}
                      </FinancialValue>
                    }
                  />
                  <SavingsFactRow
                    label={t("maturityAmountLabel")}
                    value={
                      <FinancialValue>
                        {money(estimate.breakdown.totalCashReceived)}
                      </FinancialValue>
                    }
                    emphasis
                  />
                </dl>
              ) : (
                <Text
                  size="sm"
                  tone="secondary"
                  className="px-(--space-4) pb-(--space-4) text-pretty"
                >
                  {t("estimateEmpty")}
                </Text>
              )}
            </Card>
            <Card tone="default" className="gap-(--space-3) p-(--space-3)">
              <SavingsSectionTitle>
                {t("accountSectionTitle")}
              </SavingsSectionTitle>
              {creationMode === SavingsCreateMode.LIVE_DEPOSIT ? (
                <>
                  {accounts.length < 2 ? (
                    <StatusAlert
                      variant="warning"
                      title={t("noEligibleAccounts")}
                    />
                  ) : null}
                  <SelectField
                    id="savings-source"
                    label={t("sourceSection")}
                    value={fundingAccountId ?? ""}
                    onChange={(next) => {
                      setValue("fundingAccountId", next || null);
                      if (settlementAccountId === next) {
                        setValue(
                          "settlementAccountId",
                          accounts.find((item) => item.id !== next)?.id ?? "",
                        );
                      }
                    }}
                    options={accountSelectOptions(
                      accounts,
                      money,
                      t("availableBalancePrefix"),
                    )}
                    required
                    data-testid="savings-source"
                  />
                  {fundingAccount && amountIsValid ? (
                    <InlineAlert variant="warning">
                      {t("fundingTransferNotice", {
                        amount: money(principalAmount),
                      })}
                    </InlineAlert>
                  ) : null}
                </>
              ) : (
                <Text size="sm" tone="secondary" className="text-pretty">
                  {t("historicalNoSource")}
                </Text>
              )}
              {needsPayout ? (
                <SelectField
                  id="savings-payout-account"
                  label={t("payoutAccountLabel")}
                  value={settlementAccountId ?? ""}
                  onChange={(next) => setValue("settlementAccountId", next)}
                  options={accountSelectOptions(
                    accounts,
                    money,
                    t("availableBalancePrefix"),
                  )}
                  required
                  data-testid="savings-payout-account"
                />
              ) : (
                <Text size="xs" tone="secondary" className="text-pretty">
                  {t("noPayoutNeeded")}
                </Text>
              )}
            </Card>
            <section
              className="flex flex-col gap-(--space-3)"
              data-testid="savings-wizard-maturity-instruction"
            >
              <div>
                <SavingsSectionTitle>
                  {t("maturityStrategyLabel")}
                </SavingsSectionTitle>
                <Text
                  size="xs"
                  tone="secondary"
                  className="mt-(--space-1) text-pretty"
                >
                  {t("maturityStrategyHint")}
                </Text>
              </div>
              <SelectionGroup ariaLabel={t("maturityStrategyLabel")}>
                {SETTLEMENT_RULE_VALUES.map((value) => (
                  <SelectionRow
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
                      <Text size="xs" tone="secondary" className="text-pretty">
                        {t(
                          `settlementRuleHints.${value}` as
                            | "settlementRuleHints.roll_principal_interest"
                            | "settlementRuleHints.roll_principal_only"
                            | "settlementRuleHints.withdraw_everything",
                        )}
                      </Text>
                    </span>
                  </SelectionRow>
                ))}
              </SelectionGroup>
              {settlementRule !== SettlementRule.WITHDRAW_EVERYTHING ? (
                <>
                  <SavingsSectionTitle>
                    {t("targetPackageLabel")}
                  </SavingsSectionTitle>
                  <div role="group" aria-label={t("targetPackageLabel")}>
                    <ChoiceTileGroup>
                      <ChoiceTile
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
                      </ChoiceTile>
                      <ChoiceTile
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
                      </ChoiceTile>
                    </ChoiceTileGroup>
                  </div>
                  {targetMode === MaturityTargetMode.SELECT_PACKAGE ? (
                    <SelectionGroup ariaLabel={t("targetPackageLabel")}>
                      {targetPackages.map((pkg) => (
                        <SelectionRow
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
                        </SelectionRow>
                      ))}
                    </SelectionGroup>
                  ) : null}
                </>
              ) : null}
              <SelectionGroup label={t("renewalPolicyLabel")}>
                {RENEWAL_POLICY_VALUES.map((value) => (
                  <SelectionRow
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
                  </SelectionRow>
                ))}
              </SelectionGroup>
              <Text size="xs" tone="secondary" className="text-pretty">
                {t("settlementHint", {
                  account: settlementAccount?.name ?? t("noPayoutNeeded"),
                })}
              </Text>
            </section>
          </section>
        ) : null}

        {step === FlowStep.REVIEW ? (
          <section
            className="flex flex-col gap-(--space-5)"
            aria-labelledby="savings-review-title"
          >
            <StepHeader
              id="savings-review-title"
              title={t("reviewTitle")}
              subtitle={t("reviewSubtitle")}
            />
            <Card tone="hero" className="gap-0 p-(--space-4)">
              <div className="flex items-center gap-(--space-3)">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-(--radius-control) border border-white/25 bg-white/10 text-hero-fg">
                  <AppIcon
                    icon={FINANCE_ICONS.savings}
                    size={AppIconSize.MD}
                    emphasized
                  />
                </span>
                <div className="min-w-0">
                  <Text size="sm" weight="medium" className="text-hero-muted">
                    {t("reviewHeroLabel")}
                  </Text>
                  <Text size="xs" className="text-pretty text-hero-muted">
                    {selectedPackage
                      ? `${values.productName} · ${t("termDays", { days: selectedPackage.durationDays })} · ${rate(selectedPackage.annualInterestRate)}% / ${t("year")}`
                      : t("unknown")}
                  </Text>
                </div>
              </div>
              <Text
                size="xs"
                className="mt-(--space-4) text-pretty text-hero-muted"
              >
                {t("maturityAmountLabel")}
              </Text>
              <Amount
                amountLabel={
                  estimate
                    ? money(estimate.breakdown.totalCashReceived)
                    : t("unknown")
                }
                size={AmountSize.HERO}
                className="mt-(--space-2)"
                amountClassName="text-hero-fg"
              />
              <dl className="mt-(--space-4) grid grid-cols-2 gap-(--space-3) border-t border-white/15 pt-(--space-3)">
                <div className="flex min-w-0 flex-col gap-(--space-1)">
                  <Text as="dt" size="xs" className="text-hero-muted">
                    {t("principalLabel")}
                  </Text>
                  <Text
                    as="dd"
                    size="sm"
                    weight="semibold"
                    className="tabular-nums text-hero-fg"
                  >
                    <FinancialValue>{money(principalAmount)}</FinancialValue>
                  </Text>
                </div>
                <div className="flex min-w-0 flex-col gap-(--space-1)">
                  <Text as="dt" size="xs" className="text-hero-muted">
                    {t("netInterestLabel")}
                  </Text>
                  <Text
                    as="dd"
                    size="sm"
                    weight="semibold"
                    className="tabular-nums text-hero-fg"
                  >
                    {estimate ? (
                      <FinancialValue>
                        {money(estimate.breakdown.netInterest)}
                      </FinancialValue>
                    ) : (
                      t("unknown")
                    )}
                  </Text>
                </div>
                <div className="col-span-2 flex min-w-0 flex-col gap-(--space-1)">
                  <Text as="dt" size="xs" className="text-hero-muted">
                    {t("maturityLabel")}
                  </Text>
                  <Text
                    as="dd"
                    size="sm"
                    weight="semibold"
                    className="text-hero-fg"
                  >
                    {estimate ? date(estimate.maturityDate) : t("unknown")}
                  </Text>
                </div>
              </dl>
            </Card>
            <SavingsFactsCard
              title={t("reviewDetailsTitle")}
              testId="savings-review-summary"
            >
              <SavingsFactRow
                label={t("sourceSection")}
                value={
                  fundingAccount?.name ??
                  (creationMode === SavingsCreateMode.HISTORICAL_OPENING
                    ? t("historicalNoSource")
                    : t("unknown"))
                }
              />
              <SavingsFactRow
                label={t("creationModeLabel")}
                value={
                  creationMode === SavingsCreateMode.HISTORICAL_OPENING
                    ? t("historicalOpeningMode")
                    : t("liveDepositMode")
                }
              />
              <SavingsFactRow
                label={t("providerLabel")}
                value={selectedProvider?.displayName ?? t("unknown")}
              />
              <SavingsFactRow
                label={t("packageLabel")}
                value={
                  selectedPackage
                    ? t("termDays", { days: selectedPackage.durationDays })
                    : t("unknown")
                }
              />
              <SavingsFactRow
                label={t("startDateLabel")}
                value={date(startDate)}
              />
              <SavingsFactRow
                label={t("settlementRuleLabel")}
                value={t(
                  `settlementRules.${settlementRule}` as
                    | "settlementRules.roll_principal_interest"
                    | "settlementRules.roll_principal_only"
                    | "settlementRules.withdraw_everything",
                )}
              />
              <SavingsFactRow
                label={t("renewalPolicyLabel")}
                value={t(
                  `renewalPolicies.${renewalPolicy}` as
                    | "renewalPolicies.always_ask"
                    | "renewalPolicies.use_saved_preference"
                    | "renewalPolicies.auto_renew_until_cancelled"
                    | "renewalPolicies.one_time_renewal",
                )}
              />
              {settlementRule !== SettlementRule.WITHDRAW_EVERYTHING ? (
                <SavingsFactRow
                  label={t("targetPackageLabel")}
                  value={
                    packages.find((pkg) => pkg.id === targetPackageId)
                      ?.packageName ?? t("unknown")
                  }
                />
              ) : null}
              <SavingsFactRow
                label={t("payoutAccountLabel")}
                value={
                  needsPayout
                    ? (settlementAccount?.name ?? t("unknown"))
                    : t("noPayoutNeeded")
                }
              />
            </SavingsFactsCard>
            <Card tone="soft" className="gap-0 overflow-hidden p-0">
              <div className="flex items-start gap-(--space-3) px-(--space-4) py-(--space-3)">
                <IconContainer tone={IconContainerTone.SAVINGS} size="sm">
                  <AppIcon icon={FINANCE_ICONS.savings} size={AppIconSize.SM} />
                </IconContainer>
                <div className="min-w-0 flex-1">
                  <Text size="sm" weight="medium">
                    {t("flowTitle")}
                  </Text>
                  <Text size="xs" tone="secondary" className="text-pretty">
                    {fundingAccount?.name ?? t("historicalNoSource")} →{" "}
                    {t("flowSavings")} ·{" "}
                    <FinancialValue>{money(principalAmount)}</FinancialValue>
                  </Text>
                </div>
              </div>
            </Card>
          </section>
        ) : null}
      </MotionStep>

      <BottomActionBar
        className="mt-auto shrink-0"
        layout={BottomActionBarLayout.SPLIT}
      >
        {stepIndex > 0 ? (
          <Button
            variant="secondary"
            className="min-h-11 min-w-0 flex-1"
            data-testid="savings-wizard-back"
            onPress={goBack}
          >
            {t("back")}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="min-h-11 min-w-0 flex-1"
            onPress={exitFlow}
          >
            {t("cancel")}
          </Button>
        )}
        {step === FlowStep.REVIEW ? (
          <Button
            variant="primary"
            className="min-h-11 min-w-0 flex-1"
            data-testid="savings-wizard-confirm"
            isDisabled={isPending || !canContinue}
            onPress={() => void confirm()}
          >
            {isPending ? t("confirming") : t("confirm")}
          </Button>
        ) : (
          <Button
            variant="primary"
            className="min-h-11 min-w-0 flex-1"
            data-testid="savings-wizard-next"
            isDisabled={!canContinue}
            onPress={goNext}
          >
            {step === FlowStep.SETUP ? t("reviewCta") : t("next")}
          </Button>
        )}
      </BottomActionBar>
    </div>
  );
}
