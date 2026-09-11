/** Ledger-shared constants; application-wide currency lives in shared-kernel. */

export { DEFAULT_CURRENCY } from "@/modules/shared-kernel/currency";

/**
 * Preview → confirm → receipt flow for liability payments (card settle, loan pay).
 */
export const MoneyPaymentFlowStep = {
  FORM: "form",
  CONFIRM: "confirm",
  RECEIPT: "receipt",
} as const;

export type MoneyPaymentFlowStep =
  (typeof MoneyPaymentFlowStep)[keyof typeof MoneyPaymentFlowStep];

/** YYYY-MM-DD calendar date (Zod + HTML date inputs). */
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Supabase RPC names used by ledger money-product commands. */
export const LedgerRpcName = {
  CORRECT_TRANSACTION: "correct_transaction",
  RECORD_TRANSACTION: "record_transaction",
  RECORD_CARD_TRANSACTION: "record_card_transaction",
  SETTLE_CARD_PAYMENT: "settle_card_payment",
  RECORD_LOAN_PAYMENT: "record_loan_payment",
  UPDATE_LOAN_INTEREST_RATE: "update_loan_interest_rate",
  RECORD_LIABILITY_PAYMENT: "record_liability_payment",
  REFUND_TRANSACTION: "refund_transaction",
  CREATE_DEBT: "create_debt",
  RECORD_DEBT_PAYMENT: "record_debt_payment",
  CREATE_LOAN_WITH_SCHEDULE: "create_loan_with_schedule",
  SET_LOAN_STATUS: "set_loan_status",
  ENQUEUE_SAVINGS_MATURITY: "enqueue_savings_maturity",
  RECORD_OWNED_ACCOUNT_TRANSFER: "record_owned_account_transfer",
  GET_ACCOUNT_LEDGER_BALANCES: "get_account_ledger_balances",
  GET_HOME_ACCOUNT_LEDGER_RAW_INPUTS: "get_home_account_ledger_raw_inputs",
} as const;

export type LedgerRpcName = (typeof LedgerRpcName)[keyof typeof LedgerRpcName];

/** Public relation names for ledger queries / mutations. */
export const LedgerRelation = {
  ACCOUNTS: "accounts",
  LIABILITIES: "liabilities",
  SAVINGS_ACCOUNTS: "savings_accounts",
  LOANS: "loans",
  DEBT_PAYMENTS: "debt_payments",
  LOAN_SCHEDULE_ENTRIES: "loan_schedule_entries",
  LOAN_PAYMENTS: "loan_payments",
  LOAN_INTEREST_RATE_PERIODS: "loan_interest_rate_periods",
} as const;

export type LedgerRelation =
  (typeof LedgerRelation)[keyof typeof LedgerRelation];

/** Ledger-only mutation errors (not shared across plan/inbox forms). */
export const LEDGER_ACTION_ERROR_CODE = {
  CREDIT_LIMIT_EXCEEDED: "credit_limit_exceeded",
  CATEGORY_UNMAPPED: "category_unmapped",
  FORBIDDEN: "forbidden",
  REFUND_INVALID: "refund_invalid",
  CORRECTION_INVALID: "correction_invalid",
  IMMUTABLE: "immutable",
  CONVERT_AFTER_PAYMENT: "convert_after_payment",
} as const;

export type LedgerActionErrorCode =
  (typeof LEDGER_ACTION_ERROR_CODE)[keyof typeof LEDGER_ACTION_ERROR_CODE];

