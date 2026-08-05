import type {
  SavingStatus,
  CycleStatus,
  SavingType,
  InterestCalcMethod,
  SettlementRule,
  SettlementAction,
  RenewalPolicy,
  RenewalPreference,
  RenewalDecisionSource,
  PenaltyStrategy,
  RecommendationReasonCode,
  MaturityWarningCode,
  RenewalSuggestedAction,
} from "./savings-constants";
import {
  SavingStatus as SavingStatusConst,
  CycleStatus as CycleStatusConst,
  SavingType as SavingTypeConst,
  SettlementRule as SettlementRuleConst,
  RenewalPolicy as RenewalPolicyConst,
  InterestCalcMethod as InterestCalcMethodConst,
  PenaltyStrategy as PenaltyStrategyConst,
  SAVING_TYPE_VALUES,
  SETTLEMENT_RULE_VALUES,
  RENEWAL_POLICY_VALUES,
} from "./savings-constants";
import {
  mapLegacyRenewalPreference,
  defaultRenewalConfigForLegacyPreference,
} from "./renewal-policy-map";

/** Saved preference config — never auto-executes ledger (BR-01). */
export type RenewalConfig = {
  preferredPackageId: string | null;
  preferredSettlementRule: SettlementRule;
  preferredSettlementAccountId: string | null;
};

/** Immutable product configuration snapshot at creation time. */
export type ProductSnapshot = {
  providerId: string;
  productName: string;
  packageName: string;
  depositTermDays: number;
  annualInterestRate: number;
  interestCalculationMethod: InterestCalcMethod;
  settlementRule: SettlementRule;
  /** @deprecated Prefer saving.renewalPolicy; retained for historical snapshots. */
  renewalPreference?: RenewalPreference | RenewalPolicy | string;
  renewalPolicy?: RenewalPolicy;
  penaltyStrategy: PenaltyStrategy;
  providerRules: Record<string, unknown>;
};

/** Immutable package configuration snapshot at cycle start. */
export type PackageSnapshot = {
  packageName: string;
  durationDays: number;
  annualInterestRate: number;
  settlementRules: SettlementRule[];
  penaltyRules: PenaltyRule[];
  renewableAvailable: boolean;
  minAmount: number | null;
  maxAmount: number | null;
};

/** Penalty rule from provider configuration. */
export type PenaltyRule = {
  strategy: PenaltyStrategy;
  demandRate?: number;
  fixedAmount?: number;
  formulaExpression?: string;
};

/** Result of a cycle settlement. */
export type SettlementResult = {
  action: SettlementAction;
  principalReturned: number;
  interestReturned: number;
  penaltyApplied: number;
  netAmount: number;
  settledAt: string;
  settledToAccountId: string;
};

/** Immutable renewal decision recorded on a closed/rolled cycle. */
export type RenewalDecision = {
  renewalPolicy: RenewalPolicy;
  settlementRule: SettlementRule;
  packageName: string;
  lockedRate: number;
  decidedAt: string;
  decisionSource: RenewalDecisionSource;
};

/** Package recommendation (informational only). */
export type PackageRecommendation = {
  packageId: string;
  packageName: string;
  durationDays: number;
  annualRate: number;
  rateDifference: number;
  durationDeltaDays: number;
  reasonCode: RecommendationReasonCode;
};

/** Top-level saving (aggregate root). */
export type Saving = {
  id: string;
  householdId: string;
  status: SavingStatus;
  fundingAccountId: string;
  fundingAccountName: string | null;
  settlementAccountId: string;
  settlementAccountName: string | null;
  providerId: string;
  providerName: string | null;
  productName: string;
  productSnapshot: ProductSnapshot;
  renewalPolicy: RenewalPolicy;
  renewalConfig: RenewalConfig;
  /** @deprecated Use renewalPolicy. */
  renewalPreference: RenewalPolicy;
  createdAt: string;
  latestCycle: SavingCycle | null;
};

