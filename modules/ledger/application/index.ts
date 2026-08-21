import "server-only";

export {
  classifyCorrectionRpcError,
  classifyCardRpcError,
  classifyDebtRpcError,
  classifyLegacyRecordTransactionRpcError,
  classifyLegacyRecordTransferRpcError,
  classifyInstallmentRpcError,
  classifyLiabilityRpcError,
  classifyLoanRpcError,
  classifyRecordTransactionRpcError,
  classifyRecordTransferRpcError,
  classifyRefundRpcError,
  classifyStructuredLedgerRpcError,
  classifyStructuredProductRpcError,
  classifyTransactionTagRpcError,
  logLedgerFailure,
  LEDGER_OPERATION,
  type LedgerCommandErrorCode,
  type LedgerFailureContext,
  type LedgerOperation,
} from "./ledger-error";

export { getRealPosition } from "./queries/get-real-position";
export {
  createMoneyHubViewModel,
  isMoneyHubAssetAccount,
  MoneyAccountGroupKey,
  MoneyCreditAttention,
  MONEY_HUB_DUE_SOON_DAYS,
  MONEY_HUB_INITIAL_ACCOUNT_ROW_LIMIT,
  type MoneyHubAccount,
  type MoneyHubAccountGroup,
  type MoneyHubCompositionSegment,
  type MoneyHubCreditCard,
  type MoneyHubViewModel,
} from "./money-hub-view-model";
export {
  listAccounts,
  listAccountsForCapture,
  getAccount,
} from "./queries/list-accounts";
export {
  listCreditCards,
  getCreditCardDetail,
} from "./queries/list-credit-cards";
export {
  listCreditCardInstallments,
  listEligibleCreditCardPurchases,
  type EligibleCreditCardPurchase,
} from "./queries/list-credit-card-installments";
export {
  listRecentTransactions,
  listTransactionsForDateRange,
  listCategoryTags,
  listCaptureJars,
} from "./queries/list-transactions";
export {
  getTransaction,
  getTransactionReadResult,
  getTransactionActivity,
  listTransactionEvents,
  listTransactions,
  type ListTransactionsFilter,
  type ListTransactionEventsFilter,
  type ListTransactionEventsResult,
  type TransactionReadResult,
} from "./queries/get-transaction";
export {
  archiveTransactionTag,
  createTransactionTag,
  updateTransactionTag,
  listTransactionTags,
  setTransactionTags,
  transactionTagInputSchema,
  type TransactionTagActionErrorCode,
  type TransactionTagActionResult,
  type TransactionTagInput,
} from "./transaction-tags";
export {
  getTransactionAuditChain,
  type TransactionAuditChain,
} from "./queries/get-transaction-audit-chain";
export {
  createAccount,
  createAccountInputSchema,
  type CreateAccountInput,
  type CreateAccountResult,
} from "./commands/create-account";
export {
  archiveAccount,
  archiveAccountInputSchema,
  type ArchiveAccountInput,
  type ArchiveAccountResult,
} from "./commands/archive-account";
export {
  updateAccount,
  updateAccountInputSchema,
  type UpdateAccountInput,
  type UpdateAccountResult,
} from "./commands/update-account";
export {
  AccountHealthSignal,
  ACCOUNT_HEALTH_SIGNAL_VALUES,
  accountHealthFromBalance,
} from "./account-health";
export {
  recordTransaction,
  type RecordTransactionResult,
  type RecordTransactionErrorCode,
} from "./commands/record-transaction";
export {
  recordTransactionInputSchema,
  type RecordTransactionInput,
} from "./commands/record-transaction.schema";
export { TRANSACTION_NOTE_MAX_LENGTH } from "./commands/record-transaction.schema";
export {
  recordTransfer,
  recordTransferInputSchema,
  type RecordTransferInput,
  type RecordTransferResult,
} from "./commands/record-transfer";
export {
  createCategory,
  createCategoryInputSchema,
  type CreateCategoryInput,
  type CreateCategoryResult,
  type CreateCategoryErrorCode,
} from "./commands/create-category";
export {
  refundTransaction,
  type RefundTransactionInput,
  type RefundTransactionResult,
  type RefundTransactionErrorCode,
} from "./commands/refund-transaction";
export { refundTransactionInputSchema } from "./commands/refund-transaction.schema";
export {
  correctTransaction,
  correctTransactionInputSchema,
  type CorrectTransactionInput,
  type CorrectTransactionResult,
  type CorrectTransactionErrorCode,
} from "./commands/correct-transaction";
export {
  resolveRefundedStatus,
  jarCapacityRestoredByRefund,
  isRefundableStatus,
} from "./refund-policy";
export {
  countsTowardMonthlyIncome,
  countsTowardMonthlyExpense,
  sumMonthlyIncome,
  sumMonthlyExpense,
  jarCapacityDelta,
  sumJarCapacity,
} from "./income-exclusion-policy";
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
  buildCorrectionChain,
  correctionChainNetImpact,
  oppositeDirection,
  signedAmount,
} from "./correction-policy";
export { isCategoryJarMapped, requiresJarMapping } from "./category-jar-policy";
export {
  settleCard,
  settleCardInputSchema,
  type SettleCardInput,
  type SettleCardResult,
} from "./commands/settle-card";
export {
  addCardCashback,
  addCardCashbackInputSchema,
  type AddCardCashbackInput,
  type AddCardCashbackResult,
} from "./commands/add-card-cashback";
export {
  registerCreditCardInstallment,
  registerCreditCardInstallmentInputSchema,
  type RegisterCreditCardInstallmentInput,
  type RegisterCreditCardInstallmentResult,
} from "./commands/register-credit-card-installment";
export {
  stopCreditCardInstallmentTracking,
  stopCreditCardInstallmentTrackingInputSchema,
  type StopCreditCardInstallmentTrackingInput,
  type StopCreditCardInstallmentTrackingResult,
} from "./commands/stop-credit-card-installment-tracking";

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
  isStructurallyEligibleCardPurchase,
  mapCreditCardInstallmentRow,
} from "./credit-card-installments";
export { percentageToBasisPoints } from "@/shared/utils/percentage";
export { buildCreditCardSummary, isCreditCardType } from "./credit-card-types";
export {
  resolveBillingMonthKey,
  resolveBillingDueDate,
  computeOutstanding,
  computeAvailableCredit,
  wouldExceedCreditLimit,
  applyFifoSettlement,
  applyBillingItemConversion,
  canConvertBillingItemOnMonth,
  utilizationPercent,
} from "./credit-card-billing";
export {
  updateTransaction,
  updateTransactionInputSchema,
  deleteTransaction,
  deleteTransactionInputSchema,
  type UpdateTransactionInput,
  type UpdateTransactionResult,
  type DeleteTransactionInput,
  type DeleteTransactionResult,
} from "./commands/update-transaction";
export type { LedgerAccount, RealPosition } from "./account-types";
export type {
  LedgerTransaction,
  TransactionTag,
  CategoryTag,
  CaptureJarOption,
} from "./transaction-types";
export {
  applyTransactionDeltas,
  mapTransactionRow,
  transactionMatchesTagFilter,
} from "./transaction-types";
export {
  createTransactionActivities,
  transactionActivityMatchesFilter,
  transactionActivityCanUseGenericActions,
  TransactionActivityKind,
  TransactionActivityTone,
  TransactionProductEvent,
  type TransactionActivity,
} from "./transaction-activity";
export {
  listLiabilities,
  getLiability,
  listSavingsProducts,
  getSavingsProduct,
  listLoans,
  getLoan,
  getLoanReadResult,
  listLoanPayments,
  listLoanPaymentsReadResult,
  listLoanSchedule,
  listLoanScheduleReadResult,
  listUpcomingLoanScheduleEntries,
  listLoanInterestRatePeriods,
  listLoanInterestRatePeriodsReadResult,
  listInstallmentPlans,
  getInstallmentPlan,
} from "./queries/list-money-products";
export {
  createLiability,
  createLiabilityInputSchema,
  recordLiabilityPayment,
  recordLiabilityPaymentInputSchema,
  createSavingsProduct,
  createSavingsInputSchema,
  createLoan,
  recordLoanPayment,
  recordLoanPaymentInputSchema,
  updateLoanMetadata,
  updateLoanMetadataInputSchema,
  updateLoanInterestRate,
  updateLoanInterestRateInputSchema,
  setLoanStatus,
  setLoanStatusInputSchema,
  type CreateLiabilityInput,
  type RecordLiabilityPaymentInput,
  type CreateSavingsInput,
  type RecordLoanPaymentInput,
  type UpdateLoanMetadataInput,
  type UpdateLoanInterestRateInput,
  type SetLoanStatusInput,
  type MoneyProductMutationResult,
} from "./commands/money-products";
export {
  createLoanInputSchema,
  type CreateLoanInput,
} from "./commands/money-products.schema";
export type {
  Liability,
  SavingsProduct,
  Loan,
  LoanPayment,
  LoanScheduleEntry,
  LoanInterestRatePeriod,
  InstallmentPlan,
} from "./money-product-types";
export {
  LiabilityStatus,
  SavingsProductStatus,
  InstallmentPlanStatus,
  mapLiabilityRow,
  mapSavingsRow,
  mapLoanRow,
  mapLoanPaymentRow,
  mapLoanScheduleEntryRow,
  mapLoanInterestRatePeriodRow,
  mapInstallmentRow,
} from "./money-product-types";
export {
  buildAmortizationSchedule,
  buildFixedMonthlySchedule,
  buildReducingBalanceSchedule,
  buildRateSegmentsFromStrategy,
  simulateLoanPreview,
  normalizeTermToMonths,
  computeEarlyPayoffAmount,
  estimateEarlyPayoffComponents,
  recomputeScheduleAfterEarlyPayoff,
  recomputeUpcomingSchedule,
  addMonthsYmd,
} from "./loan-amortization";
export type {
  AmortizationEntry,
  AmortizationSchedule,
  BuildScheduleInput,
  InterestRateSegment,
  LoanPreviewInput,
  LoanPreviewResult,
} from "./loan-amortization";
export {
  DEFAULT_CURRENCY,
  TransactionDirection,
  TRANSACTION_AMOUNT_PREFIX,
  TRANSACTION_LEDGER_AMOUNT_PREFIX,
  TRANSACTION_LEDGER_CREDIT_TYPES,
  TRANSACTION_LEDGER_DEBIT_TYPES,
  TRANSACTION_DIRECTION_OPTIONS,
  TRANSACTION_DIRECTION_VALUES,
  TransactionLedgerType,
  TRANSACTION_LEDGER_TYPE_VALUES,
  TransactionStatus,
  TransactionReadStatus,
  TRANSACTION_STATUS_VALUES,
  TRANSACTION_REFUNDABLE_STATUS_VALUES,
  TRANSACTION_CORRECTABLE_STATUS_VALUES,
  TRANSACTION_BALANCE_STATUS_VALUES,
  TransactionFilterType,
  TRANSACTION_FILTER_OPTIONS,
  TRANSACTION_COMMON_FILTER_OPTIONS,
  TRANSACTION_TAG_FILTER_QUERY_PARAM,
  TRANSACTION_TYPE_QUERY_PARAM,
  TRANSACTION_CURSOR_QUERY_PARAM,
  TRANSACTION_LIST_PAGE_SIZE,
  AccountType,
  ACCOUNT_TYPE_VALUES,
  ACCOUNT_TYPE_LIQUID_VALUES,
  ACCOUNT_TYPE_CAPTURE_VALUES,
  isDebtMovementAccountType,
  isLiquidAccountType,
  isCaptureAccountType,
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
  MoneyPaymentFlowStep,
  createCardPaymentIdempotencyKey,
  CARD_PAYMENT_IDEMPOTENCY_KEY_PREFIX,
  CARD_PAYMENT_IDEMPOTENCY_KEY_MIN_LEN,
  CARD_PAYMENT_IDEMPOTENCY_KEY_MAX_LEN,
  createTransferIdempotencyKey,
  TRANSFER_IDEMPOTENCY_KEY_PREFIX,
  TRANSFER_IDEMPOTENCY_KEY_MIN_LEN,
  TRANSFER_IDEMPOTENCY_KEY_MAX_LEN,
  MoneyCaptureMode,
  MONEY_CAPTURE_MODE_OPTIONS,
  ISO_DATE_PATTERN,
  LedgerRpcName,
  LedgerRelation,
  SETTLE_CARD_INVALID_ERROR_NEEDLES,
  RECORD_LOAN_PAYMENT_INVALID_ERROR_NEEDLES,
  RECORD_TRANSFER_INVALID_ERROR_NEEDLES,
  LEDGER_ACTION_ERROR_CODE,
  type LedgerActionErrorCode,
} from "./ledger-constants";

