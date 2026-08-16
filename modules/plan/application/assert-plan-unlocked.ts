import "server-only";
import {
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { RitualStatus } from "./plan-constants";

export type PlanLockGate =
  | { ok: true }
  | { ok: false; code: typeof PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED };

/**
 * V2 compatibility boundary. Monthly Review is an optional report and never a
 * financial close, so an approved or skipped review cannot block Plan usage.
 * The function remains for existing command call sites and future policy hooks.
 */
export async function assertPlanPeriodUnlocked(
  _householdId: string,
  _periodMonth?: string,
): Promise<PlanLockGate> {
  void _householdId;
  void _periodMonth;
  return { ok: true };
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
