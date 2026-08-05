import {
  PenaltyStrategy,
  DAYS_PER_YEAR,
  INTEREST_RATE_DENOMINATOR,
  PENALTY_WARNING_THRESHOLD_PCT,
} from "./savings-constants";
import type { PenaltyRule, PackageSnapshot } from "./savings-types";
import { calculateInterest, type InterestResult } from "./savings-interest";

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
  accruedInterest: number;
  eligibleInterest: number;
  penaltyAmount: number;
  netReturned: number;
  penaltyStrategy: string;
  /** Number of days since start. */
  daysHeld: number;
  /** Total days in term. */
  totalTermDays: number;
};

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / msPerDay));
}

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
    (principal * (demandRate / INTEREST_RATE_DENOMINATOR) *
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
 * Provider Formula penalty: evaluate a simple formula expression.
 * Supported variables: principal, accruedInterest, daysHeld, totalTermDays
 * Example: "accruedInterest * 0.7" means keep 70%, penalty = 30%
 */
function calcProviderFormula(
  principal: number,
  accrued: InterestResult,
  totalTermDays: number,
  rule: PenaltyRule,
): { eligibleInterest: number; penaltyAmount: number } {
  const expr = rule.formulaExpression;
  if (!expr) {
    return calcNoInterest(principal, accrued);
  }

  try {
    // Simple formula: support basic arithmetic
    // Replace variables with values
    const replaced = expr
      .replace(/principal/g, String(principal))
      .replace(/accruedInterest/g, String(accrued.totalInterest))
      .replace(/daysHeld/g, String(accrued.daysElapsed))
      .replace(/totalTermDays/g, String(totalTermDays));

    // Safe evaluation using Function
    const result = new Function(`return ${replaced}`)();
    const eligible = Math.max(0, Math.floor(Number(result) || 0));
    return {
      eligibleInterest: Math.min(eligible, accrued.totalInterest),
      penaltyAmount: Math.max(
        0,
        accrued.totalInterest - eligible,
      ),
    };
  } catch {
    return calcNoInterest(principal, accrued);
  }
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
      r.strategy === PenaltyStrategy.PROVIDER_FORMULA,
  );
  return valid ?? rules[0];
}

/**
 * Main early withdrawal preview calculation.
 */
export function previewEarlyWithdrawal(
  input: EarlyWithdrawalInput,
): EarlyWithdrawalPreview {
  const accrued = accruedToDate(input);
  const totalTermDays = daysBetween(input.startDate, input.endDate);
  const penaltyRule = findPenaltyRule(input.packageSnapshot);

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
    case PenaltyStrategy.PROVIDER_FORMULA:
      ({ eligibleInterest, penaltyAmount } = calcProviderFormula(
        input.principal,
        accrued,
        totalTermDays,
        penaltyRule,
      ));
      break;
    case PenaltyStrategy.PROVIDER_CUSTOM:
      // Custom is a placeholder for future provider-specific logic
      // For now, fall through to no interest
    default:
      ({ eligibleInterest, penaltyAmount } = calcNoInterest(
        input.principal,
        accrued,
      ));
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
  };
}

/**
 * Check if penalty exceeds warning threshold (> 50% of accrued interest).
 */
export function shouldWarnPenalty(preview: EarlyWithdrawalPreview): boolean {
  if (preview.accruedInterest <= 0) return false;
  const ratio =
    (preview.penaltyAmount / preview.accruedInterest) * 100;
  return ratio >= PENALTY_WARNING_THRESHOLD_PCT;
}