export {
  listDebts,
  getDebt,
  getDebtReadResult,
  listDebtPayments,
  listDebtPaymentsReadResult,
  type DebtReadResult,
  type DebtPaymentsReadResult,
} from "./queries/debt-queries";
export {
  createDebt,
  createDebtInputSchema,
  recordDebtPayment,
  recordDebtPaymentInputSchema,
  updateDebt,
  updateDebtInputSchema,
  type CreateDebtInput,
  type DebtMutationResult,
  type RecordDebtPaymentInput,
  type UpdateDebtInput,
} from "./commands/debt-commands";
export {
  createDebtFormSchema,
  recordDebtPaymentFormSchema,
  updateDebtFormSchema,
  type CreateDebtFormValues,
  type RecordDebtPaymentFormValues,
  type UpdateDebtFormValues,
} from "./commands/debt.schemas";
export type {
  Debt,
  DebtPayment,
  DebtProgress,
  DebtDue,
  DebtSummary,
  DebtViewModel,
  DebtPaymentReview,
  DebtPaymentReconciliation,
} from "./debt-domain";
export {
  buildDebtSummary,
  buildDebtPaymentReview,
  buildDebtViewModels,
  getDebtDueState,
  getDebtDueInfo,
  getDebtProgress,
  getDebtPaymentReconciliation,
  mapDebtPaymentRow,
  mapDebtRow,
} from "./debt-domain";
export {
  DebtCreationMode,
  DebtDirection,
  DebtDueState,
  DebtPaymentDirection,
  DebtReadStatus,
  DebtStatus,
  DebtProgressState,
  DEBT_NO_DUE_SORT_DATE,
  DEBT_CREATE_IDEMPOTENCY_KEY_PREFIX,
  DEBT_PAYMENT_IDEMPOTENCY_KEY_PREFIX,
  DEBT_HALF_PAYMENT_PERCENT,
  createDebtIdempotencyKey,
} from "./ledger-constants";
