import "server-only";

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { currentPeriodMonth } from "./ritual-period";
import { RitualStatus, RITUAL_LOCKED_STATUSES } from "./plan-constants";

export type PlanLockGate =
  | { ok: true }
  | { ok: false; code: typeof PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED };

/**
 * BR-08 — plan mutations blocked when:
 * 1. The target period is approved or pending_review, OR
 * 2. Any period is pending_review (unresolved auto-lock must be corrected first).
 * Fail closed on query errors (money-domain safety).
 */
export async function assertPlanPeriodUnlocked(
  householdId: string,
  periodMonth: string = currentPeriodMonth(),
): Promise<PlanLockGate> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: periodLock, error: periodError } = await supabase
      .from("month_ritual_runs")
      .select("id")
      .eq("household_id", householdId)
      .eq("period_month", periodMonth)
      .in("status", [...RITUAL_LOCKED_STATUSES])
      .maybeSingle();

    if (periodError) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED };
    }

    if (periodLock?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED };
    }

    const { data: pendingReview, error: pendingError } = await supabase
      .from("month_ritual_runs")
      .select("id")
      .eq("household_id", householdId)
      .eq("status", RitualStatus.PENDING_REVIEW)
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED };
    }

    if (pendingReview?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED };
    }

    return { ok: true };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED };
  }
}

export function isMonthLockedCode(
  code: ProductActionErrorCode,
): code is typeof PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED {
  return code === PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED;
}

export function isPendingReviewStatus(
  status: string | null | undefined,
): boolean {
  return status === RitualStatus.PENDING_REVIEW;
}
