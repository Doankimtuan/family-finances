import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { DEFAULT_CURRENCY } from "../ledger-constants";

export type MoneyProductMutationResult =
  | { ok: true; id?: string; inboxItemId?: string; completed?: boolean }
  | { ok: false; code: ProductActionErrorCode };

export const createLiabilityInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  creditor: z.string().trim().max(80).optional(),
  principalAmount: z.number().finite().int().positive(),
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
  note: z.string().trim().max(200).optional(),
});

export type CreateLiabilityInput = z.infer<typeof createLiabilityInputSchema>;

export async function createLiability(
  raw: CreateLiabilityInput,
): Promise<MoneyProductMutationResult> {
  const parsed = createLiabilityInputSchema.safeParse(raw);
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
      .from("liabilities")
      .insert({
        household_id: gate.householdId,
        name: parsed.data.name,
        creditor: parsed.data.creditor || null,
        principal_amount: parsed.data.principalAmount,
        remaining_amount: parsed.data.principalAmount,
        currency: DEFAULT_CURRENCY,
        due_day: parsed.data.dueDay ?? null,
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

export const recordLiabilityPaymentInputSchema = z.object({
  liabilityId: z.string().uuid(),
  amount: z.number().finite().int().positive(),
});

export type RecordLiabilityPaymentInput = z.infer<
  typeof recordLiabilityPaymentInputSchema
>;

export async function recordLiabilityPayment(
  raw: RecordLiabilityPaymentInput,
): Promise<MoneyProductMutationResult> {
  const parsed = recordLiabilityPaymentInputSchema.safeParse(raw);
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
    const { data, error } = await supabase.rpc("record_liability_payment", {
      p_liability_id: parsed.data.liabilityId,
      p_amount: parsed.data.amount,
    });
    if (error) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    const ok =
      data && typeof data === "object" && (data as { ok?: boolean }).ok;
    if (!ok) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, id: parsed.data.liabilityId };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const createSavingsInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  principalAmount: z.number().finite().int().positive(),
  maturityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
      .from("savings_accounts")
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
    const { data, error } = await supabase.rpc("enqueue_savings_maturity", {
      p_savings_id: parsed.data.savingsId,
    });
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

export const createInstallmentInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  cardLabel: z.string().trim().max(40).optional(),
  totalAmount: z.number().finite().int().positive(),
  installmentAmount: z.number().finite().int().positive(),
  numInstallments: z.number().int().positive().max(120),
  note: z.string().trim().max(200).optional(),
});

export type CreateInstallmentInput = z.infer<
  typeof createInstallmentInputSchema
>;

export async function createInstallmentPlan(
  raw: CreateInstallmentInput,
): Promise<MoneyProductMutationResult> {
  const parsed = createInstallmentInputSchema.safeParse(raw);
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
      .from("installment_plans")
      .insert({
        household_id: gate.householdId,
        name: parsed.data.name,
        card_label: parsed.data.cardLabel || null,
        total_amount: parsed.data.totalAmount,
        installment_amount: parsed.data.installmentAmount,
        currency: DEFAULT_CURRENCY,
        num_installments: parsed.data.numInstallments,
        paid_installments: 0,
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

export const recordInstallmentPaymentInputSchema = z.object({
  planId: z.string().uuid(),
});

export type RecordInstallmentPaymentInput = z.infer<
  typeof recordInstallmentPaymentInputSchema
>;

export async function recordInstallmentPayment(
  raw: RecordInstallmentPaymentInput,
): Promise<MoneyProductMutationResult> {
  const parsed = recordInstallmentPaymentInputSchema.safeParse(raw);
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
    const { data, error } = await supabase.rpc("record_installment_payment", {
      p_plan_id: parsed.data.planId,
    });
    if (error) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    const payload = data as {
      ok?: boolean;
      completed?: boolean;
      inboxItemId?: string;
    } | null;
    if (!payload?.ok) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return {
      ok: true,
      id: parsed.data.planId,
      completed: Boolean(payload.completed),
      inboxItemId: payload.inboxItemId,
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
