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
} from "../savings-constants";
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

    const { data: before } = await supabase
      .from("saving_cycles")
      .select(
        "id, locked_rate, package_snapshot, savings!inner(id, renewal_policy, household_id)",
      )
      .eq("id", parsed.data.cycleId)
      .maybeSingle();

    const { data, error } = await supabase.rpc("settle_saving_cycle", {
      p_cycle_id: parsed.data.cycleId,
      p_settlement_account_id: parsed.data.settlementAccountId ?? null,
    });

    if (error) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as {
      ok?: boolean;
      savingId?: string;
      cycleId?: string;
      netAmount?: number;
    } | null;

    if (!payload?.ok || !payload.savingId) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const savingJoin = (before as any)?.savings;
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

    await supabase.rpc("record_saving_renewal_decision", {
      p_cycle_id: parsed.data.cycleId,
      p_renewal_decision: decision,
      p_revert_one_time: false,
    });

    return {
      ok: true,
      savingId: payload.savingId,
      cycleId: payload.cycleId ?? parsed.data.cycleId,
      netAmount: Number(payload.netAmount ?? 0),
    };
  } catch {
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

    const { data: cycleRow } = await supabase
      .from("saving_cycles")
      .select(
        "id, saving_id, package_snapshot, locked_rate, status, savings!inner(household_id, product_snapshot, provider_id, product_name, renewal_policy)",
      )
      .eq("id", parsed.data.cycleId)
      .maybeSingle();

    if (!cycleRow || cycleRow.status !== CycleStatus.MATURED) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const savingJoin = (cycleRow as any).savings;
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
    const { data, error } = await supabase.rpc("rollover_saving_cycle", {
      p_cycle_id: parsed.data.cycleId,
      p_action: parsed.data.action,
      p_target_package_id: targetPackageId,
      p_settlement_account_id: parsed.data.settlementAccountId ?? null,
      p_cycle_start_date: null,
      p_cycle_end_date: null,
      p_idempotency_key: null,
    });

    if (error) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as {
      ok?: boolean;
      savingId?: string;
      cycleId?: string;
      principal?: number;
    } | null;

    if (!payload?.ok || !payload.savingId) {
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

    await supabase.rpc("record_saving_renewal_decision", {
      p_cycle_id: parsed.data.cycleId,
      p_renewal_decision: decision,
      p_revert_one_time: priorPolicy === RenewalPolicy.ONE_TIME_RENEWAL,
    });

    if (
      parsed.data.renewalPolicyAfter &&
      priorPolicy !== RenewalPolicy.ONE_TIME_RENEWAL
    ) {
      await supabase
        .from("savings")
        .update({
          renewal_policy: parsed.data.renewalPolicyAfter,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.savingId);
    }

    return {
      ok: true,
      savingId: payload.savingId,
      cycleId: payload.cycleId ?? "",
      principal: Number(payload.principal ?? 0),
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
