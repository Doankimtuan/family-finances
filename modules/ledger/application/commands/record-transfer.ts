import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  createTransferIdempotencyKey,
  LedgerRpcName,
} from "../ledger-constants";
import {
  classifyRecordTransferRpcError,
  LEDGER_OPERATION,
  logLedgerFailure,
} from "../ledger-error";
import {
  recordTransferInputSchema,
  type RecordTransferInput,
} from "./record-transfer.schema";

export {
  recordTransferInputSchema,
  type RecordTransferInput,
} from "./record-transfer.schema";

type RecordTransferSuccess = {
  transferGroupId: string;
  sourceTransactionId: string;
  destinationTransactionId: string;
  sourceDelta: number;
  destinationDelta: number;
  idempotentReplay: boolean;
};

export type RecordTransferResult = Result<
  RecordTransferSuccess,
  ProductActionErrorCode
>;

type RecordTransferRpcPayload = {
  ok: true;
  transferGroupId: string;
  sourceTransactionId: string;
  destinationTransactionId: string;
  sourceDelta: unknown;
  destinationDelta: unknown;
  idempotentReplay?: unknown;
};

function isRecordTransferRpcPayload(
  value: unknown,
): value is RecordTransferRpcPayload {
  if (typeof value !== "object" || value === null) return false;
  if (!(
    "ok" in value &&
    "transferGroupId" in value &&
    "sourceTransactionId" in value &&
    "destinationTransactionId" in value &&
    "sourceDelta" in value &&
    "destinationDelta" in value
  )) {
    return false;
  }
  return (
    value.ok === true &&
    typeof value.transferGroupId === "string" &&
    typeof value.sourceTransactionId === "string" &&
    typeof value.destinationTransactionId === "string" &&
    (typeof value.sourceDelta === "number" ||
      typeof value.sourceDelta === "string") &&
    Number.isFinite(Number(value.sourceDelta)) &&
    (typeof value.destinationDelta === "number" ||
      typeof value.destinationDelta === "string") &&
    Number.isFinite(Number(value.destinationDelta))
  );
}

/**
 * Atomic owned-account transfer via record_owned_account_transfer RPC.
 * Neutral: source decreases once, destination increases once; not income/expense.
 */
export async function recordTransfer(
  raw: RecordTransferInput,
): Promise<RecordTransferResult> {
  const parsed = recordTransferInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const idempotencyKey =
      parsed.data.idempotencyKey ?? createTransferIdempotencyKey();

    const { data, error } = await supabase.rpc(
      LedgerRpcName.RECORD_OWNED_ACCOUNT_TRANSFER,
      {
        p_source_account_id: parsed.data.sourceAccountId,
        p_destination_account_id: parsed.data.destinationAccountId,
        p_amount: parsed.data.amount,
        p_transaction_date: parsed.data.transactionDate ?? null,
        p_note: parsed.data.note ?? null,
        p_idempotency_key: idempotencyKey,
      },
    );

    if (error) {
      const code = classifyRecordTransferRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logLedgerFailure(error, LEDGER_OPERATION.RECORD_TRANSFER, {
          householdId: gate.householdId,
          sourceAccountId: parsed.data.sourceAccountId,
          destinationAccountId: parsed.data.destinationAccountId,
        });
      }
      return { ok: false, code };
    }

    if (!isRecordTransferRpcPayload(data)) {
      logLedgerFailure(null, LEDGER_OPERATION.RECORD_TRANSFER, {
        householdId: gate.householdId,
        sourceAccountId: parsed.data.sourceAccountId,
        destinationAccountId: parsed.data.destinationAccountId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    const payload = data;

    return {
      ok: true,
      transferGroupId: payload.transferGroupId,
      sourceTransactionId: payload.sourceTransactionId,
      destinationTransactionId: payload.destinationTransactionId,
      sourceDelta: Number(payload.sourceDelta),
      destinationDelta: Number(payload.destinationDelta),
      idempotentReplay: Boolean(payload.idempotentReplay),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.RECORD_TRANSFER, {
      householdId: gate.householdId,
      sourceAccountId: parsed.data.sourceAccountId,
      destinationAccountId: parsed.data.destinationAccountId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
