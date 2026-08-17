import {
  CycleStatus as CycleStatusConst,
  InterestCalcMethod as InterestCalcMethodConst,
  MaturityFallbackPolicy as MaturityFallbackPolicyConst,
  MaturityTargetMode as MaturityTargetModeConst,
  PenaltyStrategy as PenaltyStrategyConst,
  RenewalPolicy as RenewalPolicyConst,
  RENEWAL_POLICY_VALUES,
  SAVING_TYPE_VALUES,
  SavingStatus as SavingStatusConst,
  SavingType as SavingTypeConst,
  SETTLEMENT_RULE_VALUES,
  SettlementRule as SettlementRuleConst,
  savingsFamilyForType,
} from "../savings-constants";
import {
  EarlySettlementRule,
  SavingsFamily,
  SavingsTaxRule,
  SavingsTermUnit,
} from "../savings-domain-rules";
import {
  defaultRenewalConfigForLegacyPreference,
  mapLegacyRenewalPreference,
} from "../renewal-policy-map";
import type {
  EarlyWithdrawal,
  MaturityInstruction,
  PackageSnapshot,
  PenaltyRule,
  ProductSnapshot,
  RenewalConfig,
  RenewalDecision,
  Saving,
  SavingCycle,
  SavingPackage,
  SavingProvider,
  SettlementResult,
} from "../types/savings.types";
import type {
  InterestCalcMethod,
  RenewalPolicy,
  SavingStatus,
  CycleStatus,
  SavingType,
  SettlementRule,
} from "../savings-constants";
import type {
  EarlySettlementRule as EarlySettlementRuleValue,
  SavingsFamily as CanonicalSavingsFamily,
  SavingsTaxRule as SavingsTaxRuleValue,
  SavingsTermUnit as SavingsTermUnitValue,
} from "../savings-domain-rules";

function asSavingStatus(value: string): SavingStatus {
  switch (value) {
    case SavingStatusConst.ACTIVE:
    case SavingStatusConst.MATURED:
    case SavingStatusConst.EARLY_CLOSED:
    case SavingStatusConst.CLOSED:
      return value;
    default:
      return SavingStatusConst.ACTIVE;
  }
}

function asCycleStatus(value: string): CycleStatus {
  switch (value) {
    case CycleStatusConst.ACTIVE:
    case CycleStatusConst.MATURED:
    case CycleStatusConst.EARLY_CLOSED:
    case CycleStatusConst.ROLLED:
      return value;
    default:
      return CycleStatusConst.ACTIVE;
  }
}

function asSavingType(value: string): SavingType {
  if ((SAVING_TYPE_VALUES as readonly string[]).includes(value)) {
    return value as SavingType;
  }
  return SavingTypeConst.MANUAL_SAVING;
}

function parseRenewalConfig(
  raw: unknown,
  legacyPreference?: string,
): RenewalConfig {
  const fallback = defaultRenewalConfigForLegacyPreference(legacyPreference);
  if (raw == null || typeof raw !== "object") {
    return fallback;
  }
  const obj = raw as Record<string, unknown>;
  const rule =
    typeof obj.preferredSettlementRule === "string" &&
    (SETTLEMENT_RULE_VALUES as readonly string[]).includes(
      obj.preferredSettlementRule,
    )
      ? (obj.preferredSettlementRule as SettlementRule)
      : fallback.preferredSettlementRule;
  return {
    preferredPackageId:
      typeof obj.preferredPackageId === "string"
        ? obj.preferredPackageId
        : null,
    preferredSettlementRule: rule,
    preferredSettlementAccountId:
      typeof obj.preferredSettlementAccountId === "string"
        ? obj.preferredSettlementAccountId
        : null,
    targetMode:
      obj.targetMode === MaturityTargetModeConst.SELECT_PACKAGE ||
      obj.targetMode === MaturityTargetModeConst.KEEP_CURRENT_PACKAGE
        ? obj.targetMode
        : undefined,
    targetPackageId:
      typeof obj.targetPackageId === "string" ? obj.targetPackageId : null,
    payoutAccountId:
      typeof obj.payoutAccountId === "string" ? obj.payoutAccountId : null,
    fallbackPolicy: MaturityFallbackPolicyConst.ASK_USER,
  };
}

