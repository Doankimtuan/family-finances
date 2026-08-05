import "server-only";

export {
  SavingStatus,
  SAVING_STATUS_VALUES,
  CycleStatus,
  CYCLE_STATUS_VALUES,
  SavingType,
  SAVING_TYPE_VALUES,
  InterestCalcMethod,
  INTEREST_CALC_METHOD_VALUES,
  SettlementRule,
  SETTLEMENT_RULE_VALUES,
  SettlementAction,
  SETTLEMENT_ACTION_VALUES,
  RenewalPolicy,
  RENEWAL_POLICY_VALUES,
  RenewalPreference,
  RENEWAL_PREFERENCE_VALUES,
  RenewalDecisionSource,
  RENEWAL_DECISION_SOURCE_VALUES,
  RenewalSuggestedAction,
  RENEWAL_SUGGESTED_ACTION_VALUES,
  RecommendationReasonCode,
  RECOMMENDATION_REASON_CODE_VALUES,
  MaturityWarningCode,
  MATURITY_WARNING_CODE_VALUES,
  MATURITY_CASCADE_DAY_VALUES,
  PenaltyStrategy,
  PENALTY_STRATEGY_VALUES,
  INTEREST_RATE_DENOMINATOR,
  DAYS_PER_YEAR,
  PENALTY_WARNING_THRESHOLD_PCT,
} from "./savings-constants";

export type {
  Saving,
  SavingCycle,
  SavingProvider,
  SavingPackage,
  ProductSnapshot,
  PackageSnapshot,
  SettlementResult,
  PenaltyRule,
  EarlyWithdrawal,
  RenewalConfig,
  RenewalDecision,
  PackageRecommendation,
  MaturityWarning,
} from "./savings-types";

export {
  mapSavingRow,
  mapSavingCycleRow,
  mapProviderRow,
  mapPackageRow,
  mapEarlyWithdrawalRow,
  emptyRenewalConfig,
} from "./savings-types";

export {
  calculateInterest,
  computeAccruedInterest,
  computeFullTermInterest,
  type InterestInput,
  type InterestResult,
} from "./savings-interest";

export {
  previewEarlyWithdrawal,
  shouldWarnPenalty,
  type EarlyWithdrawalInput,
  type EarlyWithdrawalPreview,
} from "./savings-penalty";

export {
  recommendPackages,
  type RecommendPackagesInput,
  type RecommendPackagesResult,
} from "./savings-recommendation";

export {
  mapLegacyRenewalPreference,
  suggestedActionForPolicy,
  renewalConfidenceForPolicy,
  defaultRenewalConfigForLegacyPreference,
  nextRenewalPolicyAfterRenew,
} from "./renewal-policy-map";

export {
  listProviders,
  getProvider,
  getProviderByKey,
  listProviderPackages,
  getPackage,
  resolvePackageSnapshot,
} from "./savings-provider-registry";

export {
  createSaving,
  createSavingInputSchema,
  type CreateSavingInput,
  type CreateSavingResult,
} from "./commands/create-saving";

export {
  settleSaving,
  renewSaving,
  settleSavingInputSchema,
  renewSavingInputSchema,
  type SettleSavingInput,
  type SettleSavingResult,
  type RenewSavingInput,
  type RenewSavingResult,
} from "./commands/settle-saving";

export {
  updateRenewalPolicy,
  updateRenewalPolicyInputSchema,
  type UpdateRenewalPolicyInput,
  type UpdateRenewalPolicyResult,
} from "./commands/update-renewal-policy";

export {
  requestEarlyWithdrawal,
  confirmEarlyWithdrawal,
  previewEarlyWithdrawalForSaving,
  earlyWithdrawInputSchema,
  type EarlyWithdrawInput,
  type PreviewEarlyWithdrawalResult,
  type ConfirmEarlyWithdrawalResult,
} from "./commands/early-withdraw";

export type { PreviewEarlyWithdrawalResult as RequestEarlyWithdrawalResult } from "./commands/early-withdraw";

export {
  detectMaturedSavings,
  buildMaturityReviewPayload,
  backfillLegacySavingsAccounts,
  type DetectMaturedResult,
  type MaturityReviewPayload,
  type MaturityReviewPackage,
  type BackfillLegacyResult,
} from "./commands/detect-matured";

export {
  listSavings,
  getSaving,
  listSavingCycles,
} from "./queries/list-savings";

export {
  getSavingsHealthMetrics,
  type SavingsHealthMetrics,
} from "./queries/savings-health-metrics";
