/**
 * Tenancy / Together route and invitation domain constants.
 */

import { AUTH_CONFIRM_QUERY } from "./auth-constants";
import { APP_PATH } from "./app-path";
import { COMMON_ACTION_ERROR_CODE } from "./common-action-error";
import { PRODUCT_ACTION_ERROR_CODE } from "./product-action-error";

export { APP_PATH, invitePath } from "./app-path";
export { COMMON_ACTION_ERROR_CODE } from "./common-action-error";
export type { CommonActionErrorCode } from "./common-action-error";
export {
  PRODUCT_ACTION_ERROR_CODE,
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_FORM_ERROR_CODE,
  productActionErrorFromDeniedReason,
} from "./product-action-error";
export type {
  ProductActionErrorCode,
  ClientActionErrorCode,
  ProductFormErrorCode,
} from "./product-action-error";

export const TOGETHER_PATH = {
  ROOT: APP_PATH.TOGETHER,
  MEMBERS: APP_PATH.TOGETHER_MEMBERS,
  ONBOARD: APP_PATH.ONBOARD,
  INVITATIONS: APP_PATH.INVITATIONS,
  INVITATIONS_NEW: APP_PATH.INVITATIONS_NEW,
  POLICIES: APP_PATH.POLICIES,
  PREFERENCES: APP_PATH.PREFERENCES,
  SETTINGS: APP_PATH.SETTINGS,
  SETTINGS_ACCOUNT: APP_PATH.SETTINGS_ACCOUNT,
} as const;

export const INVITATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REVOKED: "revoked",
  EXPIRED: "expired",
  DECLINED: "declined",
} as const;

export type InvitationStatus =
  (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

export const HOUSEHOLD_ROLE = {
  ADMIN: "admin",
  PARTNER: "partner",
} as const;

export const HOUSEHOLD_ROLE_VALUES = [
  HOUSEHOLD_ROLE.ADMIN,
  HOUSEHOLD_ROLE.PARTNER,
] as const;

export const HOUSEHOLD_LOCALE = {
  ENGLISH_VIETNAM: "en-VN",
  VIETNAMESE_VIETNAM: "vi-VN",
} as const;

export const HOUSEHOLD_LOCALE_VALUES = [
  HOUSEHOLD_LOCALE.ENGLISH_VIETNAM,
  HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM,
] as const;

export const HOUSEHOLD_TIMEZONE = {
  VIETNAM: "Asia/Ho_Chi_Minh",
} as const;

export const HOUSEHOLD_BASE_CURRENCY = {
  VIETNAM_DONG: "VND",
} as const;

export const HOUSEHOLD_MEMBER_LIMIT = 2;

export const INVITATION_TTL_DAYS = 7;

export const INVITATION_ERROR_CODE = {
  ...COMMON_ACTION_ERROR_CODE,
  ALREADY_MEMBER: "already_member",
  ALREADY_PENDING: "already_pending",
  HOUSEHOLD_FULL: "household_full",
  NO_HOUSEHOLD: "no_household",
  NOT_FOUND: "not_found",
  NOT_PENDING: "not_pending",
  EXPIRED: "expired",
  EMAIL_MISMATCH: "email_mismatch",
} as const;

export type InvitationErrorCode =
  (typeof INVITATION_ERROR_CODE)[keyof typeof INVITATION_ERROR_CODE];

/** Household create + policy update result codes. */
export const HOUSEHOLD_ERROR_CODE = {
  ...COMMON_ACTION_ERROR_CODE,
  ALREADY_MEMBER: "already_member",
  NO_HOUSEHOLD: "no_household",
  FORBIDDEN: "forbidden",
  MEMBER_NOT_FOUND: "member_not_found",
} as const;

export type HouseholdErrorCode =
  (typeof HOUSEHOLD_ERROR_CODE)[keyof typeof HOUSEHOLD_ERROR_CODE];

export const MONEY_ACTION_DENIED_REASON = {
  UNAUTHENTICATED: PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED,
  NO_MEMBERSHIP: PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP,
} as const;

export type MoneyActionDeniedReason =
  (typeof MONEY_ACTION_DENIED_REASON)[keyof typeof MONEY_ACTION_DENIED_REASON];

export const INVITATION_RPC_MESSAGE_NEEDLE = {
  INVALID_EMAIL: "invalid email",
  ALREADY_MEMBER: "already a member",
  ALREADY_PENDING: "already pending",
  TWO_PARTNERS: "two partners",
  HOUSEHOLD_FULL: "household full",
  NO_ACTIVE_HOUSEHOLD: "no active household",
  AUTHENTICATION: "authentication",
  NOT_FOUND: "not found",
  NOT_PENDING: "not pending",
  EXPIRED: "expired",
  EMAIL_MISMATCH: "email mismatch",
  ALREADY_BELONGS: "already belongs",
} as const;

/** Locale-agnostic login href that preserves post-auth return path. */
export function loginHrefWithNext(nextPath: string): string {
  const qs = new URLSearchParams({
    [AUTH_CONFIRM_QUERY.NEXT]: nextPath,
  });
  return `${APP_PATH.LOGIN}?${qs.toString()}`;
}
