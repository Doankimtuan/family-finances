/**
 * Pure loan amortization engine (client-safe).
 * Monthly rate = annualRatePct / 12 / 100 (consumer EMI convention).
 * Interest strategy (rate segments) is orthogonal to repayment method.
 */

import {
  LoanInterestStrategy,
  LoanRepaymentMethod,
  LoanTermUnit,
  type LoanInterestStrategy as LoanInterestStrategyValue,
  type LoanRepaymentMethod as LoanRepaymentMethodValue,
  type LoanTermUnit as LoanTermUnitValue,
} from "./ledger-constants";

export type AmortizationEntry = {
  sequence: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  remainingBalanceAfter: number;
  annualRatePct: number;
};

export type AmortizationSchedule = {
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  endDate: string;
  termMonths: number;
  entries: AmortizationEntry[];
  /** First period payment after a rate change (promo / multi-segment). */
  monthlyPaymentAfterChange: number | null;
  changeAfterMonths: number | null;
  rateChangeDate: string | null;
};

export type InterestRateSegment = {
  effectiveFrom: string;
  annualRatePct: number;
};

export type BuildScheduleInput = {
  principal: number;
  termMonths: number;
  firstPaymentDate: string;
  repaymentMethod: LoanRepaymentMethodValue;
  rateSegments: InterestRateSegment[];
  /** @deprecated Prefer rateSegments; single-rate convenience. */
  annualRatePct?: number;
};

