import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";

const INBOX_WORKER_ERROR_CONTEXT = "[inbox staleness worker]";

export type InboxStalenessWorkerResult =
  | { ok: true; expiredCount: number }
  | { ok: false; code: ProductActionErrorCode };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Hourly-capable staleness sweep for the active household (BR-15). */
export async function runInboxStalenessWorker(): Promise<InboxStalenessWorkerResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("run_inbox_staleness_worker");

    if (error || !data || !isRecord(data)) {
      if (error) console.error(INBOX_WORKER_ERROR_CONTEXT, error);
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const expiredCount =
      typeof data.expired_count === "number" ||
      typeof data.expired_count === "string"
        ? Number(data.expired_count)
        : 0;
    return { ok: true, expiredCount };
  } catch (error) {
    console.error(INBOX_WORKER_ERROR_CONTEXT, error);
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
