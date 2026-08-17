/** Credit-card billing and card-origin installment values. */

export const CardBillingMonthStatus = {
  OPEN: "open",
  PARTIAL: "partial",
  SETTLED: "settled",
} as const;

export type CardBillingMonthStatus =
  (typeof CardBillingMonthStatus)[keyof typeof CardBillingMonthStatus];

export const CARD_BILLING_MONTH_STATUS_VALUES = [
  CardBillingMonthStatus.OPEN,
  CardBillingMonthStatus.PARTIAL,
  CardBillingMonthStatus.SETTLED,
] as const;

export const CardBillingItemType = {
  STANDARD: "standard",
  INSTALLMENT: "installment",
} as const;

export type CardBillingItemType =
  (typeof CardBillingItemType)[keyof typeof CardBillingItemType];

export const CARD_BILLING_ITEM_TYPE_VALUES = [
  CardBillingItemType.STANDARD,
  CardBillingItemType.INSTALLMENT,
] as const;

/** Card purchase trackers are distinct from the Loan bounded context. */
export const CreditCardInstallmentOrigin = {
  POST_PURCHASE: "post_purchase",
  PARTNER_MERCHANT: "partner_merchant",
  OTHER: "other",
} as const;
export type CreditCardInstallmentOrigin =
  (typeof CreditCardInstallmentOrigin)[keyof typeof CreditCardInstallmentOrigin];
export const CREDIT_CARD_INSTALLMENT_ORIGIN_VALUES = [
  CreditCardInstallmentOrigin.POST_PURCHASE,
  CreditCardInstallmentOrigin.PARTNER_MERCHANT,
  CreditCardInstallmentOrigin.OTHER,
] as const;

export const CreditCardInstallmentProgram = {
  ZERO_INTEREST_ZERO_FEE: "zero_interest_zero_fee",
  ZERO_INTEREST_WITH_CONVERSION_FEE: "zero_interest_with_conversion_fee",
  FLAT_INTEREST_WITHOUT_CONVERSION_FEE: "flat_interest_without_conversion_fee",
  FLAT_INTEREST_WITH_CONVERSION_FEE: "flat_interest_with_conversion_fee",
  BANK_QUOTED: "bank_quoted",
} as const;
export type CreditCardInstallmentProgram =
  (typeof CreditCardInstallmentProgram)[keyof typeof CreditCardInstallmentProgram];
export const CREDIT_CARD_INSTALLMENT_PROGRAM_VALUES = [
  CreditCardInstallmentProgram.ZERO_INTEREST_ZERO_FEE,
  CreditCardInstallmentProgram.ZERO_INTEREST_WITH_CONVERSION_FEE,
  CreditCardInstallmentProgram.FLAT_INTEREST_WITHOUT_CONVERSION_FEE,
  CreditCardInstallmentProgram.FLAT_INTEREST_WITH_CONVERSION_FEE,
  CreditCardInstallmentProgram.BANK_QUOTED,
] as const;

export const CreditCardInstallmentFeeType = {
  NONE: "none",
  FIXED: "fixed",
  PERCENTAGE: "percentage",
} as const;
export type CreditCardInstallmentFeeType =
  (typeof CreditCardInstallmentFeeType)[keyof typeof CreditCardInstallmentFeeType];
export const CREDIT_CARD_INSTALLMENT_FEE_TYPE_VALUES = [
  CreditCardInstallmentFeeType.NONE,
  CreditCardInstallmentFeeType.FIXED,
  CreditCardInstallmentFeeType.PERCENTAGE,
] as const;

export const CreditCardInstallmentFeeTiming = {
  FIRST_EXPECTED_PERIOD: "first_expected_period",
  SPREAD_ACROSS_PERIODS: "spread_across_periods",
  INCLUDED_IN_BANK_QUOTE: "included_in_bank_quote",
} as const;
export type CreditCardInstallmentFeeTiming =
  (typeof CreditCardInstallmentFeeTiming)[keyof typeof CreditCardInstallmentFeeTiming];
export const CREDIT_CARD_INSTALLMENT_FEE_TIMING_VALUES = [
  CreditCardInstallmentFeeTiming.FIRST_EXPECTED_PERIOD,
  CreditCardInstallmentFeeTiming.SPREAD_ACROSS_PERIODS,
  CreditCardInstallmentFeeTiming.INCLUDED_IN_BANK_QUOTE,
] as const;
export const CreditCardInstallmentCalculationSource = {
  DERIVED: "derived",
  BANK_QUOTED: "bank_quoted",
} as const;
export type CreditCardInstallmentCalculationSource =
  (typeof CreditCardInstallmentCalculationSource)[keyof typeof CreditCardInstallmentCalculationSource];
export const CREDIT_CARD_INSTALLMENT_CALCULATION_SOURCE_VALUES = [
  CreditCardInstallmentCalculationSource.DERIVED,
  CreditCardInstallmentCalculationSource.BANK_QUOTED,
] as const;

export const CreditCardInstallmentStatus = {
  ACTIVE: "active",
  STOPPED: "stopped",
  REVIEW_REQUIRED: "review_required",
  COMPLETED: "completed",
} as const;
export type CreditCardInstallmentStatus =
  (typeof CreditCardInstallmentStatus)[keyof typeof CreditCardInstallmentStatus];

export const CreditCardInstallmentScheduleStatus = {
  EXPECTED: "expected",
  CONFIRMED: "confirmed",
} as const;
export type CreditCardInstallmentScheduleStatus =
  (typeof CreditCardInstallmentScheduleStatus)[keyof typeof CreditCardInstallmentScheduleStatus];

export const CARD_INSTALLMENT_TERM_PRESETS = [3, 6, 9, 12, 18, 24] as const;

/** Legacy-compatible defaults for new credit cards. */
export const DEFAULT_CARD_STATEMENT_DAY = 25;
export const DEFAULT_CARD_DUE_DAY = 15;
export const DEFAULT_CARD_INSTALLMENT_COUNT = 3;

export const CARD_UTILIZATION_WARN_PCT = 50;
export const CARD_UTILIZATION_DANGER_PCT = 80;

export const CARD_PAYMENT_IDEMPOTENCY_KEY_PREFIX = "card-pay:";
export const CARD_PAYMENT_IDEMPOTENCY_KEY_MIN_LEN = 8;
export const CARD_PAYMENT_IDEMPOTENCY_KEY_MAX_LEN = 160;

export function createCardPaymentIdempotencyKey(): string {
  return `${CARD_PAYMENT_IDEMPOTENCY_KEY_PREFIX}${crypto.randomUUID()}`;
}

export const SETTLE_CARD_INVALID_ERROR_NEEDLES = [
  "invalid",
  "not found",
  "exceeds",
  "no remaining",
  "cannot be",
] as const;

/** Compatibility markers for the legacy card settlement RPC. */
export const CARD_LEGACY_RPC_ERROR_MARKERS = [
  ...SETTLE_CARD_INVALID_ERROR_NEEDLES,
  "authentication required",
  "not a household member",
  "card not found",
  "source account not found",
  "card settings not found",
] as const;
