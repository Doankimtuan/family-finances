import type {
  SavingStatus,
  CycleStatus,
  SavingType,
  SavingsFamily,
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
  MaturityTargetMode,
  MaturityFallbackPolicy,
} from "../savings-constants";
import type {
  SavingsFamily as CanonicalSavingsFamily,
  SavingsTermUnit,
  SavingsTaxRule,
  EarlySettlementRule,
} from "../savings-domain-rules";
import type { FinancialCapabilities } from "@/modules/shared-kernel/application/financial-ownership";

/** Saved preference config — never auto-executes ledger (BR-01). */
export type RenewalConfig = {
  preferredPackageId: string | null;
  preferredSettlementRule: SettlementRule;
  preferredSettlementAccountId: string | null;
  targetMode?: MaturityTargetMode;
  targetPackageId?: string | null;
  payoutAccountId?: string | null;
  fallbackPolicy?: MaturityFallbackPolicy;
};

export type MaturityInstruction = {
  strategy: SettlementRule;
  targetMode: MaturityTargetMode;
  targetPackageId: string | null;
  payoutAccountId: string | null;
  fallbackPolicy: MaturityFallbackPolicy;
};

/** Immutable product configuration snapshot at creation time. */
export type ProductSnapshot = {
  packageId?: string;
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
  savingsFamily?: CanonicalSavingsFamily;
  providerNameSnapshot?: string;
  providerKey?: string;
  currency?: string;
  taxRule?: SavingsTaxRule;
  taxRatePercent?: number;
  termAmount?: number;
  termUnit?: SavingsTermUnit;
  settlementRules?: SettlementRule[];
  earlySettlementRule?: EarlySettlementRule;
  earlySettlementRatePercent?: number | null;
  supportsPartialSettlement?: boolean;
};

/** Immutable package configuration snapshot at cycle start. */
export type PackageSnapshot = {
  packageId?: string;
  packageName: string;
  durationDays: number;
  annualInterestRate: number;
  settlementRules: SettlementRule[];
  penaltyRules: PenaltyRule[];
  renewableAvailable: boolean;
  minAmount: number | null;
  maxAmount: number | null;
  termAmount?: number;
  termUnit?: SavingsTermUnit;
  interestCalculationMethod?: InterestCalcMethod;
  currency?: string;
  taxRule?: SavingsTaxRule;
  taxRatePercent?: number;
  earlySettlementRule?: EarlySettlementRule;
  earlySettlementRatePercent?: number | null;
  supportsPartialSettlement?: boolean;
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
  grossInterest?: number;
  tax?: number;
  fee?: number;
  netInterest?: number;
  totalCashReceived?: number;
  taxRule?: string;
  taxRatePercent?: number;
  transferGroupId?: string;
  interestTransactionId?: string;
  taxTransactionId?: string;
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
  providerSavingType: SavingType;
  savingsFamily: SavingsFamily;
  productName: string;
  productSnapshot: ProductSnapshot;
  renewalPolicy: RenewalPolicy;
  renewalConfig: RenewalConfig;
  maturityInstruction: MaturityInstruction;
  /** @deprecated Use renewalPolicy. */
  renewalPreference: RenewalPolicy;
  createdAt: string;
  latestCycle: SavingCycle | null;
  maturityActionRequired?: boolean;
  ownership: FinancialCapabilities;
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
  previousCycleId: string | null;
  nextCycleId: string | null;
};

export type SavingsFinancialActivity = {
  id: string;
  eventKind: string;
  amount: number;
  currency: string;
  date: string;
  note: string | null;
};

/** Provider entity. */
export type SavingProvider = {
  id: string;
  providerKey: string;
  displayName: string;
  savingType: SavingType;
  isActive: boolean;
  metadata: Record<string, unknown>;
  family?: CanonicalSavingsFamily;
  iconKey?: string;
  householdId?: string | null;
  isSystem?: boolean;
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
  termAmount?: number;
  termUnit?: SavingsTermUnit;
  interestCalculationMethod?: InterestCalcMethod;
  currency?: string;
  taxRule?: SavingsTaxRule;
  taxRatePercent?: number;
  earlySettlementRule?: EarlySettlementRule;
  earlySettlementRatePercent?: number | null;
  supportsPartialSettlement?: boolean;
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
