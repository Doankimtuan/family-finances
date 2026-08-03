/**
 * Shared error codes for household-scoped product mutations
 * (ledger, plan, inbox) and their client-side form extensions.
 *
 * Domain modules extend with domain-only codes when needed;
 * do not re-declare these literals at call sites.
 */

import { COMMON_ACTION_ERROR_CODE } from "./common-action-error";

/** Server-side mutation failures shared by money / plan / inbox commands. */
export const PRODUCT_ACTION_ERROR_CODE = {
  UNAUTHENTICATED: COMMON_ACTION_ERROR_CODE.UNAUTHENTICATED,
  NO_MEMBERSHIP: "no_membership",
  INVALID: COMMON_ACTION_ERROR_CODE.INVALID,
  MONTH_LOCKED: "month_locked",
  UNKNOWN: COMMON_ACTION_ERROR_CODE.UNKNOWN,
} as const;

export type ProductActionErrorCode =
  (typeof PRODUCT_ACTION_ERROR_CODE)[keyof typeof PRODUCT_ACTION_ERROR_CODE];

/** Client-only codes set before a server round-trip (never returned by RPCs). */
export const CLIENT_ACTION_ERROR_CODE = {
  OFFLINE: "offline",
  NO_ACCOUNT: "no_account",
} as const;

export type ClientActionErrorCode =
  (typeof CLIENT_ACTION_ERROR_CODE)[keyof typeof CLIENT_ACTION_ERROR_CODE];

/** Full set used by interactive product forms (server + client codes). */
export const PRODUCT_FORM_ERROR_CODE = {
  ...PRODUCT_ACTION_ERROR_CODE,
  ...CLIENT_ACTION_ERROR_CODE,
} as const;

export type ProductFormErrorCode =
  (typeof PRODUCT_FORM_ERROR_CODE)[keyof typeof PRODUCT_FORM_ERROR_CODE];

/**
 * Membership-gate denials are a subset of product action codes —
 * map without retyping the literal.
 */
export function productActionErrorFromDeniedReason(
  reason:
    | typeof PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED
    | typeof PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP,
):
  | typeof PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED
  | typeof PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP {
  return reason;
}
