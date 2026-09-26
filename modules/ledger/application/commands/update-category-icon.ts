import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { CATEGORY_ICON_KEYS } from "../icon-constants";
import { LedgerRelation } from "../ledger-constants";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";

export const updateCategoryIconInputSchema = z.object({
  categoryId: z.string().uuid(),
  iconKey: z.enum(CATEGORY_ICON_KEYS),
});
export type UpdateCategoryIconInput = z.infer<
  typeof updateCategoryIconInputSchema
>;

export async function updateCategoryIcon(
  raw: UpdateCategoryIconInput,
): Promise<{ ok: true } | { ok: false; code: ProductActionErrorCode }> {
  const parsed = updateCategoryIconInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok)
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(LedgerRelation.CATEGORIES)
      .update({ icon_key: parsed.data.iconKey })
      .eq("id", parsed.data.categoryId)
      .eq("household_id", gate.householdId)
      .eq("is_system", false)
      .eq("is_active", true)
      .select("id")
      .maybeSingle();
    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.UPDATE_CATEGORY_ICON, {
        householdId: gate.householdId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return data
      ? { ok: true }
      : { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.UPDATE_CATEGORY_ICON, {
      householdId: gate.householdId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
