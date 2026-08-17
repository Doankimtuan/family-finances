/**
 * Savings domain constants — single source for Zod schemas, UI, and mappers.
 */

export const SavingStatus = {
  ACTIVE: "active",
  MATURED: "matured",
  EARLY_CLOSED: "early_closed",
  CLOSED: "closed",
} as const;

export type SavingStatus = (typeof SavingStatus)[keyof typeof SavingStatus];

export const SAVING_STATUS_VALUES = [
  SavingStatus.ACTIVE,
  SavingStatus.MATURED,
  SavingStatus.EARLY_CLOSED,
  SavingStatus.CLOSED,
] as const;

export const CycleStatus = {
  ACTIVE: "active",
  MATURED: "matured",
  EARLY_CLOSED: "early_closed",
  ROLLED: "rolled",
} as const;

export type CycleStatus = (typeof CycleStatus)[keyof typeof CycleStatus];

export const CYCLE_STATUS_VALUES = [
  CycleStatus.ACTIVE,
  CycleStatus.MATURED,
  CycleStatus.EARLY_CLOSED,
  CycleStatus.ROLLED,
] as const;

export const SavingType = {
  BANK_DEPOSIT: "bank_deposit",
  DIGITAL_SAVING: "digital_saving",
  FLEXIBLE_SAVING: "flexible_saving",
  MANUAL_SAVING: "manual_saving",
} as const;

export type SavingType = (typeof SavingType)[keyof typeof SavingType];

export const SAVING_TYPE_VALUES = [
  SavingType.BANK_DEPOSIT,
  SavingType.DIGITAL_SAVING,
  SavingType.FLEXIBLE_SAVING,
  SavingType.MANUAL_SAVING,
] as const;

export const SavingsFamily = {
  BANK: "BANK",
  PLATFORM: "PLATFORM",
} as const;
export type SavingsFamily = (typeof SavingsFamily)[keyof typeof SavingsFamily];
export const SAVINGS_FAMILY_VALUES = [
  SavingsFamily.BANK,
  SavingsFamily.PLATFORM,
] as const;

/** Savings RPC names used at the application boundary and in diagnostics. */
export const SAVINGS_RPC = {
  CREATE: "create_saving_with_transfer",
  DETECT_MATURED: "detect_matured_savings",
  ENQUEUE_MATURITY_CASCADE: "enqueue_savings_maturity_cascade",
  BACKFILL_LEGACY: "backfill_legacy_savings_accounts",
  SETTLE: "settle_saving_cycle",
  RENEW: "rollover_saving_cycle",
  RECORD_RENEWAL_DECISION: "record_saving_renewal_decision",
  EARLY_WITHDRAW: "early_withdraw_saving",
} as const;

export type SavingsRpc = (typeof SAVINGS_RPC)[keyof typeof SAVINGS_RPC];

export const SAVINGS_OPERATION = {
  PROVIDER_REGISTRY: "savingsProviderRegistry",
  MATURITY_ENRICHMENT: "savingsMaturityEnrichment",
  EARLY_WITHDRAWAL_INBOX: "savingsEarlyWithdrawalInbox",
  UPDATE_RENEWAL_POLICY: "updateRenewalPolicy",
  CATALOG: "manageSavingsCatalog",
  LIST_SAVINGS: "listSavings",
  GET_SAVING: "getSaving",
  LIST_SAVING_CYCLES: "listSavingCycles",
  LIST_SAVINGS_FINANCIAL_ACTIVITIES: "listSavingsFinancialActivities",
} as const;

export type SavingsOperation =
  SavingsRpc | (typeof SAVINGS_OPERATION)[keyof typeof SAVINGS_OPERATION];

/**
 * Compatibility markers for current Savings RPCs, which still raise plain
 * text PostgreSQL exceptions instead of stable domain metadata.
 */
export const SAVINGS_LEGACY_RPC_ERROR_MARKERS = {
  UNAUTHENTICATED: ["authentication required"],
  NO_MEMBERSHIP: ["active household membership required"],
  INVALID: [
    "principal must be positive",
    "invalid or archived savings provider",
    "currency mismatch",
    "invalid funding account",
    "invalid settlement account",
    "cycle not found",
    "cycle must be matured to settle",
    "cycle must be matured to rollover",
    "cycle must be active",
    "invalid rollover action",
    "target package is required",
    "target package is unavailable",
    "target package currency mismatch",
    "target package minimum amount not met",
    "target package maximum amount exceeded",
    "target package does not support this rollover",
    "forbidden",
  ],
} as const;

export function savingsFamilyForType(type: SavingType): SavingsFamily {
  return type === SavingType.BANK_DEPOSIT
    ? SavingsFamily.BANK
    : SavingsFamily.PLATFORM;
}

