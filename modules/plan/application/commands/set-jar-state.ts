import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { assertPlanPeriodUnlocked } from "../assert-plan-unlocked";
import {
  JarState,
  JAR_STATE_VALUES,
  type JarState as JarStateValue,
} from "../plan-constants";

export const setJarStateInputSchema = z.object({
  jarId: z.string().uuid(),
  state: z.enum(JAR_STATE_VALUES),
});

export type SetJarStateInput = z.infer<typeof setJarStateInputSchema>;

export type SetJarStateResult =
  | { ok: true; state: JarStateValue }
  | { ok: false; code: ProductActionErrorCode };

/**
 * Set jar lifecycle state. Only Active is an allocation target (BR-03).
 */
export async function setJarState(
  raw: SetJarStateInput,
): Promise<SetJarStateResult> {
  const parsed = setJarStateInputSchema.safeParse(raw);
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

  const flags =
    parsed.data.state === JarState.ARCHIVED
      ? { is_archived: true, is_paused: false }
      : parsed.data.state === JarState.PAUSED
        ? { is_archived: false, is_paused: true }
        : { is_archived: false, is_paused: false };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("jars")
      .update({ ...flags, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.jarId)
      .eq("household_id", gate.householdId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, state: parsed.data.state };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
