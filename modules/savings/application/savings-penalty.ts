import {
  PenaltyStrategy,
  DAYS_PER_YEAR,
  INTEREST_RATE_DENOMINATOR,
  PENALTY_WARNING_THRESHOLD_PCT,
} from "./savings-constants";
import type { PenaltyRule, PackageSnapshot } from "./savings-types";
import { calculateInterest, type InterestResult } from "./savings-interest";
import { differenceInUtcCalendarDays } from "@/shared/utils/iso-date";

/**
 * Penalty calculation engine for early withdrawal.
 * All amounts in minor currency units (VND whole đồng).
 */

export type EarlyWithdrawalInput = {
  principal: number;
  annualRate: number;
  startDate: string;
  /** Full-term end date (maturity date). */
  endDate: string;
  /** Actual withdrawal date. */
  withdrawalDate: string;
  /** Interest calculation method from product snapshot. */
  interestMethod: string;
  /** Package penalty rules. */
  packageSnapshot: PackageSnapshot;
};

export type EarlyWithdrawalPreview = {
  principal: number;
  /** Accrued estimate only — never posted as settlement interest. */
  accruedInterest: number;
  /** Eligible interest when quote is ready; null when provider/manual actual required. */
  eligibleInterest: number | null;
  /** Penalty when quote is ready; null when provider/manual actual required. */
  penaltyAmount: number | null;
  /** Net payout when quote is ready; null when provider/manual actual required. */
  netReturned: number | null;
  penaltyStrategy: string;
  /** Number of days since start. */
  daysHeld: number;
  /** Total days in term. */
  totalTermDays: number;
  /**
   * False when settlement amounts cannot be derived from an approved package
   * rule (provider formula/custom). Confirmation must not post in that case.
   */
  quoteReady: boolean;
};

/**
 * Calculate accrued interest up to withdrawal date.
 */
function accruedToDate(input: EarlyWithdrawalInput): InterestResult {
  return calculateInterest({
    principal: input.principal,
    annualRate: input.annualRate,
    startDate: input.startDate,
    endDate: input.endDate,
    method: input.interestMethod as "simple",
    asOfDate: input.withdrawalDate,
  });
}

/**
 * No Interest penalty: forfeit all accrued interest.
 */
function calcNoInterest(
  principal: number,
  accrued: InterestResult,
): { eligibleInterest: number; penaltyAmount: number } {
  return {
    eligibleInterest: 0,
    penaltyAmount: accrued.totalInterest,
  };
}

/**
 * Demand Interest penalty: eligible interest = principal * demandRate * days / 365.
 */
function calcDemandInterest(
  principal: number,
  accrued: InterestResult,
  rule: PenaltyRule,
): { eligibleInterest: number; penaltyAmount: number } {
  const demandRate = rule.demandRate ?? 0.5;
  const eligible = Math.floor(
    (principal *
      (demandRate / INTEREST_RATE_DENOMINATOR) *
      accrued.daysElapsed) /
      DAYS_PER_YEAR,
  );
  return {
    eligibleInterest: eligible,
    penaltyAmount: Math.max(0, accrued.totalInterest - eligible),
  };
}

/**
 * Fixed Penalty: deduct a fixed amount from accrued interest.
 */
function calcFixedPenalty(
  accrued: InterestResult,
  rule: PenaltyRule,
): { eligibleInterest: number; penaltyAmount: number } {
  const penalty = rule.fixedAmount ?? 0;
  return {
    eligibleInterest: Math.max(0, accrued.totalInterest - penalty),
    penaltyAmount: Math.min(penalty, accrued.totalInterest),
  };
}

/**
 * Find the applicable penalty rule from package configuration.
 */
