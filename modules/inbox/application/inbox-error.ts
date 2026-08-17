import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import {
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  INBOX_ERROR_CODE,
  INBOX_LEGACY_RPC_ERROR_MARKERS,
  INBOX_OPERATION,
  type InboxErrorCode,
} from "./inbox-constants";

export type InboxCommandErrorCode = ProductActionErrorCode | InboxErrorCode;

export type InboxFailureContext = Readonly<{
  householdId?: string;
  inboxItemId?: string;
  itemKind?: string;
  action?: string;
  responseInvalid?: boolean;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const STRUCTURED_INBOX_ERROR_CODES: ReadonlySet<string> = new Set([
  ...Object.values(PRODUCT_ACTION_ERROR_CODE),
  ...Object.values(INBOX_ERROR_CODE),
]);

function isInboxCommandErrorCode(
  value: string,
): value is InboxCommandErrorCode {
  return STRUCTURED_INBOX_ERROR_CODES.has(value);
}

function includesMarker(message: string, markers: readonly string[]): boolean {
  return markers.some((marker) => message.includes(marker));
}

/** Structured RPC metadata takes precedence over the legacy text fallback. */
export function classifyInboxRpcError(error: unknown): InboxCommandErrorCode {
  if (isRecord(error)) {
    for (const field of [error.code, error.details, error.hint]) {
      if (typeof field === "string" && isInboxCommandErrorCode(field)) {
        return field;
      }
    }

    if (typeof error.message === "string") {
      const message = error.message.toLowerCase();
      if (
        includesMarker(message, INBOX_LEGACY_RPC_ERROR_MARKERS.UNAUTHENTICATED)
      ) {
        return PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED;
      }
      if (
        includesMarker(message, INBOX_LEGACY_RPC_ERROR_MARKERS.NO_MEMBERSHIP)
      ) {
        return PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP;
      }
      if (
        includesMarker(
          message,
          INBOX_LEGACY_RPC_ERROR_MARKERS.PERMISSION_DENIED,
        )
      ) {
        return INBOX_ERROR_CODE.PERMISSION_DENIED;
      }
      if (
        includesMarker(message, INBOX_LEGACY_RPC_ERROR_MARKERS.ITEM_NOT_FOUND)
      ) {
        return INBOX_ERROR_CODE.ITEM_NOT_FOUND;
      }
      if (
        includesMarker(message, INBOX_LEGACY_RPC_ERROR_MARKERS.INVALID_ACTION)
      ) {
        return INBOX_ERROR_CODE.INVALID_ACTION;
      }
      if (includesMarker(message, INBOX_LEGACY_RPC_ERROR_MARKERS.INVALID_JAR)) {
        return INBOX_ERROR_CODE.INVALID_JAR;
      }
      if (
        includesMarker(
          message,
          INBOX_LEGACY_RPC_ERROR_MARKERS.AUTO_RESOLVE_NOT_ELIGIBLE,
        )
      ) {
        return INBOX_ERROR_CODE.AUTO_RESOLVE_NOT_ELIGIBLE;
      }
      if (
        includesMarker(
          message,
          INBOX_LEGACY_RPC_ERROR_MARKERS.INVALID_TRANSITION,
        )
      ) {
        return INBOX_ERROR_CODE.INVALID_TRANSITION;
      }
      if (includesMarker(message, INBOX_LEGACY_RPC_ERROR_MARKERS.STALE_ITEM)) {
        return INBOX_ERROR_CODE.STALE_ITEM;
      }
    }
  }

  return PRODUCT_ACTION_ERROR_CODE.UNKNOWN;
}

export function logInboxFailure(
  error: unknown,
  operation: (typeof INBOX_OPERATION)[keyof typeof INBOX_OPERATION],
  context: InboxFailureContext,
): void {
  logActionFailure({ operation, error, context });
}