export const InterestCalcMethod = {
  SIMPLE: "simple",
  COMPOUND_DAILY: "compound_daily",
  COMPOUND_MONTHLY: "compound_monthly",
} as const;

export type InterestCalcMethod =
  (typeof InterestCalcMethod)[keyof typeof InterestCalcMethod];

export const INTEREST_CALC_METHOD_VALUES = [
  InterestCalcMethod.SIMPLE,
  InterestCalcMethod.COMPOUND_DAILY,
  InterestCalcMethod.COMPOUND_MONTHLY,
] as const;

export const SettlementRule = {
  ROLL_PRINCIPAL_INTEREST: "roll_principal_interest",
  ROLL_PRINCIPAL_ONLY: "roll_principal_only",
  WITHDRAW_EVERYTHING: "withdraw_everything",
} as const;

export type SettlementRule =
  (typeof SettlementRule)[keyof typeof SettlementRule];

export const SETTLEMENT_RULE_VALUES = [
  SettlementRule.ROLL_PRINCIPAL_INTEREST,
  SettlementRule.ROLL_PRINCIPAL_ONLY,
  SettlementRule.WITHDRAW_EVERYTHING,
] as const;

/** Canonical maturity instruction values; kept aligned with stored settlement rules. */
export const MaturityTargetMode = {
  KEEP_CURRENT_PACKAGE: "keep_current_package",
  SELECT_PACKAGE: "select_package",
} as const;
export type MaturityTargetMode =
  (typeof MaturityTargetMode)[keyof typeof MaturityTargetMode];
export const MATURITY_TARGET_MODE_VALUES = [
  MaturityTargetMode.KEEP_CURRENT_PACKAGE,
  MaturityTargetMode.SELECT_PACKAGE,
] as const;

export const MaturityFallbackPolicy = {
  ASK_USER: "ask_user",
} as const;
export type MaturityFallbackPolicy =
  (typeof MaturityFallbackPolicy)[keyof typeof MaturityFallbackPolicy];

export const SavingsMaturityState = {
  ACTIVE: "active",
  MATURING_SOON: "maturing_soon",
  MATURE_TODAY: "mature_today",
  MATURED: "matured",
  ACTION_REQUIRED: "action_required",
  SETTLED: "settled",
  EARLY_SETTLED: "early_settled",
} as const;
export type SavingsMaturityState =
  (typeof SavingsMaturityState)[keyof typeof SavingsMaturityState];

export const SavingsEventKind = {
  PRINCIPAL_PLACEMENT: "SAVINGS_PRINCIPAL_PLACEMENT",
  PRINCIPAL_RETURN: "SAVINGS_PRINCIPAL_RETURN",
  INTEREST: "SAVINGS_INTEREST",
  TAX: "SAVINGS_TAX",
  FEE: "SAVINGS_FEE",
} as const;
export type SavingsEventKind =
  (typeof SavingsEventKind)[keyof typeof SavingsEventKind];

export const SettlementAction = {
  ROLL_PRINCIPAL_INTEREST: "roll_principal_interest",
  ROLL_PRINCIPAL_ONLY: "roll_principal_only",
  WITHDRAW: "withdraw",
} as const;

export type SettlementAction =
  (typeof SettlementAction)[keyof typeof SettlementAction];

export const SETTLEMENT_ACTION_VALUES = [
  SettlementAction.ROLL_PRINCIPAL_INTEREST,
  SettlementAction.ROLL_PRINCIPAL_ONLY,
  SettlementAction.WITHDRAW,
] as const;

/** Renewal Policy — recommendation only; never executes ledger txs (BR-01 / BR-10). */
export const RenewalPolicy = {
  ALWAYS_ASK: "always_ask",
  USE_SAVED_PREFERENCE: "use_saved_preference",
  AUTO_RENEW_UNTIL_CANCELLED: "auto_renew_until_cancelled",
  ONE_TIME_RENEWAL: "one_time_renewal",
} as const;

export type RenewalPolicy = (typeof RenewalPolicy)[keyof typeof RenewalPolicy];

export const RENEWAL_POLICY_VALUES = [
  RenewalPolicy.ALWAYS_ASK,
  RenewalPolicy.USE_SAVED_PREFERENCE,
  RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED,
  RenewalPolicy.ONE_TIME_RENEWAL,
] as const;

/** @deprecated Use RenewalPolicy. Kept for legacy snapshot / migration mapping. */
export const RenewalPreference = {
  MANUAL_REVIEW: "manual_review",
  AUTO_RENEW_SAME_PACKAGE: "auto_renew_same_package",
  AUTO_RENEW_SELECTED_PACKAGE: "auto_renew_selected_package",
  WITHDRAW_EVERYTHING: "withdraw_everything",
} as const;

