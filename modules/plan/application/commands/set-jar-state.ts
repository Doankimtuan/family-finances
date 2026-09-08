import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import { assertPlanPeriodUnlocked } from "../assert-plan-unlocked";
import { logPlanFailure } from "../plan-error";
import {
  JarState,
  JAR_STATE_VALUES,
  PLAN_OPERATION,
  type JarState as JarStateValue,
} from "../plan-constants";
import { ensureJarPeriodRuleSnapshots } from "./ensure-jar-period-snapshots";

export const setJarStateInputSchema = z.object({
  jarId: z.string().uuid(),
  state: z.enum(JAR_STATE_VALUES),
});

export type SetJarStateInput = z.infer<typeof setJarStateInputSchema>;

export type SetJarStateResult = Result<
  { state: JarStateValue },
  ProductActionErrorCode
>;

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

    if (error) {
      logPlanFailure(error, PLAN_OPERATION.SET_JAR_STATE, {
        householdId: gate.householdId,
        jarId: parsed.data.jarId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (!data) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };

    await ensureJarPeriodRuleSnapshots();
    return { ok: true, state: parsed.data.state };
  } catch (error) {
    logPlanFailure(error, PLAN_OPERATION.SET_JAR_STATE, {
      householdId: gate.householdId,
      jarId: parsed.data.jarId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
