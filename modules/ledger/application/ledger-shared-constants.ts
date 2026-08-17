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
  SETTLE_CARD_PAYMENT: "settle_card_payment",
  RECORD_LOAN_PAYMENT: "record_loan_payment",
  UPDATE_LOAN_INTEREST_RATE: "update_loan_interest_rate",
  RECORD_LIABILITY_PAYMENT: "record_liability_payment",
  CREATE_DEBT: "create_debt",
  RECORD_DEBT_PAYMENT: "record_debt_payment",
  CREATE_LOAN_WITH_SCHEDULE: "create_loan_with_schedule",
  SET_LOAN_STATUS: "set_loan_status",
  ENQUEUE_SAVINGS_MATURITY: "enqueue_savings_maturity",
  RECORD_OWNED_ACCOUNT_TRANSFER: "record_owned_account_transfer",
} as const;

export type LedgerRpcName = (typeof LedgerRpcName)[keyof typeof LedgerRpcName];

/** Public relation names for ledger queries / mutations. */
export const LedgerRelation = {
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
  REFUND_INVALID: "refund_invalid",
  CORRECTION_INVALID: "correction_invalid",
  IMMUTABLE: "immutable",
  CONVERT_AFTER_PAYMENT: "convert_after_payment",
} as const;

export type LedgerActionErrorCode =
  (typeof LEDGER_ACTION_ERROR_CODE)[keyof typeof LEDGER_ACTION_ERROR_CODE];