export type RenewalPreference =
  (typeof RenewalPreference)[keyof typeof RenewalPreference];

export const RENEWAL_PREFERENCE_VALUES = [
  RenewalPreference.MANUAL_REVIEW,
  RenewalPreference.AUTO_RENEW_SAME_PACKAGE,
  RenewalPreference.AUTO_RENEW_SELECTED_PACKAGE,
  RenewalPreference.WITHDRAW_EVERYTHING,
] as const;

export const RenewalDecisionSource = {
  MANUAL: "manual",
  SUGGESTED: "suggested",
  POLICY_APPLIED: "policy_applied",
} as const;

export type RenewalDecisionSource =
  (typeof RenewalDecisionSource)[keyof typeof RenewalDecisionSource];

export const RENEWAL_DECISION_SOURCE_VALUES = [
  RenewalDecisionSource.MANUAL,
  RenewalDecisionSource.SUGGESTED,
  RenewalDecisionSource.POLICY_APPLIED,
] as const;

export const RenewalSuggestedAction = {
  NONE: "none",
  CONFIRM_CONFIGURED: "confirm_configured",
  WITHDRAW: "withdraw",
} as const;

export type RenewalSuggestedAction =
  (typeof RenewalSuggestedAction)[keyof typeof RenewalSuggestedAction];

export const RENEWAL_SUGGESTED_ACTION_VALUES = [
  RenewalSuggestedAction.NONE,
  RenewalSuggestedAction.CONFIRM_CONFIGURED,
  RenewalSuggestedAction.WITHDRAW,
] as const;

export const RecommendationReasonCode = {
  HIGHER_RETURN: "higher_return",
  BETTER_LIQUIDITY: "better_liquidity",
  LONGER_DURATION: "longer_duration",
  PACKAGE_UNAVAILABLE: "package_unavailable",
  RATE_CHANGED: "rate_changed",
} as const;

export type RecommendationReasonCode =
  (typeof RecommendationReasonCode)[keyof typeof RecommendationReasonCode];

export const RECOMMENDATION_REASON_CODE_VALUES = [
  RecommendationReasonCode.HIGHER_RETURN,
  RecommendationReasonCode.BETTER_LIQUIDITY,
  RecommendationReasonCode.LONGER_DURATION,
  RecommendationReasonCode.PACKAGE_UNAVAILABLE,
  RecommendationReasonCode.RATE_CHANGED,
] as const;

export const MaturityWarningCode = {
  PACKAGE_UNAVAILABLE: "package_unavailable",
  RATE_CHANGED: "rate_changed",
  PROVIDER_INACTIVE: "provider_inactive",
} as const;

export type MaturityWarningCode =
  (typeof MaturityWarningCode)[keyof typeof MaturityWarningCode];

export const MATURITY_WARNING_CODE_VALUES = [
  MaturityWarningCode.PACKAGE_UNAVAILABLE,
  MaturityWarningCode.RATE_CHANGED,
  MaturityWarningCode.PROVIDER_INACTIVE,
] as const;

/** BR-10 + near-maturity escalation: Spec 30/14/7 union brief 7/3/1. */
export const MATURITY_CASCADE_DAY_VALUES = [30, 14, 7, 3, 1] as const;
export const MATURING_SOON_THRESHOLD_DAYS = 7;

export type MaturityCascadeDay = (typeof MATURITY_CASCADE_DAY_VALUES)[number];

export const PenaltyStrategy = {
  NO_INTEREST: "no_interest",
  DEMAND_INTEREST: "demand_interest",
  FIXED_PENALTY: "fixed_penalty",
  PROVIDER_FORMULA: "provider_formula",
  PROVIDER_CUSTOM: "provider_custom",
} as const;

export type PenaltyStrategy =
  (typeof PenaltyStrategy)[keyof typeof PenaltyStrategy];

export const PENALTY_STRATEGY_VALUES = [
  PenaltyStrategy.NO_INTEREST,
  PenaltyStrategy.DEMAND_INTEREST,
  PenaltyStrategy.FIXED_PENALTY,
  PenaltyStrategy.PROVIDER_FORMULA,
  PenaltyStrategy.PROVIDER_CUSTOM,
] as const;

/** Interest rate denominator (percentage basis). */
export const INTEREST_RATE_DENOMINATOR = 100;

/** Day-count convention: actual/365 for VND deposits. */
export const DAYS_PER_YEAR = 365;

/** Penalty warning threshold: warn when penalty > 50% of accrued interest. */
export const PENALTY_WARNING_THRESHOLD_PCT = 50;
