import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import { INBOX_OPERATION, INBOX_RPC } from "../inbox-constants";
import {
  classifyInboxRpcError,
  logInboxFailure,
  type InboxCommandErrorCode,
} from "../inbox-error";

export type LoanDebtAttentionSyncResult = Result<
  { refreshedCount: number; archivedCount: number },
  InboxCommandErrorCode
>;

export type LoanDebtAttentionSyncContext = {
  client: SupabaseClient;
  householdId: string;
};

export async function syncLoanDebtAttentionInboxItems(
  context?: LoanDebtAttentionSyncContext,
): Promise<LoanDebtAttentionSyncResult> {
  const gate = context
    ? { ok: true as const, householdId: context.householdId }
    : await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const supabase = context?.client ?? (await createSupabaseServerClient());
    const { data, error } = await supabase.rpc(
      INBOX_RPC.SYNC_LOAN_DEBT_ATTENTION,
    );
    if (error) {
      const code = classifyInboxRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logInboxFailure(error, INBOX_OPERATION.LOAN_DEBT_ATTENTION_SYNC, {
          householdId: gate.householdId,
        });
      }
      return { ok: false, code };
    }

    const result = isRecord(data) ? data : {};
    const refreshedCount = Number(result?.refreshed_count);
    const archivedCount = Number(result?.archived_count);
    if (
      !Number.isInteger(refreshedCount) ||
      refreshedCount < 0 ||
      !Number.isInteger(archivedCount) ||
      archivedCount < 0
    ) {
      logInboxFailure(null, INBOX_OPERATION.LOAN_DEBT_ATTENTION_SYNC, {
        householdId: gate.householdId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, refreshedCount, archivedCount };
  } catch (error) {
    logInboxFailure(error, INBOX_OPERATION.LOAN_DEBT_ATTENTION_SYNC, {
      householdId: gate.householdId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
