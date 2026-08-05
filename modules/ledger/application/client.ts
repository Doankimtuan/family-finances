/**
 * Client-safe Ledger exports — constants and types only.
 * Do not re-export queries/commands (they pull next/headers via the server Supabase client).
 */

export type { LedgerAccount, RealPosition } from "./account-types";
export type {
  LedgerTransaction,
  CategoryTag,
  CaptureJarOption,
} from "./transaction-types";
export {
  DEFAULT_CURRENCY,
  TransactionDirection,
  TRANSACTION_DIRECTION_OPTIONS,
  TRANSACTION_DIRECTION_VALUES,
  TransactionStatus,
  TRANSACTION_STATUS_VALUES,
  TRANSACTION_REFUNDABLE_STATUS_VALUES,
  TRANSACTION_CORRECTABLE_STATUS_VALUES,
  TRANSACTION_BALANCE_STATUS_VALUES,
  TransactionFilterType,
  TRANSACTION_FILTER_OPTIONS,
  AccountType,
  ACCOUNT_TYPE_VALUES,
  ACCOUNT_TYPE_LIQUID_VALUES,
  ACCOUNT_TYPE_CREATE_OPTIONS,
  CardBillingMonthStatus,
  CARD_BILLING_MONTH_STATUS_VALUES,
  CardBillingItemType,
  CARD_BILLING_ITEM_TYPE_VALUES,
  DEFAULT_CARD_STATEMENT_DAY,
  DEFAULT_CARD_DUE_DAY,
  DEFAULT_CARD_INSTALLMENT_COUNT,
  CARD_UTILIZATION_WARN_PCT,
  CARD_UTILIZATION_DANGER_PCT,
  LEDGER_ACTION_ERROR_CODE,
  TransactionSource,
  TRANSACTION_SOURCE_VALUES,
  LoanType,
  LOAN_TYPE_VALUES,
  LOAN_TYPE_OPTIONS,
  LoanStatus,
  LOAN_STATUS_VALUES,
  LoanRepaymentFrequency,
  LOAN_REPAYMENT_FREQUENCY_VALUES,
  LoanRepaymentMethod,
  LOAN_REPAYMENT_METHOD_VALUES,
  LOAN_REPAYMENT_METHOD_OPTIONS,
  LoanInterestStrategy,
  LOAN_INTEREST_STRATEGY_VALUES,
  LOAN_INTEREST_STRATEGY_OPTIONS,
  LoanInterestRatePeriodKind,
  LOAN_INTEREST_RATE_PERIOD_KIND_VALUES,
  LoanTermUnit,
  LOAN_TERM_UNIT_VALUES,
  LoanScheduleEntryStatus,
  LOAN_SCHEDULE_ENTRY_STATUS_VALUES,
  LoanPaymentMode,
  LOAN_PAYMENT_MODE_VALUES,
} from "./ledger-constants";
export type {
  LedgerActionErrorCode,
  TransactionSource as TransactionSourceValue,
  LoanType as LoanTypeValue,
  LoanStatus as LoanStatusValue,
  LoanRepaymentFrequency as LoanRepaymentFrequencyValue,
  LoanRepaymentMethod as LoanRepaymentMethodValue,
  LoanInterestStrategy as LoanInterestStrategyValue,
  LoanInterestRatePeriodKind as LoanInterestRatePeriodKindValue,
  LoanTermUnit as LoanTermUnitValue,
  LoanScheduleEntryStatus as LoanScheduleEntryStatusValue,
  LoanPaymentMode as LoanPaymentModeValue,
} from "./ledger-constants";
export {
  AccountHealthSignal,
  ACCOUNT_HEALTH_SIGNAL_VALUES,
  accountHealthFromBalance,
} from "./account-health";
export { isCreditCardType } from "./credit-card-types";
export type {
  CreditCardSummary,
  CreditCardDetail,
  CreditCardSettings,
  CardBillingMonth,
  CardBillingItem,
} from "./credit-card-types";
export type {
  Loan,
  LoanPayment,
  LoanScheduleEntry,
  LoanInterestRatePeriod,
} from "./money-product-types";
export {
  buildAmortizationSchedule,
  simulateLoanPreview,
  normalizeTermToMonths,
  computeEarlyPayoffAmount,
  buildRateSegmentsFromStrategy,
  addMonthsYmd,
} from "./loan-amortization";
