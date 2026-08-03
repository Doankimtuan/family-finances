import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  AccountType,
  CardBillingMonthStatus,
  TransactionDirection,
} from "../ledger-constants";
import { applyFifoSettlement } from "../credit-card-billing";
import { mapBillingMonthRow } from "../credit-card-types";

export const settleCardInputSchema = z.object({
  cardAccountId: z.string().uuid(),
  sourceAccountId: z.string().uuid(),
  amount: z.number().int().positive(),
});

export type SettleCardInput = z.infer<typeof settleCardInputSchema>;

export type SettleCardResult =
  | { ok: true; transactionId: string }
  | { ok: false; code: ProductActionErrorCode };

/**
 * FIFO settle credit card from a liquid source account (expense on source).
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
    const [{ data: card }, { data: source }, { data: settings }] =
      await Promise.all([
        supabase
          .from("accounts")
          .select("id, type")
          .eq("household_id", gate.householdId)
          .eq("id", parsed.data.cardAccountId)
          .eq("type", AccountType.CREDIT_CARD)
          .eq("is_archived", false)
          .maybeSingle(),
        supabase
          .from("accounts")
          .select("id, type")
          .eq("household_id", gate.householdId)
          .eq("id", parsed.data.sourceAccountId)
          .eq("is_archived", false)
          .maybeSingle(),
        supabase
          .from("credit_card_settings")
          .select("account_id")
          .eq("household_id", gate.householdId)
          .eq("account_id", parsed.data.cardAccountId)
          .maybeSingle(),
      ]);

    if (!card || !source || !settings) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    if (source.type === AccountType.CREDIT_CARD) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { data: monthRows } = await supabase
      .from("card_billing_months")
      .select(
        "id, card_account_id, billing_month, statement_amount, paid_amount, due_date, status",
      )
      .eq("household_id", gate.householdId)
      .eq("card_account_id", parsed.data.cardAccountId)
      .neq("status", CardBillingMonthStatus.SETTLED)
      .order("billing_month", { ascending: true });

    const months = (monthRows ?? []).map(mapBillingMonthRow);
    if (months.length === 0) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "record_transaction",
      {
        p_account_id: parsed.data.sourceAccountId,
        p_type: TransactionDirection.EXPENSE,
        p_amount: parsed.data.amount,
        p_transaction_date: new Date().toISOString().slice(0, 10),
        p_note: "Credit card payment (FIFO)",
        p_category_id: null,
        p_jar_id: null,
        p_idempotency_key: null,
      },
    );

    if (rpcError || !rpcData || typeof rpcData !== "object") {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    const payload = rpcData as { transaction_id?: string };
    if (!payload.transaction_id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const fifo = applyFifoSettlement(
      months.map((m) => ({
        id: m.id,
        statementAmount: m.statementAmount,
        paidAmount: m.paidAmount,
        status: m.status,
      })),
      parsed.data.amount,
    );

    for (const month of fifo.months) {
      const { error } = await supabase
        .from("card_billing_months")
        .update({
          paid_amount: month.paidAmount,
          status: month.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", month.id);
      if (error) {
        return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
      }

      if (month.status === CardBillingMonthStatus.SETTLED) {
        await supabase
          .from("card_billing_items")
          .update({ is_paid: true, updated_at: new Date().toISOString() })
          .eq("billing_month_id", month.id)
          .eq("is_converted_to_installment", false);
      }
    }

    return { ok: true, transactionId: payload.transaction_id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
