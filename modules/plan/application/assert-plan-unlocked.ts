import "server-only";

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { currentPeriodMonth } from "./ritual-period";

export type PlanLockGate =
  | { ok: true }
  | { ok: false; code: typeof PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED };

/**
 * BR-08 / AC-008 — approved Month Ritual locks normal plan mutations.
 * If the ritual table is missing (migration pending), fail open so Plan stays usable.
 */
export async function assertPlanPeriodUnlocked(
  householdId: string,
  periodMonth: string = currentPeriodMonth(),
): Promise<PlanLockGate> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("month_ritual_runs")
      .select("id")
      .eq("household_id", householdId)
      .eq("period_month", periodMonth)
      .eq("status", "approved")
      .maybeSingle();

    if (error) {
      return { ok: true };
    }

    if (data?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED };
    }

    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export function isMonthLockedCode(
  code: ProductActionErrorCode,
): code is typeof PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED {
  return code === PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED;
}
