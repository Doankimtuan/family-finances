import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  classifyInboxRpcError,
  logInboxFailure,
  type InboxCommandErrorCode,
} from "../inbox-error";
import { INBOX_OPERATION, INBOX_RPC } from "../inbox-constants";

export type InboxStalenessWorkerResult = Result<
  { expiredCount: number },
  InboxCommandErrorCode
>;

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
    const { data, error } = await supabase.rpc(INBOX_RPC.STALENESS_WORKER);

    if (error) {
      const code = classifyInboxRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logInboxFailure(error, INBOX_OPERATION.STALENESS_WORKER, {
          householdId: gate.householdId,
        });
      }
      return { ok: false, code };
    }
    if (!isRecord(data)) {
      logInboxFailure(null, INBOX_OPERATION.STALENESS_WORKER, {
        householdId: gate.householdId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const expiredCountValue =
      typeof data.expired_count === "number" ||
      typeof data.expired_count === "string"
        ? Number(data.expired_count)
        : Number.NaN;
    if (!Number.isFinite(expiredCountValue) || expiredCountValue < 0) {
      logInboxFailure(null, INBOX_OPERATION.STALENESS_WORKER, {
        householdId: gate.householdId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, expiredCount: expiredCountValue };
  } catch (error) {
    logInboxFailure(error, INBOX_OPERATION.STALENESS_WORKER, {
      householdId: gate.householdId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