function parseMaturityInstruction(
  raw: unknown,
  config: RenewalConfig,
  productSnapshot: ProductSnapshot,
): MaturityInstruction {
  const value =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const strategy = (SETTLEMENT_RULE_VALUES as readonly string[]).includes(
    String(value.strategy),
  )
    ? (String(value.strategy) as SettlementRule)
    : (config.preferredSettlementRule ?? productSnapshot.settlementRule);
  const targetMode =
    value.targetMode === MaturityTargetModeConst.SELECT_PACKAGE
      ? MaturityTargetModeConst.SELECT_PACKAGE
      : MaturityTargetModeConst.KEEP_CURRENT_PACKAGE;
  return {
    strategy,
    targetMode,
    targetPackageId:
      typeof value.targetPackageId === "string"
        ? value.targetPackageId
        : (config.targetPackageId ??
          config.preferredPackageId ??
          productSnapshot.packageId ??
          null),
    payoutAccountId:
      typeof value.payoutAccountId === "string"
        ? value.payoutAccountId
        : (config.payoutAccountId ??
          config.preferredSettlementAccountId ??
          null),
    fallbackPolicy: MaturityFallbackPolicyConst.ASK_USER,
  };
}

export function mapProviderRow(row: {
  id: string;
  provider_key: string;
  display_name: string;
  saving_type: string;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  family?: string | null;
  icon_key?: string | null;
  household_id?: string | null;
  is_system?: boolean;
}): SavingProvider {
  return {
    id: row.id,
    providerKey: row.provider_key,
    displayName: row.display_name,
    savingType: asSavingType(row.saving_type),
    isActive: Boolean(row.is_active),
    metadata: row.metadata ?? {},
    family:
      row.family === SavingsFamily.BANK || row.family === SavingsFamily.PLATFORM
        ? (row.family as CanonicalSavingsFamily)
        : undefined,
    iconKey: row.icon_key ?? undefined,
    householdId: row.household_id ?? null,
    isSystem: row.is_system ?? row.household_id == null,
  };
}

export function mapPackageRow(row: {
  id: string;
  provider_id: string;
  package_name: string;
  duration_days: number;
  annual_interest_rate: number | string;
  min_amount: number | string | null;
  max_amount: number | string | null;
  settlement_rules: unknown;
  penalty_rules: unknown;
  renewable_available: boolean;
  is_active: boolean;
  term_amount?: number | null;
  term_unit?: string | null;
  interest_calculation_method?: string | null;
  currency?: string | null;
  tax_rule?: string | null;
  tax_rate_percent?: number | string | null;
  early_settlement_rule?: string | null;
  early_settlement_rate_percent?: number | string | null;
  supports_partial_settlement?: boolean | null;
}): SavingPackage {
  const toNum = (value: number | string | null) =>
    value == null ? null : Number(value);

  let settlementRules: SettlementRule[] = [];
  if (Array.isArray(row.settlement_rules)) {
    settlementRules = row.settlement_rules.filter((rule): rule is SettlementRule =>
      (SETTLEMENT_RULE_VALUES as readonly string[]).includes(String(rule)),
    );
  }

  let penaltyRules: PenaltyRule[] = [];
  if (Array.isArray(row.penalty_rules)) {
    penaltyRules = row.penalty_rules as PenaltyRule[];
  }

  return {
    id: row.id,
    providerId: row.provider_id,
    packageName: row.package_name,
    durationDays: Number(row.duration_days),
    annualInterestRate: Number(row.annual_interest_rate),
    minAmount: toNum(row.min_amount),
    maxAmount: toNum(row.max_amount),
    settlementRules,
    penaltyRules,
    renewableAvailable: Boolean(row.renewable_available),
    isActive: Boolean(row.is_active),
    termAmount: row.term_amount == null ? undefined : Number(row.term_amount),
    termUnit:
      row.term_unit === SavingsTermUnit.DAY ||
      row.term_unit === SavingsTermUnit.MONTH
        ? (row.term_unit as SavingsTermUnitValue)
        : undefined,
    interestCalculationMethod:
      row.interest_calculation_method === InterestCalcMethodConst.SIMPLE ||
      row.interest_calculation_method === InterestCalcMethodConst.COMPOUND_DAILY ||
      row.interest_calculation_method === InterestCalcMethodConst.COMPOUND_MONTHLY
        ? (row.interest_calculation_method as InterestCalcMethod)
        : undefined,
    currency: row.currency ?? undefined,
    taxRule:
      row.tax_rule === SavingsTaxRule.NONE ||
      row.tax_rule === SavingsTaxRule.PROFIT_PERCENTAGE
        ? (row.tax_rule as SavingsTaxRuleValue)
        : undefined,
    taxRatePercent: toNum(row.tax_rate_percent ?? null) ?? undefined,
    earlySettlementRule:
      row.early_settlement_rule === EarlySettlementRule.NOT_ALLOWED ||
      row.early_settlement_rule === EarlySettlementRule.RETURN_PRINCIPAL_ONLY ||
      row.early_settlement_rule === EarlySettlementRule.CUSTOM_RATE ||
      row.early_settlement_rule === EarlySettlementRule.PENALTY ||
      row.early_settlement_rule === EarlySettlementRule.CUSTOM
        ? (row.early_settlement_rule as EarlySettlementRuleValue)
        : undefined,
    earlySettlementRatePercent:
      row.early_settlement_rate_percent == null
        ? undefined
        : toNum(row.early_settlement_rate_percent),
    supportsPartialSettlement: row.supports_partial_settlement ?? undefined,
  };
}

