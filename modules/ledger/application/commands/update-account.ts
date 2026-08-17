import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import { ACCOUNT_TYPE_VALUES } from "../ledger-constants";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";

export const updateAccountInputSchema = z.object({
  accountId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  type: z.enum(ACCOUNT_TYPE_VALUES),
});

export type UpdateAccountInput = z.infer<typeof updateAccountInputSchema>;

export type UpdateAccountResult = Result<object, ProductActionErrorCode>;

/**
 * Rename / retag an active account. Opening balance is create-time only.
 */
export async function updateAccount(
  raw: UpdateAccountInput,
): Promise<UpdateAccountResult> {
  const parsed = updateAccountInputSchema.safeParse(raw);
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
      .from("accounts")
      .update({
        name: parsed.data.name,
        type: parsed.data.type,
      })
      .eq("id", parsed.data.accountId)
      .eq("household_id", gate.householdId)
      .eq("is_archived", false)
      .select("id")
      .maybeSingle();

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.UPDATE_ACCOUNT, {
        householdId: gate.householdId,
        accountId: parsed.data.accountId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (!data?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    return { ok: true };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.UPDATE_ACCOUNT, {
      householdId: gate.householdId,
      accountId: parsed.data.accountId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
