import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  createTransferIdempotencyKey,
  ISO_DATE_PATTERN,
  LedgerRpcName,
  RECORD_TRANSFER_INVALID_ERROR_NEEDLES,
  TRANSFER_IDEMPOTENCY_KEY_MAX_LEN,
  TRANSFER_IDEMPOTENCY_KEY_MIN_LEN,
} from "../ledger-constants";

export const recordTransferInputSchema = z.object({
  sourceAccountId: z.string().uuid(),
  destinationAccountId: z.string().uuid(),
  amount: z.number().int().positive(),
  transactionDate: z.string().regex(ISO_DATE_PATTERN).optional(),
  note: z.string().trim().max(500).optional(),
  idempotencyKey: z
    .string()
    .trim()
    .min(TRANSFER_IDEMPOTENCY_KEY_MIN_LEN)
    .max(TRANSFER_IDEMPOTENCY_KEY_MAX_LEN)
    .optional(),
});

export type RecordTransferInput = z.infer<typeof recordTransferInputSchema>;

export type RecordTransferResult =
  | {
      ok: true;
      transferGroupId: string;
      sourceTransactionId: string;
      destinationTransactionId: string;
      sourceDelta: number;
      destinationDelta: number;
      idempotentReplay: boolean;
    }
  | { ok: false; code: ProductActionErrorCode };

function isTransferInvalidMessage(message: string): boolean {
  return RECORD_TRANSFER_INVALID_ERROR_NEEDLES.some((needle) =>
    message.includes(needle),
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

  if (parsed.data.sourceAccountId === parsed.data.destinationAccountId) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
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
      const message = error.message?.toLowerCase() ?? "";
      if (isTransferInvalidMessage(message)) {
        return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
      }
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as {
      ok?: boolean;
      transferGroupId?: string;
      sourceTransactionId?: string;
      destinationTransactionId?: string;
      sourceDelta?: number;
      destinationDelta?: number;
      idempotentReplay?: boolean;
    } | null;

    const sourceDelta = Number(payload?.sourceDelta);
    const destinationDelta = Number(payload?.destinationDelta);

    if (
      !payload?.ok ||
      !payload.transferGroupId ||
      !payload.sourceTransactionId ||
      !payload.destinationTransactionId ||
      !Number.isFinite(sourceDelta) ||
      !Number.isFinite(destinationDelta)
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      transferGroupId: payload.transferGroupId,
      sourceTransactionId: payload.sourceTransactionId,
      destinationTransactionId: payload.destinationTransactionId,
      sourceDelta,
      destinationDelta,
      idempotentReplay: Boolean(payload.idempotentReplay),
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
