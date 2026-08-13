import {
  CreditCardInstallmentCalculationSource,
  CreditCardInstallmentFeeTiming,
  CreditCardInstallmentFeeType,
  CreditCardInstallmentProgram,
  CreditCardInstallmentScheduleStatus,
  type CreditCardInstallmentCalculationSource as CreditCardInstallmentCalculationSourceValue,
  type CreditCardInstallmentFeeTiming as CreditCardInstallmentFeeTimingValue,
  type CreditCardInstallmentFeeType as CreditCardInstallmentFeeTypeValue,
  type CreditCardInstallmentOrigin,
  type CreditCardInstallmentProgram as CreditCardInstallmentProgramValue,
  type CreditCardInstallmentScheduleStatus as CreditCardInstallmentScheduleStatusValue,
  type CreditCardInstallmentStatus as CreditCardInstallmentStatusValue,
} from "./ledger-constants";
import { addMonthsYmd } from "./loan-amortization";

export type CreditCardInstallmentScheduleEntry = {
  id?: string;
  installmentNumber: number;
  expectedDate: string;
  principalAmount: number;
  conversionFeeAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: CreditCardInstallmentScheduleStatusValue;
  confirmedAt?: string | null;
};

export type CreditCardInstallment = {
  id: string;
  cardAccountId: string;
  sourceTransactionId: string;
  origin: CreditCardInstallmentOrigin;
  description: string;
  principal: number;
  termCount: number;
  firstExpectedDate: string;
  program: CreditCardInstallmentProgramValue;
  calculationSource: CreditCardInstallmentCalculationSourceValue;
  conversionFeeType: CreditCardInstallmentFeeTypeValue;
  conversionFeeRateBps: number | null;
  conversionFeeAmount: number;
  feeTiming: CreditCardInstallmentFeeTimingValue;
  flatInterestRateBps: number | null;
  totalInterestAmount: number;
  quotedTotalRepayment: number | null;
  status: CreditCardInstallmentStatusValue;
  note: string | null;
  schedule: CreditCardInstallmentScheduleEntry[];
};

export type CreditCardInstallmentPreviewInput = {
  principal: number;
  termCount: number;
  firstExpectedDate: string;
  program: CreditCardInstallmentProgramValue;
  calculationSource: CreditCardInstallmentCalculationSourceValue;
  conversionFeeType: CreditCardInstallmentFeeTypeValue;
  conversionFeeFixedAmount?: number | null;
  conversionFeeRateBps?: number | null;
  feeTiming: CreditCardInstallmentFeeTimingValue;
  flatInterestRateBps?: number | null;
  quotedTotalRepayment?: number | null;
};

export type CreditCardInstallmentPreview = {
  principal: number;
  conversionFeeAmount: number;
  interestAmount: number;
  totalExtraCost: number;
  totalRepayment: number;
  schedule: CreditCardInstallmentScheduleEntry[];
};

export type CreditCardInstallmentViewModel = {
  installment: CreditCardInstallment;
  confirmedTerms: number;
  remainingTerms: number;
  remainingPrincipal: number;
  nextExpected: CreditCardInstallmentScheduleEntry | null;
  totalExtraCost: number;
  totalRepayment: number;
  currentTerm: number;
  progressPercent: number;
  paidAmount: number;
  nextAmount: number;
  remainingAmount: number;
};

function asWholeVnd(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

/** Percentage values are basis points and round half up to whole VND. */
export function roundVndPercentage(amount: number, rateBps: number): number {
  const safeAmount = asWholeVnd(amount);
  const safeRate = asWholeVnd(rateBps);
  return Math.floor((safeAmount * safeRate + 5_000) / 10_000);
}

/** Converts a user-entered percentage to integer basis points. */
export function percentageToBasisPoints(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100));
}

/** The final expected period receives any indivisible VND remainder. */
export function allocateCreditCardInstallments(
  totalAmount: number,
  termCount: number,
): number[] {
  const total = asWholeVnd(totalAmount);
  const terms = Math.trunc(termCount);
  if (terms <= 0 || total <= 0) return [];
  const base = Math.floor(total / terms);
  const remainder = total - base * terms;
  return Array.from({ length: terms }, (_, index) =>
    index === terms - 1 ? base + remainder : base,
  );
}

