import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  CycleStatus,
  InterestCalcMethod,
  SAVINGS_RPC,
} from "../savings-constants";
import { classifySavingsRpcError, logSavingsFailure } from "../savings-error";
import {
  previewEarlyWithdrawal,
  shouldWarnPenalty,
  type EarlyWithdrawalPreview,
} from "../savings-penalty";
import type { PackageSnapshot } from "../savings-types";
import { getSaving } from "../queries/list-savings";

export const earlyWithdrawInputSchema = z.object({
  savingId: z.string().uuid(),
  cycleId: z.string().uuid(),
  settlementAccountId: z.string().uuid().optional(),
});

export type EarlyWithdrawInput = z.infer<typeof earlyWithdrawInputSchema>;

export type PreviewEarlyWithdrawalResult =
  | {
      ok: true;
      preview: EarlyWithdrawalPreview;
      warnPenalty: boolean;
      settlementAccountId: string;
      productName: string;
    }
  | { ok: false; code: ProductActionErrorCode };

export type ConfirmEarlyWithdrawalResult =
  | {
      ok: true;
      savingId: string;
      cycleId: string;
      netReturned: number;
    }
  | { ok: false; code: ProductActionErrorCode };

async function buildPreview(savingId: string, cycleId: string) {
  const saving = await getSaving(savingId);
  if (!saving?.latestCycle || saving.latestCycle.id !== cycleId) {
    return null;
  }
  const cycle = saving.latestCycle;
  if (cycle.status !== CycleStatus.ACTIVE) {
    return null;
  }

  const withdrawalDate = new Date().toISOString().slice(0, 10);
  const preview = previewEarlyWithdrawal({
    principal: cycle.principal,
    annualRate: cycle.lockedRate,
    startDate: cycle.startDate,
    endDate: cycle.endDate,
    withdrawalDate,
    interestMethod:
      saving.productSnapshot.interestCalculationMethod ??
      InterestCalcMethod.SIMPLE,
    packageSnapshot: cycle.packageSnapshot as PackageSnapshot,
  });

  return { saving, cycle, preview };
}

/** Preview early withdrawal (no Inbox / no money movement). */
export async function previewEarlyWithdrawalForSaving(
  raw: EarlyWithdrawInput,
): Promise<PreviewEarlyWithdrawalResult> {
  const parsed = earlyWithdrawInputSchema.safeParse(raw);
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

  const built = await buildPreview(parsed.data.savingId, parsed.data.cycleId);
  if (!built) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  return {
    ok: true,
    preview: built.preview,
    warnPenalty: shouldWarnPenalty(built.preview),
    settlementAccountId:
      parsed.data.settlementAccountId ?? built.saving.settlementAccountId,
    productName: built.saving.productName,
  };
}

/** @deprecated Prefer previewEarlyWithdrawalForSaving + app Inbox enqueue. */
export async function requestEarlyWithdrawal(raw: EarlyWithdrawInput): Promise<
  | {
      ok: true;
      preview: EarlyWithdrawalPreview;
      warnPenalty: boolean;
      settlementAccountId: string;
      productName: string;
    }
  | { ok: false; code: ProductActionErrorCode }
> {
  return previewEarlyWithdrawalForSaving(raw);
}

/** Execute early withdrawal after Inbox confirmation (moves money). */
export async function confirmEarlyWithdrawal(
  raw: EarlyWithdrawInput,
): Promise<ConfirmEarlyWithdrawalResult> {
  const parsed = earlyWithdrawInputSchema.safeParse(raw);
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

  const built = await buildPreview(parsed.data.savingId, parsed.data.cycleId);
  if (!built) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const { preview } = built;
  if (
    !preview.quoteReady ||
    preview.eligibleInterest == null ||
    preview.penaltyAmount == null ||
    preview.netReturned == null
  ) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(SAVINGS_RPC.EARLY_WITHDRAW, {
      p_cycle_id: parsed.data.cycleId,
      p_principal: preview.principal,
      p_accrued_interest: preview.accruedInterest,
      p_eligible_interest: preview.eligibleInterest,
      p_penalty_amount: preview.penaltyAmount,
      p_net_returned: preview.netReturned,
      p_penalty_strategy: preview.penaltyStrategy,
      p_settlement_account_id: parsed.data.settlementAccountId ?? null,
    });

    if (error) {
      const code = classifySavingsRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logSavingsFailure(error, SAVINGS_RPC.EARLY_WITHDRAW, {
          savingId: parsed.data.savingId,
          cycleId: parsed.data.cycleId,
          settlementAccountId: parsed.data.settlementAccountId,
        });
      }
      return { ok: false, code };
    }

    const payload = data as {
      ok?: boolean;
      savingId?: string;
      cycleId?: string;
      netReturned?: number;
    } | null;

    if (!payload?.ok || !payload.savingId) {
      logSavingsFailure(null, SAVINGS_RPC.EARLY_WITHDRAW, {
        savingId: parsed.data.savingId,
        cycleId: parsed.data.cycleId,
        settlementAccountId: parsed.data.settlementAccountId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      savingId: payload.savingId,
      cycleId: payload.cycleId ?? parsed.data.cycleId,
      netReturned: Number(payload.netReturned ?? 0),
    };
  } catch (error) {
    logSavingsFailure(error, SAVINGS_RPC.EARLY_WITHDRAW, {
      savingId: parsed.data.savingId,
      cycleId: parsed.data.cycleId,
      settlementAccountId: parsed.data.settlementAccountId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