function findPenaltyRule(packageSnapshot: PackageSnapshot): PenaltyRule {
  const rules = packageSnapshot.penaltyRules ?? [];
  if (rules.length === 0) {
    return { strategy: PenaltyStrategy.NO_INTEREST };
  }
  // Find the first rule with a recognized strategy, or fall back to first rule
  const valid = rules.find(
    (r) =>
      r.strategy === PenaltyStrategy.NO_INTEREST ||
      r.strategy === PenaltyStrategy.DEMAND_INTEREST ||
      r.strategy === PenaltyStrategy.FIXED_PENALTY ||
      r.strategy === PenaltyStrategy.PROVIDER_FORMULA ||
      r.strategy === PenaltyStrategy.PROVIDER_CUSTOM,
  );
  return valid ?? rules[0];
}

function requiresProviderOrManualQuote(strategy: string): boolean {
  return [
    PenaltyStrategy.PROVIDER_FORMULA,
    PenaltyStrategy.PROVIDER_CUSTOM,
  ].includes(
    strategy as unknown as
      | typeof PenaltyStrategy.PROVIDER_FORMULA
      | typeof PenaltyStrategy.PROVIDER_CUSTOM,
  );
}

/**
 * Early withdrawal preview from approved package penalty rules only.
 * Does not evaluate provider formula expressions. Provider/custom strategies
 * leave eligible/penalty/net unknown until a durable provider/manual quote exists.
 */
export function previewEarlyWithdrawal(
  input: EarlyWithdrawalInput,
): EarlyWithdrawalPreview {
  const accrued = accruedToDate(input);
  const totalTermDays = Math.max(
    0,
    differenceInUtcCalendarDays(input.startDate, input.endDate),
  );
  const penaltyRule = findPenaltyRule(input.packageSnapshot);

  if (requiresProviderOrManualQuote(penaltyRule.strategy)) {
    return {
      principal: input.principal,
      accruedInterest: accrued.totalInterest,
      eligibleInterest: null,
      penaltyAmount: null,
      netReturned: null,
      penaltyStrategy: penaltyRule.strategy,
      daysHeld: accrued.daysElapsed,
      totalTermDays,
      quoteReady: false,
    };
  }

  let eligibleInterest: number;
  let penaltyAmount: number;

  switch (penaltyRule.strategy) {
    case PenaltyStrategy.NO_INTEREST:
      ({ eligibleInterest, penaltyAmount } = calcNoInterest(
        input.principal,
        accrued,
      ));
      break;
    case PenaltyStrategy.DEMAND_INTEREST:
      ({ eligibleInterest, penaltyAmount } = calcDemandInterest(
        input.principal,
        accrued,
        penaltyRule,
      ));
      break;
    case PenaltyStrategy.FIXED_PENALTY:
      ({ eligibleInterest, penaltyAmount } = calcFixedPenalty(
        accrued,
        penaltyRule,
      ));
      break;
    default:
      return {
        principal: input.principal,
        accruedInterest: accrued.totalInterest,
        eligibleInterest: null,
        penaltyAmount: null,
        netReturned: null,
        penaltyStrategy: penaltyRule.strategy,
        daysHeld: accrued.daysElapsed,
        totalTermDays,
        quoteReady: false,
      };
  }

  const netReturned = input.principal + eligibleInterest;

  return {
    principal: input.principal,
    accruedInterest: accrued.totalInterest,
    eligibleInterest,
    penaltyAmount,
    netReturned: Math.max(0, netReturned),
    penaltyStrategy: penaltyRule.strategy,
    daysHeld: accrued.daysElapsed,
    totalTermDays,
    quoteReady: true,
  };
}

/**
 * Check if penalty exceeds warning threshold (> 50% of accrued interest).
 */
export function shouldWarnPenalty(preview: EarlyWithdrawalPreview): boolean {
  if (!preview.quoteReady) return false;
  if (preview.accruedInterest <= 0) return false;
  if (preview.penaltyAmount == null) return false;
  const ratio = (preview.penaltyAmount / preview.accruedInterest) * 100;
  return ratio >= PENALTY_WARNING_THRESHOLD_PCT;
}