function parseYmd(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function formatYmd(y: number, m: number, d: number): string {
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const day = Math.min(d, dim);
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function addMonthsYmd(iso: string, months: number): string {
  const { y, m, d } = parseYmd(iso);
  const dt = new Date(Date.UTC(y, m - 1 + months, 1));
  const dim = new Date(
    Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const day = Math.min(d, dim);
  return formatYmd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, day);
}

export function normalizeTermToMonths(
  value: number,
  unit: LoanTermUnitValue,
): number {
  const n = Math.trunc(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return unit === LoanTermUnit.YEARS ? n * 12 : n;
}

function roundHalfUp(n: number): number {
  return Math.round(n);
}

function monthlyRate(annualRatePct: number): number {
  return annualRatePct / 12 / 100;
}

function annuityPayment(principal: number, r: number, n: number): number {
  if (n <= 0) return 0;
  if (r === 0) return roundHalfUp(principal / n);
  const factor = Math.pow(1 + r, n);
  return roundHalfUp((principal * r * factor) / (factor - 1));
}

function normalizeSegments(
  segments: InterestRateSegment[],
  fallbackRate: number,
  firstPaymentDate: string,
): InterestRateSegment[] {
  const cleaned = segments
    .filter((s) => s.effectiveFrom && Number.isFinite(s.annualRatePct))
    .map((s) => ({
      effectiveFrom: s.effectiveFrom,
      annualRatePct: Math.max(0, s.annualRatePct),
    }))
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  if (cleaned.length === 0) {
    return [
      {
        effectiveFrom: firstPaymentDate,
        annualRatePct: Math.max(0, fallbackRate),
      },
    ];
  }
  return cleaned;
}

export function resolveRateForDate(
  dueDate: string,
  segments: InterestRateSegment[],
): number {
  let rate = segments[0]?.annualRatePct ?? 0;
  for (const segment of segments) {
    if (segment.effectiveFrom <= dueDate) {
      rate = segment.annualRatePct;
    } else {
      break;
    }
  }
  return rate;
}

export function buildRateSegmentsFromStrategy(input: {
  interestStrategy: LoanInterestStrategyValue;
  firstPaymentDate: string;
  annualInterestRate: number;
  promoFixedRate?: number | null;
  promoFixedMonths?: number | null;
  promoFloatingRate?: number | null;
  promoRateEffectiveOn?: string | null;
}): InterestRateSegment[] {
  const start = input.firstPaymentDate;
  if (input.interestStrategy === LoanInterestStrategy.PROMO_FIXED_TO_FLOATING) {
    const fixedMonths = Math.max(1, Math.trunc(input.promoFixedMonths ?? 1));
    const switchDate =
      input.promoRateEffectiveOn && input.promoRateEffectiveOn >= start
        ? input.promoRateEffectiveOn
        : addMonthsYmd(start, fixedMonths);
    return [
      {
        effectiveFrom: start,
        annualRatePct: Math.max(0, input.promoFixedRate ?? 0),
      },
      {
        effectiveFrom: switchDate,
        annualRatePct: Math.max(0, input.promoFloatingRate ?? 0),
      },
    ];
  }
  return [
    {
      effectiveFrom: start,
      annualRatePct: Math.max(0, input.annualInterestRate),
    },
  ];
}

function buildScheduleWithSegments(input: {
  principal: number;
  termMonths: number;
  firstPaymentDate: string;
  repaymentMethod: LoanRepaymentMethodValue;
  rateSegments: InterestRateSegment[];
}): AmortizationSchedule {
  const n = Math.trunc(input.termMonths);
  const p = Math.trunc(input.principal);
  const segments = normalizeSegments(
    input.rateSegments,
    0,
    input.firstPaymentDate,
  );
  const entries: AmortizationEntry[] = [];
  let balance = p;
  let totalInterest = 0;
  let currentPmt = 0;
  let lastRate: number | null = null;
  let monthlyPaymentAfterChange: number | null = null;
  let changeAfterMonths: number | null = null;
  let rateChangeDate: string | null = null;
  // Declining balance: equal principal slices via half-up (not floor).
  // Final period takes the residual so sum(principal) === P.
  const reducingBase =
    input.repaymentMethod === LoanRepaymentMethod.REDUCING_BALANCE && n > 0
      ? roundHalfUp(p / n)
      : 0;
  const isReducing =
    input.repaymentMethod === LoanRepaymentMethod.REDUCING_BALANCE;

  for (let i = 1; i <= n; i += 1) {
    const dueDate = addMonthsYmd(input.firstPaymentDate, i - 1);
    const annualRatePct = resolveRateForDate(dueDate, segments);
    const r = monthlyRate(annualRatePct);
    const remainingPeriods = n - i + 1;

    if (lastRate === null || annualRatePct !== lastRate) {
      if (!isReducing) {
        currentPmt = annuityPayment(balance, r, remainingPeriods);
      }
      if (lastRate !== null && changeAfterMonths === null) {
        changeAfterMonths = i - 1;
        rateChangeDate = dueDate;
        // Equal-monthly: new PMT. Declining: set after this period's totalDue.
        monthlyPaymentAfterChange = isReducing ? null : currentPmt;
      }
      lastRate = annualRatePct;
    }

    // Interest always on remaining balance at this period's rate (never on
    // original principal after the promo window).
    const interestDue = roundHalfUp(balance * r);
    let principalDue: number;
    if (isReducing) {
      principalDue = i === n ? balance : reducingBase;
      if (principalDue > balance) principalDue = balance;
    } else {
      principalDue = currentPmt - interestDue;
      if (i === n || principalDue > balance) {
        principalDue = balance;
      }
      if (principalDue < 0) principalDue = 0;
    }

    const totalDue = principalDue + interestDue;
    balance = Math.max(0, balance - principalDue);
    totalInterest += interestDue;
    entries.push({
      sequence: i,
      dueDate,
      principalDue,
      interestDue,
      totalDue,
      remainingBalanceAfter: balance,
      annualRatePct,
    });

    if (
      isReducing &&
      monthlyPaymentAfterChange == null &&
      changeAfterMonths != null &&
      i === changeAfterMonths + 1
    ) {
      monthlyPaymentAfterChange = totalDue;
    }
  }

  // First-segment / current payment (promo UI compares this to after-change).
  // Declining-balance totals vary each month — never use schedule max here,
  // or the post-switch peak can mask the promo step-up.
  const monthlyPayment = entries[0]?.totalDue ?? 0;

  if (
    monthlyPaymentAfterChange == null &&
    changeAfterMonths != null &&
    entries[changeAfterMonths]
  ) {
    monthlyPaymentAfterChange = entries[changeAfterMonths]!.totalDue;
  }

  return {
    monthlyPayment,
    totalInterest,
    totalRepayment: p + totalInterest,
    endDate: entries[entries.length - 1]?.dueDate ?? input.firstPaymentDate,
    termMonths: n,
    entries,
    monthlyPaymentAfterChange,
    changeAfterMonths,
    rateChangeDate,
  };
}

/** @deprecated Prefer buildAmortizationSchedule with rateSegments. */
export function buildFixedMonthlySchedule(input: {
  principal: number;
  annualRatePct: number;
  termMonths: number;
  firstPaymentDate: string;
}): AmortizationSchedule {
  return buildScheduleWithSegments({
    principal: input.principal,
    termMonths: input.termMonths,
    firstPaymentDate: input.firstPaymentDate,
    repaymentMethod: LoanRepaymentMethod.FIXED_MONTHLY,
    rateSegments: [
      {
        effectiveFrom: input.firstPaymentDate,
        annualRatePct: input.annualRatePct,
      },
    ],
  });
}

/** @deprecated Prefer buildAmortizationSchedule with rateSegments. */
export function buildReducingBalanceSchedule(input: {
  principal: number;
  annualRatePct: number;
  termMonths: number;
  firstPaymentDate: string;
}): AmortizationSchedule {
  return buildScheduleWithSegments({
    principal: input.principal,
    termMonths: input.termMonths,
    firstPaymentDate: input.firstPaymentDate,
    repaymentMethod: LoanRepaymentMethod.REDUCING_BALANCE,
    rateSegments: [
      {
        effectiveFrom: input.firstPaymentDate,
        annualRatePct: input.annualRatePct,
      },
    ],
  });
}

export function buildAmortizationSchedule(
  input: BuildScheduleInput,
): AmortizationSchedule {
  const rateSegments =
    input.rateSegments?.length > 0
      ? input.rateSegments
      : [
          {
            effectiveFrom: input.firstPaymentDate,
            annualRatePct: input.annualRatePct ?? 0,
          },
        ];
  return buildScheduleWithSegments({
    principal: input.principal,
    termMonths: input.termMonths,
    firstPaymentDate: input.firstPaymentDate,
    repaymentMethod: input.repaymentMethod,
    rateSegments,
  });
}

export type LoanPreviewInput = {
  principal: number;
  termValue: number;
  termUnit: LoanTermUnitValue;
  repaymentMethod: LoanRepaymentMethodValue;
  firstPaymentDate: string;
  interestStrategy: LoanInterestStrategyValue;
  annualInterestRate: number;
  promoFixedRate?: number | null;
  promoFixedMonths?: number | null;
  promoFloatingRate?: number | null;
  promoRateEffectiveOn?: string | null;
};

export type LoanPreviewResult = {
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  endDate: string;
  monthlyPaymentAfterChange: number | null;
  changeAfterMonths: number | null;
  rateChangeDate: string | null;
};

export function simulateLoanPreview(
  input: LoanPreviewInput,
): LoanPreviewResult | null {
  const termMonths = normalizeTermToMonths(input.termValue, input.termUnit);
  if (
    !Number.isFinite(input.principal) ||
    input.principal <= 0 ||
    termMonths <= 0 ||
    !input.firstPaymentDate
  ) {
    return null;
  }
  if (
    input.interestStrategy === LoanInterestStrategy.PROMO_FIXED_TO_FLOATING &&
    !(input.promoFixedMonths != null && input.promoFixedMonths > 0)
  ) {
    return null;
  }

  const rateSegments = buildRateSegmentsFromStrategy({
    interestStrategy: input.interestStrategy,
    firstPaymentDate: input.firstPaymentDate,
    annualInterestRate: input.annualInterestRate,
    promoFixedRate: input.promoFixedRate,
    promoFixedMonths: input.promoFixedMonths,
    promoFloatingRate: input.promoFloatingRate,
    promoRateEffectiveOn: input.promoRateEffectiveOn,
  });

  const schedule = buildAmortizationSchedule({
    principal: Math.trunc(input.principal),
    termMonths,
    firstPaymentDate: input.firstPaymentDate,
    repaymentMethod: input.repaymentMethod,
    rateSegments,
  });

  return {
    termMonths: schedule.termMonths,
    monthlyPayment: schedule.monthlyPayment,
    totalInterest: schedule.totalInterest,
    totalRepayment: schedule.totalRepayment,
    endDate: schedule.endDate,
    monthlyPaymentAfterChange: schedule.monthlyPaymentAfterChange,
    changeAfterMonths: schedule.changeAfterMonths,
    rateChangeDate: schedule.rateChangeDate,
  };
}

/**
 * Rebuild upcoming schedule after rate change or partial principal cut.
 * Caller renumbers sequences relative to paid history.
 */
export function recomputeUpcomingSchedule(input: {
  remainingPrincipal: number;
  remainingTermMonths: number;
  nextPaymentDate: string;
  repaymentMethod: LoanRepaymentMethodValue;
  rateSegments: InterestRateSegment[];
  sequenceStart?: number;
}): AmortizationSchedule {
  const schedule = buildAmortizationSchedule({
    principal: Math.max(0, Math.trunc(input.remainingPrincipal)),
    termMonths: Math.max(1, Math.trunc(input.remainingTermMonths)),
    firstPaymentDate: input.nextPaymentDate,
    repaymentMethod: input.repaymentMethod,
    rateSegments: input.rateSegments,
  });
  const offset = Math.max(1, input.sequenceStart ?? 1) - 1;
  if (offset === 0) return schedule;
  return {
    ...schedule,
    entries: schedule.entries.map((entry) => ({
      ...entry,
      sequence: entry.sequence + offset,
    })),
  };
}

/** @deprecated Use recomputeUpcomingSchedule. */
export function recomputeScheduleAfterEarlyPayoff(input: {
  remainingPrincipal: number;
  annualRatePct: number;
  remainingTermMonths: number;
  nextPaymentDate: string;
  repaymentMethod: LoanRepaymentMethodValue;
}): AmortizationSchedule {
  return recomputeUpcomingSchedule({
    remainingPrincipal: input.remainingPrincipal,
    remainingTermMonths: input.remainingTermMonths,
    nextPaymentDate: input.nextPaymentDate,
    repaymentMethod: input.repaymentMethod,
    rateSegments: [
      {
        effectiveFrom: input.nextPaymentDate,
        annualRatePct: input.annualRatePct,
      },
    ],
  });
}

/** Early payoff = remaining principal + sum of interest on unpaid schedule entries. */
export function computeEarlyPayoffAmount(
  remainingPrincipal: number,
  upcomingInterestTotal: number,
): number {
  return (
    Math.max(0, Math.trunc(remainingPrincipal)) +
    Math.max(0, Math.trunc(upcomingInterestTotal))
  );
}