function calculateConversionFee(
  input: CreditCardInstallmentPreviewInput,
): number {
  if (input.conversionFeeType === CreditCardInstallmentFeeType.NONE) return 0;
  if (input.conversionFeeType === CreditCardInstallmentFeeType.FIXED) {
    return asWholeVnd(input.conversionFeeFixedAmount ?? 0);
  }
  return roundVndPercentage(input.principal, input.conversionFeeRateBps ?? 0);
}

function calculateInterest(
  input: CreditCardInstallmentPreviewInput,
  conversionFeeAmount: number,
): number {
  if (
    input.calculationSource ===
    CreditCardInstallmentCalculationSource.BANK_QUOTED
  ) {
    const quoted = asWholeVnd(input.quotedTotalRepayment ?? 0);
    return Math.max(
      0,
      quoted - asWholeVnd(input.principal) - conversionFeeAmount,
    );
  }
  const monthlyRateBps = asWholeVnd(input.flatInterestRateBps ?? 0);
  return roundVndPercentage(
    asWholeVnd(input.principal) * Math.max(0, Math.trunc(input.termCount)),
    monthlyRateBps,
  );
}

function allocateFeeByTiming(
  amount: number,
  termCount: number,
  feeTiming: CreditCardInstallmentFeeTimingValue,
): number[] {
  if (feeTiming === CreditCardInstallmentFeeTiming.FIRST_EXPECTED_PERIOD) {
    return Array.from({ length: termCount }, (_, index) =>
      index === 0 ? amount : 0,
    );
  }
  return allocateCreditCardInstallments(amount, termCount);
}

/**
 * Builds a projection only. It never posts ledger transactions or marks card
 * statement items as paid.
 */
export function buildCreditCardInstallmentPreview(
  input: CreditCardInstallmentPreviewInput,
): CreditCardInstallmentPreview | null {
  const principal = asWholeVnd(input.principal);
  const termCount = Math.trunc(input.termCount);
  if (principal <= 0 || termCount <= 0 || !input.firstExpectedDate) return null;

  const conversionFeeAmount = calculateConversionFee(input);
  const interestAmount = calculateInterest(input, conversionFeeAmount);
  const principalRows = allocateCreditCardInstallments(principal, termCount);
  const feeRows = allocateFeeByTiming(
    conversionFeeAmount,
    termCount,
    input.feeTiming,
  );
  const interestRows = allocateCreditCardInstallments(
    interestAmount,
    termCount,
  );
  const schedule = principalRows.map((principalAmount, index) => {
    const conversionFeeRow = feeRows[index] ?? 0;
    const interestRow = interestRows[index] ?? 0;
    return {
      installmentNumber: index + 1,
      expectedDate: addMonthsYmd(input.firstExpectedDate, index),
      principalAmount,
      conversionFeeAmount: conversionFeeRow,
      interestAmount: interestRow,
      totalAmount: principalAmount + conversionFeeRow + interestRow,
      status: CreditCardInstallmentScheduleStatus.EXPECTED,
      confirmedAt: null,
    };
  });

  const totalRepayment = schedule.reduce(
    (sum, row) => sum + row.totalAmount,
    0,
  );
  return {
    principal,
    conversionFeeAmount,
    interestAmount,
    totalExtraCost: conversionFeeAmount + interestAmount,
    totalRepayment,
    schedule,
  };
}

export function buildCreditCardInstallmentViewModel(
  installment: CreditCardInstallment,
): CreditCardInstallmentViewModel {
  const confirmed = installment.schedule.filter(
    (entry) => entry.status === CreditCardInstallmentScheduleStatus.CONFIRMED,
  );
  const remaining = installment.schedule.filter(
    (entry) => entry.status !== CreditCardInstallmentScheduleStatus.CONFIRMED,
  );
  const conversionFeeAmount = installment.schedule.reduce(
    (sum, entry) => sum + entry.conversionFeeAmount,
    0,
  );
  const interestAmount = installment.schedule.reduce(
    (sum, entry) => sum + entry.interestAmount,
    0,
  );
  const paidAmount = confirmed.reduce(
    (sum, entry) => sum + entry.totalAmount,
    0,
  );
  const remainingAmount = remaining.reduce(
    (sum, entry) => sum + entry.totalAmount,
    0,
  );
  const nextAmount = remaining[0]?.totalAmount ?? 0;
  const progressPercent =
    installment.termCount > 0
      ? Math.round((confirmed.length / installment.termCount) * 100)
      : 0;
  return {
    installment,
    currentTerm: confirmed.length,
    progressPercent,
    paidAmount,
    nextAmount,
    remainingAmount,
    confirmedTerms: confirmed.length,
    remainingTerms: remaining.length,
    remainingPrincipal: remaining.reduce(
      (sum, entry) => sum + entry.principalAmount,
      0,
    ),
    nextExpected: remaining[0] ?? null,
    totalExtraCost: conversionFeeAmount + interestAmount,
    totalRepayment: installment.schedule.reduce(
      (sum, entry) => sum + entry.totalAmount,
      0,
    ),
  };
}

