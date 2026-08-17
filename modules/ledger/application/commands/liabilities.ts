import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
} from "@/modules/tenancy/application/product-action-error";
import {
  DEFAULT_CURRENCY,
  LedgerRelation,
  LedgerRpcName,
} from "../ledger-constants";
import {
  classifyLiabilityRpcError,
  LEDGER_OPERATION,
  logLedgerFailure,
} from "../ledger-error";
import type { MoneyProductMutationResult } from "./shared";

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
      .from(LedgerRelation.LIABILITIES)
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

    if (error) {
      const code = classifyLiabilityRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logLedgerFailure(error, LEDGER_OPERATION.CREATE_LIABILITY, {
          householdId: gate.householdId,
        });
      }
      return { ok: false, code };
    }
    if (!data?.id) {
      logLedgerFailure(null, LEDGER_OPERATION.CREATE_LIABILITY, {
        householdId: gate.householdId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, id: data.id };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.CREATE_LIABILITY, {
      householdId: gate.householdId,
    });
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
    const { data, error } = await supabase.rpc(
      LedgerRpcName.RECORD_LIABILITY_PAYMENT,
      {
        p_liability_id: parsed.data.liabilityId,
        p_amount: parsed.data.amount,
      },
    );
    if (error) {
      const code = classifyLiabilityRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logLedgerFailure(error, LEDGER_OPERATION.RECORD_LIABILITY_PAYMENT, {
          householdId: gate.householdId,
          liabilityId: parsed.data.liabilityId,
        });
      }
      return { ok: false, code };
    }
    const ok =
      data && typeof data === "object" && "ok" in data && data.ok === true;
    if (!ok) {
      logLedgerFailure(null, LEDGER_OPERATION.RECORD_LIABILITY_PAYMENT, {
        householdId: gate.householdId,
        liabilityId: parsed.data.liabilityId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, id: parsed.data.liabilityId };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.RECORD_LIABILITY_PAYMENT, {
      householdId: gate.householdId,
      liabilityId: parsed.data.liabilityId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
