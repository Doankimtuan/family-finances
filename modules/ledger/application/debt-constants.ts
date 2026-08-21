/** Informal household debt values and idempotency helpers. */

import {
  isLiquidAccountType,
  type LiquidAccountType,
} from "./account-constants";

/** Debt movement accounts reuse the canonical liquid-account contract. */
export function isDebtMovementAccountType(
  type: string,
): type is LiquidAccountType {
  return isLiquidAccountType(type);
}

/** Informal personal-debt relationship from the household's perspective. */
export const DebtDirection = {
  BORROWED: "borrowed",
  LENT: "lent",
} as const;
export type DebtDirection = (typeof DebtDirection)[keyof typeof DebtDirection];
export const DEBT_DIRECTION_VALUES = [
  DebtDirection.BORROWED,
  DebtDirection.LENT,
] as const;

/** Whether ViNha records a historical balance or a movement happening now. */
export const DebtCreationMode = {
  EXISTING_BALANCE: "existing_balance",
  MONEY_MOVED: "money_moved",
} as const;
export type DebtCreationMode =
  (typeof DebtCreationMode)[keyof typeof DebtCreationMode];
export const DEBT_CREATION_MODE_VALUES = [
  DebtCreationMode.EXISTING_BALANCE,
  DebtCreationMode.MONEY_MOVED,
] as const;

/** Persisted debt lifecycle. Due state remains derived from this and due date. */
export const DebtStatus = {
  ACTIVE: "active",
  COMPLETED: "completed",
  ARCHIVED: "archived",
} as const;

export const DebtReadStatus = {
  OK: "ok",
  NOT_FOUND: "not_found",
  ERROR: "error",
} as const;

export type DebtReadStatus =
  (typeof DebtReadStatus)[keyof typeof DebtReadStatus];
export type DebtStatus = (typeof DebtStatus)[keyof typeof DebtStatus];

/** Direction of a principal settlement record. */
export const DebtPaymentDirection = {
  REPAY_BORROWED: "repay_borrowed",
  RECEIVE_LENT: "receive_lent",
} as const;
export type DebtPaymentDirection =
  (typeof DebtPaymentDirection)[keyof typeof DebtPaymentDirection];

/** Derived debt timing state; it is intentionally not persisted. */
export const DebtDueState = {
  NONE: "none",
  UPCOMING: "upcoming",
  DUE_SOON: "due_soon",
  DUE_TODAY: "due_today",
  OVERDUE: "overdue",
  COMPLETED: "completed",
} as const;
export type DebtDueState = (typeof DebtDueState)[keyof typeof DebtDueState];
export const DEBT_DUE_SOON_DAYS = 7;
export const DebtProgressState = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;
export type DebtProgressState =
  (typeof DebtProgressState)[keyof typeof DebtProgressState];
export const DEBT_NO_DUE_SORT_DATE = "9999-12-31";
export const DEBT_CREATE_IDEMPOTENCY_KEY_PREFIX = "debt-create:";
export const DEBT_PAYMENT_IDEMPOTENCY_KEY_PREFIX = "debt-payment:";
export const DEBT_HALF_PAYMENT_PERCENT = 50;

/** Compatibility markers for legacy debt/liability RPC errors. */
export const DEBT_LEGACY_RPC_ERROR_MARKERS = [
  "authentication required",
  "not a household member",
  "invalid debt",
  "debt name is required",
  "counterparty is required",
  "principal must",
  "due date must",
  "account is required",
  "account not found",
  "debt not found",
  "debt cannot receive",
  "amount exceeds",
  "payment must",
] as const;

export const LIABILITY_LEGACY_RPC_ERROR_MARKERS = [
  "authentication required",
  "not a household member",
  "invalid payment amount",
  "liability not found",
  "liability archived",
] as const;

export function createDebtIdempotencyKey(prefix: string): string {
  return `${prefix}${crypto.randomUUID()}`;
}
