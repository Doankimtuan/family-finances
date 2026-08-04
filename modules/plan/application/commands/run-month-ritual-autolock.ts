import "server-only";

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";

export type RitualAutolockWorkerResult =
  | {
      ok: true;
      lockedCount: number;
      unmappedResolvedCount: number;
    }
  | { ok: false; code: ProductActionErrorCode };

/**
 * ST-E04-001 / BR-08 — household-scoped 30-day Month Ritual auto-lock sweep.
 * Safe to call on ritual page open (mirrors Inbox staleness worker).
 */
export async function runMonthRitualAutolockWorker(): Promise<RitualAutolockWorkerResult> {
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
      "run_month_ritual_autolock_worker",
    );

    if (error || !data || typeof data !== "object") {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as {
      locked_count?: number;
      unmapped_resolved_count?: number;
    };

    return {
      ok: true,
      lockedCount: Number(payload.locked_count ?? 0),
      unmappedResolvedCount: Number(payload.unmapped_resolved_count ?? 0),
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
