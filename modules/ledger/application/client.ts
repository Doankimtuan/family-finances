/**
 * Client-safe Ledger exports — constants and types only.
 * Do not re-export queries/commands (they pull next/headers via the server Supabase client).
 */

export type { LedgerAccount, RealPosition } from "./account-types";
export type {
  LedgerTransaction,
  TransactionTag,
  CategoryTag,
  CaptureJarOption,
} from "./transaction-types";
export {
  refundTransactionInputSchema,
  type RefundTransactionInput,
} from "./commands/refund-transaction.schema";
export {
  correctTransactionInputSchema,
  type CorrectTransactionInput,
} from "./commands/correct-transaction.schema";
export { transactionMatchesTagFilter } from "./transaction-types";
export {
  TransactionActivityKind,
  TransactionActivityTone,
  TransactionProductEvent,
  transactionActivityMatchesFilter,
} from "./transaction-activity";
export type { TransactionActivity } from "./transaction-activity";
export {
  FinancialEventCategory,
  FinancialClassification,
  FinancialCashDirection,
  FinancialDisplayDirection,
  FinancialHomeNetContribution,
  TransactionOwner,
  classifyFinancialEvent,
  getTransactionActionCapabilities,
  type FinancialEventSemantics,
  type FinancialSemanticRow,
} from "./financial-semantics";
export {
  DEFAULT_CURRENCY,
  TransactionDirection,
  TRANSACTION_DIRECTION_OPTIONS,
  TRANSACTION_DIRECTION_VALUES,
  TransactionLedgerType,
  TRANSACTION_LEDGER_TYPE_VALUES,
  TRANSACTION_LEDGER_AMOUNT_PREFIX,
  TRANSACTION_LEDGER_CREDIT_TYPES,
  TRANSACTION_LEDGER_DEBIT_TYPES,
  TransactionStatus,
  TRANSACTION_STATUS_VALUES,
  TransactionReadStatus,
  TRANSACTION_REFUNDABLE_STATUS_VALUES,
  TRANSACTION_CORRECTABLE_STATUS_VALUES,
  TRANSACTION_BALANCE_STATUS_VALUES,
  TransactionFilterType,
  TRANSACTION_FILTER_OPTIONS,
  TRANSACTION_COMMON_FILTER_OPTIONS,
  TRANSACTION_TAG_FILTER_QUERY_PARAM,
  TRANSACTION_TYPE_QUERY_PARAM,
  TransactionTagIconKey,
  TRANSACTION_TAG_ICON_KEYS,
  TransactionTagColorKey,
  TRANSACTION_TAG_COLOR_KEYS,
  DEFAULT_TRANSACTION_TAG_COLOR_KEY,
  DEFAULT_TRANSACTION_TAG_ICON_KEY,
  MAX_TRANSACTION_TAGS,
  AccountType,
  ACCOUNT_TYPE_VALUES,
  ACCOUNT_TYPE_LIQUID_VALUES,
  ACCOUNT_TYPE_CAPTURE_VALUES,
  isCaptureAccountType,
  ACCOUNT_TYPE_CREATE_OPTIONS,
  CardBillingMonthStatus,
  CARD_BILLING_MONTH_STATUS_VALUES,
  CardBillingItemType,
  CARD_BILLING_ITEM_TYPE_VALUES,
  DEFAULT_CARD_STATEMENT_DAY,
  DEFAULT_CARD_DUE_DAY,
  DEFAULT_CARD_INSTALLMENT_COUNT,
  CALENDAR_DAY_VALUES,
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
  LOAN_PAYMENT_EXECUTABLE_MODE_VALUES,
  ISO_DATE_PATTERN,
  LedgerRpcName,
  LedgerRelation,
  MoneyCaptureMode,
  MONEY_CAPTURE_MODE_OPTIONS,
} from "./ledger-constants";
export {
  MoneyPaymentFlowStep,
  createCardPaymentIdempotencyKey,
  CARD_PAYMENT_IDEMPOTENCY_KEY_PREFIX,
  createTransferIdempotencyKey,
  TRANSFER_IDEMPOTENCY_KEY_PREFIX,
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
  MoneyPaymentFlowStep as MoneyPaymentFlowStepValue,
  MoneyCaptureMode as MoneyCaptureModeValue,
  TransactionTagIconKey as TransactionTagIconKeyValue,
  TransactionTagColorKey as TransactionTagColorKeyValue,
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
  CreditCardInstallment,
  CreditCardInstallmentViewModel,
} from "./credit-card-installments";
export {
  allocateCreditCardInstallments,
  buildCreditCardInstallmentPreview,
  buildCreditCardInstallmentViewModel,
} from "./credit-card-installments";
export { percentageToBasisPoints } from "@/shared/utils/percentage";
export type {
  Loan,
  LoanPayment,
  LoanScheduleEntry,
  LoanInterestRatePeriod,
} from "./money-product-types";
export {
  recordTransferInputSchema,
  type RecordTransferInput,
} from "./commands/record-transfer.schema";
export {
  createLoanInputSchema,
  type CreateLoanInput,
} from "./commands/money-products.schema";
export {
  buildAmortizationSchedule,
  simulateLoanPreview,
  normalizeTermToMonths,
  computeEarlyPayoffAmount,
  estimateEarlyPayoffComponents,
  buildRateSegmentsFromStrategy,
  addMonthsYmd,
} from "./loan-amortization";