/** Individual cycle within a saving. */
export type SavingCycle = {
  id: string;
  savingId: string;
  cycleNumber: number;
  startDate: string;
  endDate: string;
  principal: number;
  lockedRate: number;
  packageSnapshot: PackageSnapshot;
  accruedInterest: number;
  settlementResult: SettlementResult | null;
  renewalDecision: RenewalDecision | null;
  status: CycleStatus;
  fundingTransactionId: string | null;
  settlementTransactionId: string | null;
  createdAt: string;
};

/** Provider entity. */
export type SavingProvider = {
  id: string;
  providerKey: string;
  displayName: string;
  savingType: SavingType;
  isActive: boolean;
  metadata: Record<string, unknown>;
};

/** Provider package entity. */
export type SavingPackage = {
  id: string;
  providerId: string;
  packageName: string;
  durationDays: number;
  annualInterestRate: number;
  minAmount: number | null;
  maxAmount: number | null;
  settlementRules: SettlementRule[];
  penaltyRules: PenaltyRule[];
  renewableAvailable: boolean;
  isActive: boolean;
};

/** Early withdrawal audit record. */
export type EarlyWithdrawal = {
  id: string;
  cycleId: string;
  savingId: string;
  requestedAt: string;
  principal: number;
  accruedInterest: number;
  eligibleInterest: number;
  penaltyAmount: number;
  netReturned: number;
  penaltyStrategy: string;
  settlementTransactionId: string | null;
};

export type MaturityWarning = {
  code: MaturityWarningCode;
};

export type MaturitySuggestion = {
  suggestedAction: RenewalSuggestedAction;
  renewalConfidence: number;
  warnings: MaturityWarning[];
  recommendations: PackageRecommendation[];
};

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
  };
}

export function emptyRenewalConfig(): RenewalConfig {
  return {
    preferredPackageId: null,
    preferredSettlementRule: SettlementRuleConst.ROLL_PRINCIPAL_INTEREST,
    preferredSettlementAccountId: null,
  };
}

export function mapProviderRow(row: {
  id: string;
  provider_key: string;
  display_name: string;
  saving_type: string;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
}): SavingProvider {
  return {
    id: row.id,
    providerKey: row.provider_key,
    displayName: row.display_name,
    savingType: asSavingType(row.saving_type),
    isActive: Boolean(row.is_active),
    metadata: row.metadata ?? {},
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
}): SavingPackage {
  const toNum = (v: number | string | null) =>
    v == null ? null : typeof v === "string" ? Number(v) : Number(v);

  let settlementRules: SettlementRule[] = [];
  if (Array.isArray(row.settlement_rules)) {
    settlementRules = row.settlement_rules.filter((r): r is SettlementRule =>
      (SETTLEMENT_RULE_VALUES as readonly string[]).includes(String(r)),
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
  const renewalPolicy =
    (RENEWAL_POLICY_VALUES as readonly string[]).includes(rawPolicy)
      ? (rawPolicy as RenewalPolicy)
      : mapLegacyRenewalPreference(rawPolicy);

  const renewalConfig = parseRenewalConfig(
    row.renewal_config,
    row.renewal_preference ?? row.renewal_policy,
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
    providerName: provider?.display_name ?? null,
    productName: row.product_name,
    productSnapshot,
    renewalPolicy,
    renewalConfig,
    renewalPreference: renewalPolicy,
    createdAt: row.created_at,
    latestCycle: null,
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

  const principal =
    typeof row.principal === "string"
      ? Number(row.principal)
      : Number(row.principal);
  const lockedRate =
    typeof row.locked_rate === "string"
      ? Number(row.locked_rate)
      : Number(row.locked_rate);
  const accruedInterest =
    typeof row.accrued_interest === "string"
      ? Number(row.accrued_interest)
      : Number(row.accrued_interest);

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
  const toNum = (v: number | string) =>
    typeof v === "string" ? Number(v) : Number(v);
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
