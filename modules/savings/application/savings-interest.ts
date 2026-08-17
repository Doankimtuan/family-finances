import {
  InterestCalcMethod,
  DAYS_PER_YEAR,
  INTEREST_RATE_DENOMINATOR,
} from "./savings-constants";
import {
  differenceInUtcCalendarDays,
  MILLISECONDS_PER_DAY,
} from "@/shared/utils/iso-date";

/**
 * Interest calculation engine for savings products.
 * All amounts in minor currency units (VND whole đồng).
 */

export type InterestInput = {
  principal: number;
  annualRate: number;
  startDate: string;
  endDate: string;
  method: (typeof InterestCalcMethod)[keyof typeof InterestCalcMethod];
  /** Optional as-of date for partial period calculation. Defaults to endDate. */
  asOfDate?: string;
};

export type InterestResult = {
  totalInterest: number;
  daysElapsed: number;
  dailyRate: number;
  annualRate: number;
};

/**
 * Calculate interest using simple interest formula: principal * (rate/100) * (days/365).
 * Rounds down to whole đồng.
 */
function calcSimpleInterest(
  principal: number,
  annualRate: number,
  days: number,
): number {
  const rate = annualRate / INTEREST_RATE_DENOMINATOR;
  return Math.floor((principal * rate * days) / DAYS_PER_YEAR);
}

/**
 * Calculate interest using daily compound formula.
 * A = P * (1 + r/365)^days - P
 */
function calcCompoundDailyInterest(
  principal: number,
  annualRate: number,
  days: number,
): number {
  const dailyRate = annualRate / INTEREST_RATE_DENOMINATOR / DAYS_PER_YEAR;
  const amount = principal * Math.pow(1 + dailyRate, days);
  return Math.floor(amount - principal);
}

/**
 * Calculate interest using monthly compound formula.
 * A = P * (1 + r/12)^months - P, then prorate partial month.
 */
function calcCompoundMonthlyInterest(
  principal: number,
  annualRate: number,
  days: number,
): number {
  const monthlyRate =
    annualRate / INTEREST_RATE_DENOMINATOR / 12;
  const fullMonths = Math.floor(days / 30);
  const partialDays = days % 30;

  let amount = principal;
  if (fullMonths > 0) {
    amount = principal * Math.pow(1 + monthlyRate, fullMonths);
  }
  if (partialDays > 0) {
    const dailyRate =
      annualRate / INTEREST_RATE_DENOMINATOR / DAYS_PER_YEAR;
    amount = amount * (1 + dailyRate * partialDays);
  }

  return Math.floor(amount - principal);
}

/**
 * Main interest calculation entry point.
 */
export function calculateInterest(input: InterestInput): InterestResult {
  const effectiveEnd = input.asOfDate ?? input.endDate;
  // Savings dates are UTC calendar dates: start is included, end is excluded.
  const days = Math.max(
    0,
    differenceInUtcCalendarDays(input.startDate, effectiveEnd),
  );
  const annualRate = input.annualRate;

  let totalInterest = 0;
  switch (input.method) {
    case InterestCalcMethod.SIMPLE:
      totalInterest = calcSimpleInterest(
        input.principal,
        annualRate,
        days,
      );
      break;
    case InterestCalcMethod.COMPOUND_DAILY:
      totalInterest = calcCompoundDailyInterest(
        input.principal,
        annualRate,
        days,
      );
      break;
    case InterestCalcMethod.COMPOUND_MONTHLY:
      totalInterest = calcCompoundMonthlyInterest(
        input.principal,
        annualRate,
        days,
      );
      break;
    default:
      totalInterest = calcSimpleInterest(
        input.principal,
        annualRate,
        days,
      );
  }

  const dailyRate = annualRate / INTEREST_RATE_DENOMINATOR / DAYS_PER_YEAR;

  return {
    totalInterest: Math.max(0, totalInterest),
    daysElapsed: days,
    dailyRate,
    annualRate,
  };
}

/**
 * Compute accrued interest for an active cycle as of today (or specified date).
 */
export function computeAccruedInterest(input: {
  principal: number;
  annualRate: number;
  startDate: string;
  endDate: string;
  method: (typeof InterestCalcMethod)[keyof typeof InterestCalcMethod];
  asOfDate?: string;
}): InterestResult {
  return calculateInterest({
    principal: input.principal,
    annualRate: input.annualRate,
    startDate: input.startDate,
    endDate: input.endDate,
    method: input.method,
    asOfDate: input.asOfDate,
  });
}

/**
 * Compute estimated interest for a full term.
 */
export function computeFullTermInterest(input: {
  principal: number;
  annualRate: number;
  durationDays: number;
  method: (typeof InterestCalcMethod)[keyof typeof InterestCalcMethod];
}): number {
  const start = new Date();
  const end = new Date(
    start.getTime() + input.durationDays * MILLISECONDS_PER_DAY,
  );
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  return calculateInterest({
    principal: input.principal,
    annualRate: input.annualRate,
    startDate: startStr,
    endDate: endStr,
    method: input.method,
  }).totalInterest;
}