export const LEDGER_OPERATION = {
  ASSIGN_CARD_BILLING: "assignCardBilling",
  ARCHIVE_ACCOUNT: "archiveAccount",
  ARCHIVE_TRANSACTION_TAG: "archiveTransactionTag",
  CORRECT_TRANSACTION: "correctTransaction",
  CREATE_ACCOUNT: "createAccount",
  CREATE_DEBT: "createDebt",
  CREATE_LIABILITY: "createLiability",
  CREATE_LOAN: "createLoan",
  CREATE_TRANSACTION_TAG: "createTransactionTag",
  GET_ACCOUNT: "getAccount",
  GET_CREDIT_CARD: "getCreditCard",
  GET_DEBT: "getDebt",
  GET_LIABILITY: "getLiability",
  GET_LOAN: "getLoan",
  GET_ACCOUNT_LEDGER_BALANCES: "getAccountLedgerBalances",
  GET_HOME_ACCOUNT_LEDGER_RAW_INPUTS: "getHomeAccountLedgerRawInputs",
  GET_REAL_POSITION: "getRealPosition",
  GET_TRANSACTION: "getTransaction",
  GET_TRANSACTION_AUDIT_CHAIN: "getTransactionAuditChain",
  CREATE_CATEGORY: "createCategory",
  LIST_ACCOUNTS: "listAccounts",
  LIST_CAPTURE_JARS: "listCaptureJars",
  LIST_CATEGORY_TAGS: "listCategoryTags",
  LIST_CREDIT_CARD_INSTALLMENTS: "listCreditCardInstallments",
  LIST_CREDIT_CARDS: "listCreditCards",
  LIST_DEBTS: "listDebts",
  LIST_DEBT_PAYMENTS: "listDebtPayments",
  LIST_ELIGIBLE_CREDIT_CARD_PURCHASES: "listEligibleCreditCardPurchases",
  LIST_LIABILITIES: "listLiabilities",
  LIST_SAVINGS_PRODUCTS: "listSavingsProducts",
  GET_SAVINGS_PRODUCT: "getSavingsProduct",
  LIST_LOAN_INTEREST_RATE_PERIODS: "listLoanInterestRatePeriods",
  LIST_LOAN_PAYMENTS: "listLoanPayments",
  LIST_LOAN_SCHEDULE: "listLoanSchedule",
  LIST_LOANS: "listLoans",
  LIST_RECENT_TRANSACTIONS: "listRecentTransactions",
  LIST_TRANSACTION_TAGS: "listTransactionTags",
  LIST_TRANSACTIONS: "listTransactions",
  LIST_UPCOMING_LOAN_SCHEDULE: "listUpcomingLoanSchedule",
  RECORD_DEBT_PAYMENT: "recordDebtPayment",
  RECORD_LIABILITY_PAYMENT: "recordLiabilityPayment",
  RECORD_LOAN_PAYMENT: "recordLoanPayment",
  RECORD_TRANSACTION: "recordTransaction",
  RECORD_TRANSFER: "recordTransfer",
  REGISTER_CREDIT_CARD_INSTALLMENT: "registerCreditCardInstallment",
  REFUND_TRANSACTION: "refundTransaction",
  SET_LOAN_STATUS: "setLoanStatus",
  SET_TRANSACTION_TAGS: "setTransactionTags",
  SETTLE_CARD: "settleCard",
  STOP_CREDIT_CARD_INSTALLMENT: "stopCreditCardInstallment",
  UPDATE_TRANSACTION_TAG: "updateTransactionTag",
  UPDATE_ACCOUNT: "updateAccount",
  UPDATE_DEBT_METADATA: "updateDebtMetadata",
  UPDATE_LOAN_INTEREST_RATE: "updateLoanInterestRate",
  UPDATE_LOAN_METADATA: "updateLoanMetadata",
} as const;

export type LedgerOperation =
  (typeof LEDGER_OPERATION)[keyof typeof LEDGER_OPERATION];

/** Compatibility markers for legacy RPCs that still raise plain text errors. */
export const LEDGER_LEGACY_RPC_ERROR_MARKERS = {
  AUTHENTICATION: ["authentication required"],
  PERMISSION_DENIED: ["not_allowed", "forbidden"],
  NO_MEMBERSHIP: [
    "active household membership required",
    "not a household member",
  ],
  TRANSACTION_INVALID: [
    "invalid transaction type",
    "positive whole number",
    "account not found",
    "invalid category tag",
    "invalid jar",
  ],
  REFUND_INVALID: [
    "transaction not found",
    "forbidden",
    "only expenses can be refunded",
    "transaction is not refundable",
    "refund exceeds original amount",
    "account not found",
  ],
  CORRECTION_INVALID: [
    "transaction not found",
    "forbidden",
    "transaction is not correctable",
    "cannot correct a refund or correction leg",
    "invalid category tag",
    "invalid jar",
    "account not found",
  ],
  TRANSACTION_TAG_INVALID: ["invalid", "not found"],
  CATEGORY_UNMAPPED: ["err_category_unmapped"],
} as const;
