import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
} from "@/modules/tenancy/application/product-action-error";
import {
  DEFAULT_CURRENCY,
  ISO_DATE_PATTERN,
  LedgerRelation,
  LedgerRpcName,
} from "../ledger-constants";
import type { MoneyProductMutationResult } from "./shared";

/**
 * @deprecated Legacy Ledger savings_accounts writes. The active Savings
 * lifecycle lives in modules/savings/application.
 */

export const createSavingsInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  principalAmount: z.number().finite().int().positive(),
  maturityDate: z.string().regex(ISO_DATE_PATTERN),
  note: z.string().trim().max(200).optional(),
});

export type CreateSavingsInput = z.infer<typeof createSavingsInputSchema>;

export async function createSavingsProduct(
  raw: CreateSavingsInput,
): Promise<MoneyProductMutationResult> {
  const parsed = createSavingsInputSchema.safeParse(raw);
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
    const { data, error } = await supabase
      .from(LedgerRelation.SAVINGS_ACCOUNTS)
      .insert({
        household_id: gate.householdId,
        name: parsed.data.name,
        principal_amount: parsed.data.principalAmount,
        currency: DEFAULT_CURRENCY,
        maturity_date: parsed.data.maturityDate,
        note: parsed.data.note || null,
        created_by: gate.userId,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const enqueueSavingsMaturityInputSchema = z.object({
  savingsId: z.string().uuid(),
});

export type EnqueueSavingsMaturityInput = z.infer<
  typeof enqueueSavingsMaturityInputSchema
>;

export async function enqueueSavingsMaturity(
  raw: EnqueueSavingsMaturityInput,
): Promise<MoneyProductMutationResult> {
  const parsed = enqueueSavingsMaturityInputSchema.safeParse(raw);
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
    const { data, error } = await supabase.rpc(
      LedgerRpcName.ENQUEUE_SAVINGS_MATURITY,
      {
        p_savings_id: parsed.data.savingsId,
      },
    );
    if (error) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    const payload = data as { ok?: boolean; inboxItemId?: string } | null;
    if (!payload?.ok) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return {
      ok: true,
      id: parsed.data.savingsId,
      inboxItemId: payload.inboxItemId,
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
