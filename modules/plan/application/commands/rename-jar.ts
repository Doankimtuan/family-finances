import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { assertPlanPeriodUnlocked } from "../assert-plan-unlocked";

export const renameJarInputSchema = z.object({
  jarId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
});

export type RenameJarInput = z.infer<typeof renameJarInputSchema>;

export type RenameJarResult =
  | { ok: true; name: string }
  | { ok: false; code: ProductActionErrorCode };

/**
 * Rename a jar. Custom names stop using catalog localization.
 */
export async function renameJar(raw: RenameJarInput): Promise<RenameJarResult> {
  const parsed = renameJarInputSchema.safeParse(raw);
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

  const lock = await assertPlanPeriodUnlocked(gate.householdId);
  if (!lock.ok) {
    return { ok: false, code: lock.code };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("jars")
      .update({
        name: parsed.data.name,
        is_name_custom: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.jarId)
      .eq("household_id", gate.householdId)
      .select("name")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, name: data.name as string };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
