import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  CARD_PAYMENT_IDEMPOTENCY_KEY_MAX_LEN,
  CARD_PAYMENT_IDEMPOTENCY_KEY_MIN_LEN,
  createCardPaymentIdempotencyKey,
  ISO_DATE_PATTERN,
  LedgerRpcName,
  SETTLE_CARD_INVALID_ERROR_NEEDLES,
} from "../ledger-constants";

export const settleCardInputSchema = z.object({
  cardAccountId: z.string().uuid(),
  sourceAccountId: z.string().uuid(),
  amount: z.number().int().positive(),
  effectiveDate: z.string().regex(ISO_DATE_PATTERN).optional(),
  idempotencyKey: z
    .string()
    .trim()
    .min(CARD_PAYMENT_IDEMPOTENCY_KEY_MIN_LEN)
    .max(CARD_PAYMENT_IDEMPOTENCY_KEY_MAX_LEN)
    .optional(),
});

export type SettleCardInput = z.infer<typeof settleCardInputSchema>;

export type SettleCardResult =
  | {
      ok: true;
      transactionId: string;
      paymentId: string;
      sourceDelta: number;
      appliedAmount: number;
      remainingDue: number;
      idempotentReplay: boolean;
    }
  | { ok: false; code: ProductActionErrorCode };

function isSettleCardInvalidMessage(message: string): boolean {
  return SETTLE_CARD_INVALID_ERROR_NEEDLES.some((needle) =>
    message.includes(needle),
  );
}

/**
 * Atomic card liability payment via settle_card_payment RPC.
 * Not income or expense; one source balance change + payment link.
 */
export async function settleCard(
  raw: SettleCardInput,
): Promise<SettleCardResult> {
  const parsed = settleCardInputSchema.safeParse(raw);
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

  if (parsed.data.cardAccountId === parsed.data.sourceAccountId) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const idempotencyKey =
      parsed.data.idempotencyKey ?? createCardPaymentIdempotencyKey();

    const { data, error } = await supabase.rpc(
      LedgerRpcName.SETTLE_CARD_PAYMENT,
      {
        p_card_account_id: parsed.data.cardAccountId,
        p_source_account_id: parsed.data.sourceAccountId,
        p_amount: parsed.data.amount,
        p_effective_date: parsed.data.effectiveDate ?? null,
        p_idempotency_key: idempotencyKey,
      },
    );

    if (error) {
      const message = error.message?.toLowerCase() ?? "";
      if (isSettleCardInvalidMessage(message)) {
        return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
      }
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as {
      ok?: boolean;
      transactionId?: string;
      paymentId?: string;
      sourceDelta?: number;
      appliedAmount?: number;
      remainingDue?: number;
      idempotentReplay?: boolean;
    } | null;

    const sourceDelta = Number(payload?.sourceDelta);
    const appliedAmount = Number(payload?.appliedAmount);
    const remainingDue = Number(payload?.remainingDue);

    if (
      !payload?.ok ||
      !payload.transactionId ||
      !payload.paymentId ||
      !Number.isFinite(sourceDelta) ||
      !Number.isFinite(appliedAmount) ||
      !Number.isFinite(remainingDue)
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      transactionId: payload.transactionId,
      paymentId: payload.paymentId,
      sourceDelta,
      appliedAmount,
      remainingDue,
      idempotentReplay: Boolean(payload.idempotentReplay),
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