export function mapSavingRow(row: {
  id: string;
  household_id: string;
  status: string;
  funding_account_id: string;
  settlement_account_id: string;
  provider_id: string;
  product_name: string;
  product_snapshot: unknown;
  renewal_preference?: string;
  renewal_policy?: string;
  renewal_config?: unknown;
  maturity_instruction?: unknown;
  created_at: string;
  funding_accounts?: { name: string }[] | { name: string } | null;
  settlement_accounts?: { name: string }[] | { name: string } | null;
  saving_providers?:
    | { display_name: string; provider_key: string; saving_type: string }[]
    | { display_name: string; provider_key: string; saving_type: string }
    | null;
}): Saving {
  let productSnapshot: ProductSnapshot;
  try {
    const raw =
      typeof row.product_snapshot === "string"
        ? JSON.parse(row.product_snapshot)
        : row.product_snapshot;
    productSnapshot = raw as ProductSnapshot;
  } catch {
    productSnapshot = {
      providerId: "",
      productName: "",
      packageName: "",
      depositTermDays: 0,
      annualInterestRate: 0,
      interestCalculationMethod: InterestCalcMethodConst.SIMPLE,
      settlementRule: SettlementRuleConst.WITHDRAW_EVERYTHING,
      renewalPolicy: RenewalPolicyConst.ALWAYS_ASK,
      penaltyStrategy: PenaltyStrategyConst.NO_INTEREST,
      providerRules: {},
    };
  }

  const rawPolicy = row.renewal_policy ?? row.renewal_preference ?? "";
  const renewalPolicy = (RENEWAL_POLICY_VALUES as readonly string[]).includes(
    rawPolicy,
  )
    ? (rawPolicy as RenewalPolicy)
    : mapLegacyRenewalPreference(rawPolicy);

  const renewalConfig = parseRenewalConfig(
    row.renewal_config,
    row.renewal_preference ?? row.renewal_policy,
  );
  const maturityInstruction = parseMaturityInstruction(
    row.maturity_instruction,
    renewalConfig,
    productSnapshot,
  );

  const fundingAccount =
    row.funding_accounts != null
      ? Array.isArray(row.funding_accounts)
        ? row.funding_accounts[0]
        : row.funding_accounts
      : null;
  const settlementAccount =
    row.settlement_accounts != null
      ? Array.isArray(row.settlement_accounts)
        ? row.settlement_accounts[0]
        : row.settlement_accounts
      : null;
  const provider =
    row.saving_providers != null
      ? Array.isArray(row.saving_providers)
        ? row.saving_providers[0]
        : row.saving_providers
      : null;

  return {
    id: row.id,
    householdId: row.household_id,
    status: asSavingStatus(row.status),
    fundingAccountId: row.funding_account_id,
    fundingAccountName: fundingAccount?.name ?? null,
    settlementAccountId: row.settlement_account_id,
    settlementAccountName: settlementAccount?.name ?? null,
    providerId: row.provider_id,
    providerName:
      (typeof productSnapshot.providerNameSnapshot === "string"
        ? productSnapshot.providerNameSnapshot
        : provider?.display_name) ?? null,
    providerSavingType: asSavingType(provider?.saving_type ?? ""),
    savingsFamily:
      productSnapshot.savingsFamily ??
      savingsFamilyForType(asSavingType(provider?.saving_type ?? "")),
    productName: row.product_name,
    productSnapshot,
    renewalPolicy,
    renewalConfig,
    maturityInstruction,
    renewalPreference: renewalPolicy,
    createdAt: row.created_at,
    latestCycle: null,
    maturityActionRequired: false,
  };
}

