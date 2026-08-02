/**
 * Cross-domain action error codes shared by auth, tenancy, and household flows.
 * Domain modules extend this set; do not put domain-only codes here.
 */

export const COMMON_ACTION_ERROR_CODE = {
  UNCONFIGURED: "unconfigured",
  UNAUTHENTICATED: "unauthenticated",
  INVALID: "invalid",
  UNKNOWN: "unknown",
} as const;

export type CommonActionErrorCode =
  (typeof COMMON_ACTION_ERROR_CODE)[keyof typeof COMMON_ACTION_ERROR_CODE];
