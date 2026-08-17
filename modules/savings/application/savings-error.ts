import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import {
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  SAVINGS_LEGACY_RPC_ERROR_MARKERS,
  type SavingsOperation,
} from "./savings-constants";

type SavingsFailureContext = Readonly<{
  householdId?: string;
  savingId?: string;
  cycleId?: string;
  providerId?: string;
  packageId?: string;
  fundingAccountId?: string;
  settlementAccountId?: string;
  responseInvalid?: boolean;
}>;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const STRUCTURED_PRODUCT_ERROR_CODES: ReadonlySet<string> = new Set(
  Object.values(PRODUCT_ACTION_ERROR_CODE),
);

function isProductActionErrorCode(
  value: string,
): value is ProductActionErrorCode {
  return STRUCTURED_PRODUCT_ERROR_CODES.has(value);
}

/** Compatibility fallback for Savings RPCs that expose only human-readable text. */
export function classifyLegacySavingsRpcError(
  error: unknown,
): ProductActionErrorCode {
  if (!isRecord(error) || typeof error.message !== "string") {
    return PRODUCT_ACTION_ERROR_CODE.UNKNOWN;
  }

  const message = error.message.toLowerCase();
  if (
    SAVINGS_LEGACY_RPC_ERROR_MARKERS.UNAUTHENTICATED.some((marker) =>
      message.includes(marker),
    )
  ) {
    return PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED;
  }
  if (
    SAVINGS_LEGACY_RPC_ERROR_MARKERS.NO_MEMBERSHIP.some((marker) =>
      message.includes(marker),
    )
  ) {
    return PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP;
  }
  if (
    SAVINGS_LEGACY_RPC_ERROR_MARKERS.INVALID.some((marker) =>
      message.includes(marker),
    )
  ) {
    return PRODUCT_ACTION_ERROR_CODE.INVALID;
  }
  return PRODUCT_ACTION_ERROR_CODE.UNKNOWN;
}

/** Structured RPC metadata takes precedence over the compatibility fallback. */
export function classifySavingsRpcError(
  error: unknown,
): ProductActionErrorCode {
  if (isRecord(error)) {
    for (const field of [error.code, error.details, error.hint]) {
      if (typeof field === "string" && isProductActionErrorCode(field)) {
        return field;
      }
    }
  }
  return classifyLegacySavingsRpcError(error);
}

export function logSavingsFailure(
  error: unknown,
  operation: SavingsOperation,
  context: SavingsFailureContext,
): void {
  logActionFailure({ operation, error, context });
}

export function savingsFailureCode(
  error: unknown,
  operation: SavingsOperation,
  context: SavingsFailureContext,
): ProductActionErrorCode {
  const code = classifySavingsRpcError(error);
  if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
    logSavingsFailure(error, operation, context);
  }
  return code;
}
