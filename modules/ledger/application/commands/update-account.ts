import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";
import {
  updateAccountInputSchema,
  type UpdateAccountInput,
} from "./update-account.schema";

export { updateAccountInputSchema } from "./update-account.schema";
export type { UpdateAccountInput } from "./update-account.schema";

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
