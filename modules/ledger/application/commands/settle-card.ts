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
} from "../ledger-constants";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  classifyCardRpcError,
  LEDGER_OPERATION,
  logLedgerFailure,
} from "../ledger-error";

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

export type SettleCardResult = Result<
  {
    transactionId: string;
    paymentId: string;
    sourceDelta: number;
    appliedAmount: number;
    remainingDue: number;
    idempotentReplay: boolean;
  },
  ProductActionErrorCode
>;

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
      const code = classifyCardRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logLedgerFailure(error, LEDGER_OPERATION.SETTLE_CARD, {
          householdId: gate.householdId,
          cardAccountId: parsed.data.cardAccountId,
          sourceAccountId: parsed.data.sourceAccountId,
        });
      }
      return { ok: false, code };
    }

    const payload = typeof data === "object" && data !== null ? data : null;
    const sourceDelta = Number(
      payload && "sourceDelta" in payload ? payload.sourceDelta : Number.NaN,
    );
    const appliedAmount = Number(
      payload && "appliedAmount" in payload
        ? payload.appliedAmount
        : Number.NaN,
    );
    const remainingDue = Number(
      payload && "remainingDue" in payload ? payload.remainingDue : Number.NaN,
    );

    if (
      !payload ||
      payload.ok !== true ||
      typeof payload.transactionId !== "string" ||
      typeof payload.paymentId !== "string" ||
      !Number.isFinite(sourceDelta) ||
      !Number.isFinite(appliedAmount) ||
      !Number.isFinite(remainingDue)
    ) {
      logLedgerFailure(null, LEDGER_OPERATION.SETTLE_CARD, {
        householdId: gate.householdId,
        cardAccountId: parsed.data.cardAccountId,
        sourceAccountId: parsed.data.sourceAccountId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      transactionId: payload.transactionId,
      paymentId: payload.paymentId,
      sourceDelta,
      appliedAmount,
      remainingDue,
      idempotentReplay:
        "idempotentReplay" in payload && Boolean(payload.idempotentReplay),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.SETTLE_CARD, {
      householdId: gate.householdId,
      cardAccountId: parsed.data.cardAccountId,
      sourceAccountId: parsed.data.sourceAccountId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
