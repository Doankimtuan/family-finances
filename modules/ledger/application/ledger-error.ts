import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import {
  LEDGER_ACTION_ERROR_CODE,
  LEDGER_LEGACY_RPC_ERROR_MARKERS,
  LEDGER_OPERATION,
  RECORD_TRANSFER_INVALID_ERROR_NEEDLES,
  CARD_LEGACY_RPC_ERROR_MARKERS,
  DEBT_LEGACY_RPC_ERROR_MARKERS,
  LIABILITY_LEGACY_RPC_ERROR_MARKERS,
  LOAN_LEGACY_RPC_ERROR_MARKERS,
  type LedgerActionErrorCode,
  type LedgerOperation,
} from "./ledger-constants";
import {
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";

export type LedgerCommandErrorCode =
  ProductActionErrorCode | LedgerActionErrorCode;

export type LedgerFailureContext = Readonly<{
  householdId?: string;
  savingsId?: string;
  accountId?: string;
  sourceAccountId?: string;
  sourceTransactionId?: string;
  destinationAccountId?: string;
  cardAccountId?: string;
  debtId?: string;
  installmentId?: string;
  liabilityId?: string;
  loanId?: string;
  tagId?: string;
  transactionId?: string;
  originalTransactionId?: string;
  transferGroupId?: string;
  responseInvalid?: boolean;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorMessage(error: unknown): string | null {
  if (!isRecord(error) || typeof error.message !== "string") return null;
  return error.message.toLowerCase();
}

const STRUCTURED_LEDGER_ERROR_CODES: ReadonlySet<string> = new Set([
  ...Object.values(PRODUCT_ACTION_ERROR_CODE),
  ...Object.values(LEDGER_ACTION_ERROR_CODE),
]);

const STRUCTURED_PRODUCT_ERROR_CODES: ReadonlySet<string> = new Set(
  Object.values(PRODUCT_ACTION_ERROR_CODE),
);

function isProductActionErrorCode(
  value: string,
): value is ProductActionErrorCode {
  return STRUCTURED_PRODUCT_ERROR_CODES.has(value);
}

function isLedgerCommandErrorCode(
  value: string,
): value is LedgerCommandErrorCode {
  return STRUCTURED_LEDGER_ERROR_CODES.has(value);
}

export function classifyStructuredLedgerRpcError(
  error: unknown,
): LedgerCommandErrorCode | null {
  if (!isRecord(error)) return null;
  for (const field of [error.code, error.details, error.hint]) {
    if (typeof field === "string" && isLedgerCommandErrorCode(field)) {
      return field;
    }
  }
  return null;
}

export function classifyStructuredProductRpcError(
  error: unknown,
): ProductActionErrorCode | null {
  const structured = classifyStructuredLedgerRpcError(error);
  return structured && isProductActionErrorCode(structured) ? structured : null;
}

function includesMarker(message: string, markers: readonly string[]): boolean {
  return markers.some((marker) => message.includes(marker));
}

export function classifyLegacyRecordTransactionRpcError(
  error: unknown,
): ProductActionErrorCode | null {
  const message = errorMessage(error);
  if (!message) return null;
  if (includesMarker(message, LEDGER_LEGACY_RPC_ERROR_MARKERS.AUTHENTICATION)) {
    return PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED;
  }
  if (includesMarker(message, LEDGER_LEGACY_RPC_ERROR_MARKERS.NO_MEMBERSHIP)) {
    return PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP;
  }
  if (
    includesMarker(message, LEDGER_LEGACY_RPC_ERROR_MARKERS.TRANSACTION_INVALID)
  ) {
    return PRODUCT_ACTION_ERROR_CODE.INVALID;
  }
  return null;
}

/** Compatibility boundary for the legacy transfer RPC text errors. */
export function classifyLegacyRecordTransferRpcError(
  error: unknown,
): ProductActionErrorCode | null {
  const message = errorMessage(error);
  if (!message) return null;
  if (includesMarker(message, LEDGER_LEGACY_RPC_ERROR_MARKERS.AUTHENTICATION)) {
    return PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED;
  }
  if (includesMarker(message, LEDGER_LEGACY_RPC_ERROR_MARKERS.NO_MEMBERSHIP)) {
    return PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP;
  }
  if (includesMarker(message, RECORD_TRANSFER_INVALID_ERROR_NEEDLES)) {
    return PRODUCT_ACTION_ERROR_CODE.INVALID;
  }
  return null;
}

function classifyLegacyOperationRpcError(
  error: unknown,
  markers: readonly string[],
  code: LedgerActionErrorCode,
): LedgerActionErrorCode | ProductActionErrorCode | null {
  const message = errorMessage(error);
  if (!message) return null;
  if (includesMarker(message, LEDGER_LEGACY_RPC_ERROR_MARKERS.AUTHENTICATION)) {
    return PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED;
  }
  if (includesMarker(message, LEDGER_LEGACY_RPC_ERROR_MARKERS.NO_MEMBERSHIP)) {
    return PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP;
  }
  return includesMarker(message, markers) ? code : null;
}

function classifyLegacyProductRpcError(
  error: unknown,
  markers: readonly string[],
): ProductActionErrorCode | null {
  const message = errorMessage(error);
  if (!message) return null;
  if (includesMarker(message, LEDGER_LEGACY_RPC_ERROR_MARKERS.AUTHENTICATION)) {
    return PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED;
  }
  if (includesMarker(message, LEDGER_LEGACY_RPC_ERROR_MARKERS.NO_MEMBERSHIP)) {
    return PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP;
  }
  return includesMarker(message, markers)
    ? PRODUCT_ACTION_ERROR_CODE.INVALID
    : null;
}

/** Structured RPC codes win; text markers are legacy compatibility only. */
function classifyProductRpcError(
  error: unknown,
  markers: readonly string[],
): ProductActionErrorCode {
  return (
    classifyStructuredProductRpcError(error) ??
    classifyLegacyProductRpcError(error, markers) ??
    PRODUCT_ACTION_ERROR_CODE.UNKNOWN
  );
}

export function classifyLoanRpcError(error: unknown): ProductActionErrorCode {
  return classifyProductRpcError(error, LOAN_LEGACY_RPC_ERROR_MARKERS);
}

export function classifyCardRpcError(error: unknown): ProductActionErrorCode {
  return classifyProductRpcError(error, CARD_LEGACY_RPC_ERROR_MARKERS);
}

export function classifyInstallmentRpcError(
  error: unknown,
): ProductActionErrorCode {
  return (
    classifyStructuredProductRpcError(error) ??
    PRODUCT_ACTION_ERROR_CODE.UNKNOWN
  );
}

export function classifyDebtRpcError(error: unknown): ProductActionErrorCode {
  return classifyProductRpcError(error, DEBT_LEGACY_RPC_ERROR_MARKERS);
}

export function classifyLiabilityRpcError(
  error: unknown,
): ProductActionErrorCode {
  return classifyProductRpcError(error, LIABILITY_LEGACY_RPC_ERROR_MARKERS);
}

export function classifyRefundRpcError(
  error: unknown,
): LedgerCommandErrorCode | null {
  return (
    classifyStructuredLedgerRpcError(error) ??
    classifyLegacyOperationRpcError(
      error,
      LEDGER_LEGACY_RPC_ERROR_MARKERS.REFUND_INVALID,
      LEDGER_ACTION_ERROR_CODE.REFUND_INVALID,
    )
  );
}

export function classifyCorrectionRpcError(
  error: unknown,
): LedgerCommandErrorCode | null {
  return (
    classifyStructuredLedgerRpcError(error) ??
    classifyLegacyOperationRpcError(
      error,
      LEDGER_LEGACY_RPC_ERROR_MARKERS.CORRECTION_INVALID,
      LEDGER_ACTION_ERROR_CODE.CORRECTION_INVALID,
    )
  );
}

export function classifyRecordTransactionRpcError(
  error: unknown,
): LedgerCommandErrorCode {
  return (
    classifyStructuredLedgerRpcError(error) ??
    classifyLegacyRecordTransactionRpcError(error) ??
    PRODUCT_ACTION_ERROR_CODE.UNKNOWN
  );
}

export function classifyRecordTransferRpcError(
  error: unknown,
): ProductActionErrorCode {
  const structured = classifyStructuredLedgerRpcError(error);
  if (structured && isProductActionErrorCode(structured)) return structured;
  return (
    classifyLegacyRecordTransferRpcError(error) ??
    PRODUCT_ACTION_ERROR_CODE.UNKNOWN
  );
}

export function classifyTransactionTagRpcError(
  error: unknown,
): ProductActionErrorCode {
  const structured = classifyStructuredLedgerRpcError(error);
  if (structured && isProductActionErrorCode(structured)) return structured;
  const message = errorMessage(error);
  if (
    message &&
    includesMarker(
      message,
      LEDGER_LEGACY_RPC_ERROR_MARKERS.TRANSACTION_TAG_INVALID,
    )
  ) {
    return PRODUCT_ACTION_ERROR_CODE.INVALID;
  }
  return PRODUCT_ACTION_ERROR_CODE.UNKNOWN;
}

export function classifyCategoryRpcError(
  error: unknown,
): LedgerActionErrorCode | null {
  if (
    classifyStructuredLedgerRpcError(error) ===
    LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED
  ) {
    return LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED;
  }
  const message = errorMessage(error);
  return message &&
    includesMarker(message, LEDGER_LEGACY_RPC_ERROR_MARKERS.CATEGORY_UNMAPPED)
    ? LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED
    : null;
}

export function logLedgerFailure(
  error: unknown,
  operation: LedgerOperation,
  context: LedgerFailureContext,
): void {
  logActionFailure({ operation, error, context });
}

export { LEDGER_OPERATION };
export type { LedgerOperation };
