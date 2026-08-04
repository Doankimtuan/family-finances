import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { getHouseholdPolicies } from "@/modules/tenancy/application/get-household-policies";
import { assertPlanPeriodUnlocked } from "../assert-plan-unlocked";
import {
  PLAN_ACTION_ERROR_CODE,
  PLAN_MOVEMENT_LEDGER_IMPACT,
  type PlanActionErrorCode,
} from "../plan-constants";
import {
  isCapacityMoveBlocked,
  isZeroLedgerImpact,
  shouldShowOverspendWarning,
} from "../plan-movement-policy";
import {
  reallocateJarCapacityInputSchema,
  type ReallocateJarCapacityInput,
} from "./reallocate-jar-capacity.schema";

export {
  reallocateJarCapacityInputSchema,
  type ReallocateJarCapacityInput,
} from "./reallocate-jar-capacity.schema";

export type ReallocateJarCapacityErrorCode =
  ProductActionErrorCode | PlanActionErrorCode;

export type ReallocateJarCapacityResult =
  | {
      ok: true;
      planMovementId: string;
      sourceJarId: string;
      targetJarId: string;
      amount: number;
      isEmergency: boolean;
      inboxItemId: string | null;
      partnerNotifiedCount: number;
      ledgerTransactionsCreated: number;
      ledgerImpact: number;
    }
  | { ok: false; code: ReallocateJarCapacityErrorCode };

/**
 * Move virtual jar capacity with $0.00 ledger impact (BR-01 / AC-JAR-01).
 * EmergencyDeclaration bypasses BR-07 warn and notifies partners (BR-13).
 * OverspendPolicy.BLOCK enforces capacity floor (BR-06).
 */
export async function reallocateJarCapacity(
  raw: ReallocateJarCapacityInput,
): Promise<ReallocateJarCapacityResult> {
  const parsed = reallocateJarCapacityInputSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message;
    if (issue === PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED) {
      return {
        ok: false,
        code: PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED,
      };
    }
    if (issue === PLAN_ACTION_ERROR_CODE.SAME_JAR) {
      return { ok: false, code: PLAN_ACTION_ERROR_CODE.SAME_JAR };
    }
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  const lock = await assertPlanPeriodUnlocked(gate.householdId);
  if (!lock.ok) {
    return { ok: false, code: lock.code };
  }

  const policies = await getHouseholdPolicies();
  if (
    policies &&
    shouldShowOverspendWarning({
      isEmergency: parsed.data.isEmergency,
      overspendPolicy: policies.overspendPolicy,
    }) &&
    !parsed.data.warningAcknowledged
  ) {
    return { ok: false, code: PLAN_ACTION_ERROR_CODE.WARNING_REQUIRED };
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (policies) {
      const { data: sourceJar, error: jarError } = await supabase
        .from("jars")
        .select("capacity_delta")
        .eq("id", parsed.data.sourceJarId)
        .eq("household_id", gate.householdId)
        .maybeSingle();

      if (jarError || !sourceJar) {
        return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
      }

      if (
        isCapacityMoveBlocked({
          overspendPolicy: policies.overspendPolicy,
          sourceCapacityDelta: Number(sourceJar.capacity_delta) || 0,
          amount: parsed.data.amount,
        })
      ) {
        return { ok: false, code: PLAN_ACTION_ERROR_CODE.CAPACITY_BLOCKED };
      }
    }

    const { data, error } = await supabase.rpc("reallocate_jar_capacity", {
      p_source_jar_id: parsed.data.sourceJarId,
      p_target_jar_id: parsed.data.targetJarId,
      p_amount: parsed.data.amount,
      p_is_emergency: parsed.data.isEmergency,
      p_intent_note: parsed.data.intentNote ?? null,
    });

    if (error || !data || typeof data !== "object") {
      const message = (error?.message ?? "").toLowerCase();
      if (message.includes("intent note")) {
        return {
          ok: false,
          code: PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED,
        };
      }
      if (
        message.includes("err_capacity_blocked") ||
        message.includes("capacity")
      ) {
        return { ok: false, code: PLAN_ACTION_ERROR_CODE.CAPACITY_BLOCKED };
      }
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as {
      plan_movement_id?: string;
      source_jar_id?: string;
      target_jar_id?: string;
      amount?: number;
      is_emergency?: boolean;
      inbox_item_id?: string | null;
      partner_notified_count?: number;
      ledger_transactions_created?: number;
      ledger_impact?: number;
    };

    if (!payload.plan_movement_id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const ledgerTransactionsCreated = Number(
      payload.ledger_transactions_created ?? 0,
    );
    const ledgerImpact = Number(
      payload.ledger_impact ?? PLAN_MOVEMENT_LEDGER_IMPACT,
    );

    if (
      !isZeroLedgerImpact({
        ledgerTransactionsCreated,
        ledgerImpact,
      })
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      planMovementId: payload.plan_movement_id,
      sourceJarId: payload.source_jar_id ?? parsed.data.sourceJarId,
      targetJarId: payload.target_jar_id ?? parsed.data.targetJarId,
      amount: Number(payload.amount ?? parsed.data.amount),
      isEmergency: Boolean(payload.is_emergency),
      inboxItemId: payload.inbox_item_id ?? null,
      partnerNotifiedCount: Number(payload.partner_notified_count ?? 0),
      ledgerTransactionsCreated,
      ledgerImpact,
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
