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
  SettlementAction,
  SettlementRule,
  RenewalDecisionSource,
  RenewalPolicy,
  RENEWAL_DECISION_SOURCE_VALUES,
  RENEWAL_POLICY_VALUES,
  SAVINGS_RPC,
} from "../savings-constants";
import {
  classifySavingsRpcError,
  isRecord,
  logSavingsFailure,
  savingsFailureCode,
} from "../savings-error";
import { resolvePackageSnapshot } from "../savings-provider-registry";
import type { RenewalDecision } from "../savings-types";
import { mapLegacyRenewalPreference } from "../renewal-policy-map";

export const settleSavingInputSchema = z.object({
  cycleId: z.string().uuid(),
  settlementAccountId: z.string().uuid().optional(),
  decisionSource: z.enum(RENEWAL_DECISION_SOURCE_VALUES).optional(),
});

export type SettleSavingInput = z.infer<typeof settleSavingInputSchema>;

export type SettleSavingResult =
  | {
      ok: true;
      savingId: string;
      cycleId: string;
      netAmount: number;
    }
  | { ok: false; code: ProductActionErrorCode };

export async function settleSaving(
  raw: SettleSavingInput,
): Promise<SettleSavingResult> {
  const parsed = settleSavingInputSchema.safeParse(raw);
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

  try {
    const supabase = await createSupabaseServerClient();

    const { data: before, error: beforeError } = await supabase
      .from("saving_cycles")
      .select(
        "id, locked_rate, package_snapshot, savings!inner(id, renewal_policy, household_id)",
      )
      .eq("id", parsed.data.cycleId)
      .maybeSingle();

    if (
      beforeError &&
      classifySavingsRpcError(beforeError) === PRODUCT_ACTION_ERROR_CODE.UNKNOWN
    ) {
      logSavingsFailure(beforeError, SAVINGS_RPC.SETTLE, {
        householdId: gate.householdId,
        cycleId: parsed.data.cycleId,
      });
    }

    const { data, error } = await supabase.rpc(SAVINGS_RPC.SETTLE, {
      p_cycle_id: parsed.data.cycleId,
      p_settlement_account_id: parsed.data.settlementAccountId ?? null,
      p_idempotency_key: `savings:settle:${parsed.data.cycleId}`,
    });

    if (error) {
      const code = classifySavingsRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logSavingsFailure(error, SAVINGS_RPC.SETTLE, {
          householdId: gate.householdId,
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
      netAmount?: number;
    } | null;

    if (!payload?.ok || !payload.savingId) {
      logSavingsFailure(null, SAVINGS_RPC.SETTLE, {
        householdId: gate.householdId,
        cycleId: parsed.data.cycleId,
        settlementAccountId: parsed.data.settlementAccountId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const savingJoin = isRecord(before) ? before.savings : undefined;
    const saving = Array.isArray(savingJoin) ? savingJoin[0] : savingJoin;
    const pkg = (before?.package_snapshot ?? {}) as { packageName?: string };
    const decision: RenewalDecision = {
      renewalPolicy: mapLegacyRenewalPreference(saving?.renewal_policy),
      settlementRule: SettlementRule.WITHDRAW_EVERYTHING,
      packageName: pkg.packageName ?? "",
      lockedRate: Number(before?.locked_rate ?? 0),
      decidedAt: new Date().toISOString(),
      decisionSource:
        parsed.data.decisionSource ?? RenewalDecisionSource.MANUAL,
    };

    const { error: decisionError } = await supabase.rpc(
      SAVINGS_RPC.RECORD_RENEWAL_DECISION,
      {
        p_cycle_id: parsed.data.cycleId,
        p_renewal_decision: decision,
        p_revert_one_time: false,
      },
    );
    if (
      decisionError &&
      classifySavingsRpcError(decisionError) ===
        PRODUCT_ACTION_ERROR_CODE.UNKNOWN
    ) {
      logSavingsFailure(decisionError, SAVINGS_RPC.RECORD_RENEWAL_DECISION, {
        householdId: gate.householdId,
        cycleId: parsed.data.cycleId,
      });
    }

    return {
      ok: true,
      savingId: payload.savingId,
      cycleId: payload.cycleId ?? parsed.data.cycleId,
      netAmount: Number(payload.netAmount ?? 0),
    };
  } catch (error) {
    logSavingsFailure(error, SAVINGS_RPC.SETTLE, {
      householdId: gate.householdId,
      cycleId: parsed.data.cycleId,
      settlementAccountId: parsed.data.settlementAccountId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

const RENEW_ACTION_VALUES = [
  SettlementAction.ROLL_PRINCIPAL_INTEREST,
  SettlementAction.ROLL_PRINCIPAL_ONLY,
] as const;

export const renewSavingInputSchema = z.object({
  cycleId: z.string().uuid(),
  action: z.enum(RENEW_ACTION_VALUES),
  packageId: z.string().uuid().optional(),
  settlementAccountId: z.string().uuid().optional(),
  decisionSource: z.enum(RENEWAL_DECISION_SOURCE_VALUES).optional(),
  renewalPolicyAfter: z.enum(RENEWAL_POLICY_VALUES).optional(),
});

export type RenewSavingInput = z.infer<typeof renewSavingInputSchema>;

export type RenewSavingResult =
  | {
      ok: true;
      savingId: string;
      cycleId: string;
      principal: number;
    }
  | { ok: false; code: ProductActionErrorCode };

export async function renewSaving(
  raw: RenewSavingInput,
): Promise<RenewSavingResult> {
  const parsed = renewSavingInputSchema.safeParse(raw);
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

  try {
    const supabase = await createSupabaseServerClient();

    const { data: cycleRow, error: cycleError } = await supabase
      .from("saving_cycles")
      .select(
        "id, saving_id, package_snapshot, locked_rate, status, savings!inner(household_id, product_snapshot, provider_id, product_name, renewal_policy)",
      )
      .eq("id", parsed.data.cycleId)
      .maybeSingle();

    if (cycleError) {
      return {
        ok: false,
        code: savingsFailureCode(cycleError, SAVINGS_RPC.RENEW, {
          householdId: gate.householdId,
          cycleId: parsed.data.cycleId,
        }),
      };
    }

    if (!cycleRow || cycleRow.status !== CycleStatus.MATURED) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const savingJoin = isRecord(cycleRow) ? cycleRow.savings : undefined;
    const saving = Array.isArray(savingJoin) ? savingJoin[0] : savingJoin;
    if (!saving || saving.household_id !== gate.householdId) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const cyclePackage = (cycleRow.package_snapshot ?? {}) as {
      packageId?: string;
      packageName?: string;
      annualInterestRate?: number;
    };
    const targetPackageId = parsed.data.packageId ?? cyclePackage.packageId;
    if (!targetPackageId)
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    const resolved = await resolvePackageSnapshot(targetPackageId);
    if (!resolved || resolved.providerId !== saving.provider_id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    const priorPolicy = mapLegacyRenewalPreference(saving.renewal_policy);
    const { data, error } = await supabase.rpc(SAVINGS_RPC.RENEW, {
      p_cycle_id: parsed.data.cycleId,
      p_action: parsed.data.action,
      p_target_package_id: targetPackageId,
      p_settlement_account_id: parsed.data.settlementAccountId ?? null,
      p_cycle_start_date: null,
      p_cycle_end_date: null,
      p_idempotency_key: [
        "saving:rollover",
        parsed.data.cycleId,
        parsed.data.action,
        targetPackageId,
      ].join(":"),
    });

    if (error) {
      const code = classifySavingsRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logSavingsFailure(error, SAVINGS_RPC.RENEW, {
          householdId: gate.householdId,
          cycleId: parsed.data.cycleId,
          packageId: targetPackageId,
          settlementAccountId: parsed.data.settlementAccountId,
        });
      }
      return { ok: false, code };
    }

    const payload = data as {
      ok?: boolean;
      savingId?: string;
      cycleId?: string;
      principal?: number;
    } | null;

    if (!payload?.ok || !payload.savingId) {
      logSavingsFailure(null, SAVINGS_RPC.RENEW, {
        householdId: gate.householdId,
        cycleId: parsed.data.cycleId,
        packageId: targetPackageId,
        settlementAccountId: parsed.data.settlementAccountId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const settlementRule =
      parsed.data.action === SettlementAction.ROLL_PRINCIPAL_ONLY
        ? SettlementRule.ROLL_PRINCIPAL_ONLY
        : SettlementRule.ROLL_PRINCIPAL_INTEREST;

    const decision: RenewalDecision = {
      renewalPolicy: priorPolicy,
      settlementRule,
      packageName: String(
        resolved.packageSnapshot.packageName ?? cyclePackage.packageName ?? "",
      ),
      lockedRate: resolved.packageSnapshot.annualInterestRate,
      decidedAt: new Date().toISOString(),
      decisionSource:
        parsed.data.decisionSource ?? RenewalDecisionSource.POLICY_APPLIED,
    };

    const { error: decisionError } = await supabase.rpc(
      SAVINGS_RPC.RECORD_RENEWAL_DECISION,
      {
        p_cycle_id: parsed.data.cycleId,
        p_renewal_decision: decision,
        p_revert_one_time: priorPolicy === RenewalPolicy.ONE_TIME_RENEWAL,
      },
    );
    if (
      decisionError &&
      classifySavingsRpcError(decisionError) ===
        PRODUCT_ACTION_ERROR_CODE.UNKNOWN
    ) {
      logSavingsFailure(decisionError, SAVINGS_RPC.RECORD_RENEWAL_DECISION, {
        householdId: gate.householdId,
        cycleId: parsed.data.cycleId,
      });
    }

    if (
      parsed.data.renewalPolicyAfter &&
      priorPolicy !== RenewalPolicy.ONE_TIME_RENEWAL
    ) {
      const { error: policyError } = await supabase
        .from("savings")
        .update({
          renewal_policy: parsed.data.renewalPolicyAfter,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.savingId);
      if (
        policyError &&
        classifySavingsRpcError(policyError) ===
          PRODUCT_ACTION_ERROR_CODE.UNKNOWN
      ) {
        logSavingsFailure(policyError, SAVINGS_RPC.RENEW, {
          householdId: gate.householdId,
          cycleId: parsed.data.cycleId,
          savingId: payload.savingId,
        });
      }
    }

    return {
      ok: true,
      savingId: payload.savingId,
      cycleId: payload.cycleId ?? "",
      principal: Number(payload.principal ?? 0),
    };
  } catch (error) {
    logSavingsFailure(error, SAVINGS_RPC.RENEW, {
      householdId: gate.householdId,
      cycleId: parsed.data.cycleId,
      packageId: parsed.data.packageId,
      settlementAccountId: parsed.data.settlementAccountId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