export function isStructurallyEligibleCardPurchase(input: {
  amount: number;
  transactionType: string;
  hasRefundOrCorrection: boolean;
  alreadyTracked: boolean;
}): boolean {
  return (
    asWholeVnd(input.amount) > 0 &&
    input.transactionType === "expense" &&
    !input.hasRefundOrCorrection &&
    !input.alreadyTracked
  );
}

export function mapCreditCardInstallmentRow(row: {
  id: string;
  card_account_id: string;
  source_transaction_id: string;
  origin: string;
  description: string;
  principal: number | string;
  term_count: number;
  first_expected_date: string;
  program: string;
  calculation_source: string;
  conversion_fee_type: string;
  conversion_fee_rate_bps: number | string | null;
  conversion_fee_amount: number | string;
  fee_timing: string;
  flat_interest_rate_bps: number | string | null;
  total_interest_amount: number | string;
  quoted_total_repayment: number | string | null;
  status: string;
  note: string | null;
  credit_card_installment_schedule?: Array<{
    id: string;
    installment_number: number;
    expected_date: string;
    principal_amount: number | string;
    conversion_fee_amount: number | string;
    interest_amount: number | string;
    total_amount: number | string;
    status: string;
    confirmed_at: string | null;
  }> | null;
}): CreditCardInstallment {
  const schedule = (row.credit_card_installment_schedule ?? [])
    .map((entry) => ({
      id: entry.id,
      installmentNumber: entry.installment_number,
      expectedDate: entry.expected_date,
      principalAmount: Number(entry.principal_amount),
      conversionFeeAmount: Number(entry.conversion_fee_amount),
      interestAmount: Number(entry.interest_amount),
      totalAmount: Number(entry.total_amount),
      status: entry.status as CreditCardInstallmentScheduleStatusValue,
      confirmedAt: entry.confirmed_at,
    }))
    .sort((a, b) => a.installmentNumber - b.installmentNumber);
  return {
    id: row.id,
    cardAccountId: row.card_account_id,
    sourceTransactionId: row.source_transaction_id,
    origin: row.origin as CreditCardInstallmentOrigin,
    description: row.description,
    principal: Number(row.principal),
    termCount: row.term_count,
    firstExpectedDate: row.first_expected_date,
    program: row.program as CreditCardInstallmentProgramValue,
    calculationSource:
      row.calculation_source as CreditCardInstallmentCalculationSourceValue,
    conversionFeeType:
      row.conversion_fee_type as CreditCardInstallmentFeeTypeValue,
    conversionFeeRateBps:
      row.conversion_fee_rate_bps == null
        ? null
        : Number(row.conversion_fee_rate_bps),
    conversionFeeAmount: Number(row.conversion_fee_amount),
    feeTiming: row.fee_timing as CreditCardInstallmentFeeTimingValue,
    flatInterestRateBps:
      row.flat_interest_rate_bps == null
        ? null
        : Number(row.flat_interest_rate_bps),
    totalInterestAmount: Number(row.total_interest_amount),
    quotedTotalRepayment:
      row.quoted_total_repayment == null
        ? null
        : Number(row.quoted_total_repayment),
    status: row.status as CreditCardInstallmentStatusValue,
    note: row.note,
    schedule,
  };
}

export const DEFAULT_CREDIT_CARD_INSTALLMENT_PROGRAM =
  CreditCardInstallmentProgram.ZERO_INTEREST_ZERO_FEE;