export function mapSavingCycleRow(row: {
  id: string;
  saving_id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  principal: number | string;
  locked_rate: number | string;
  package_snapshot: unknown;
  accrued_interest: number | string;
  settlement_result: unknown;
  renewal_decision?: unknown;
  previous_cycle_id?: string | null;
  next_cycle_id?: string | null;
  status: string;
  funding_transaction_id: string | null;
  settlement_transaction_id: string | null;
  created_at: string;
}): SavingCycle {
  let packageSnapshot: PackageSnapshot;
  try {
    const raw =
      typeof row.package_snapshot === "string"
        ? JSON.parse(row.package_snapshot)
        : row.package_snapshot;
    packageSnapshot = raw as PackageSnapshot;
  } catch {
    packageSnapshot = {
      packageName: "",
      durationDays: 0,
      annualInterestRate: 0,
      settlementRules: [],
      penaltyRules: [],
      renewableAvailable: true,
      minAmount: null,
      maxAmount: null,
    };
  }

  let settlementResult: SettlementResult | null = null;
  if (row.settlement_result != null) {
    try {
      const raw =
        typeof row.settlement_result === "string"
          ? JSON.parse(row.settlement_result)
          : row.settlement_result;
      settlementResult = raw as SettlementResult;
    } catch {
      settlementResult = null;
    }
  }

  let renewalDecision: RenewalDecision | null = null;
  if (row.renewal_decision != null) {
    try {
      const raw =
        typeof row.renewal_decision === "string"
          ? JSON.parse(row.renewal_decision)
          : row.renewal_decision;
      renewalDecision = raw as RenewalDecision;
    } catch {
      renewalDecision = null;
    }
  }

  const principal = Number(row.principal);
  const lockedRate = Number(row.locked_rate);
  const accruedInterest = Number(row.accrued_interest);

  return {
    id: row.id,
    savingId: row.saving_id,
    cycleNumber: Number(row.cycle_number),
    startDate: row.start_date,
    endDate: row.end_date,
    principal: Number.isFinite(principal) ? principal : 0,
    lockedRate: Number.isFinite(lockedRate) ? lockedRate : 0,
    packageSnapshot,
    accruedInterest: Number.isFinite(accruedInterest) ? accruedInterest : 0,
    settlementResult,
    renewalDecision,
    status: asCycleStatus(row.status),
    fundingTransactionId: row.funding_transaction_id,
    settlementTransactionId: row.settlement_transaction_id,
    createdAt: row.created_at,
    previousCycleId: row.previous_cycle_id ?? null,
    nextCycleId: row.next_cycle_id ?? null,
  };
}

export function mapEarlyWithdrawalRow(row: {
  id: string;
  cycle_id: string;
  saving_id: string;
  requested_at: string;
  principal: number | string;
  accrued_interest: number | string;
  eligible_interest: number | string;
  penalty_amount: number | string;
  net_returned: number | string;
  penalty_strategy: string;
  settlement_transaction_id: string | null;
}): EarlyWithdrawal {
  const toNum = (value: number | string) => Number(value);
  return {
    id: row.id,
    cycleId: row.cycle_id,
    savingId: row.saving_id,
    requestedAt: row.requested_at,
    principal: toNum(row.principal),
    accruedInterest: toNum(row.accrued_interest),
    eligibleInterest: toNum(row.eligible_interest),
    penaltyAmount: toNum(row.penalty_amount),
    netReturned: toNum(row.net_returned),
    penaltyStrategy: row.penalty_strategy,
    settlementTransactionId: row.settlement_transaction_id,
  };
}
