import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { assertPlanPeriodUnlocked } from "../assert-plan-unlocked";
import { PLAN_ACTION_ERROR_CODE, PLAN_MOVEMENT_LEDGER_IMPACT, type PlanActionErrorCode } from "../plan-constants";
import { isZeroLedgerImpact } from "../plan-movement-policy";
import {
  reallocateJarCapacityInputSchema,
  type ReallocateJarCapacityInput,
} from "./reallocate-jar-capacity.schema";

export { reallocateJarCapacityInputSchema, type ReallocateJarCapacityInput } from "./reallocate-jar-capacity.schema";

export type ReallocateJarCapacityErrorCode = ProductActionErrorCode | PlanActionErrorCode;

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
 * Reallocate a period-scoped budget envelope. This is not a Money transfer.
 * The database RPC validates the current period, source availability, tenancy,
 * and writes both signed adjustments plus the audit movement atomically.
 */
export async function reallocateJarCapacity(raw: ReallocateJarCapacityInput): Promise<ReallocateJarCapacityResult> {
  const parsed = reallocateJarCapacityInputSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message;
    if (issue === PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED) return { ok: false, code: PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED };
    if (issue === PLAN_ACTION_ERROR_CODE.SAME_JAR) return { ok: false, code: PLAN_ACTION_ERROR_CODE.SAME_JAR };
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  const lock = await assertPlanPeriodUnlocked(gate.householdId);
  if (!lock.ok) return { ok: false, code: lock.code };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("reallocate_jar_capacity", {
      p_source_jar_id: parsed.data.sourceJarId,
      p_target_jar_id: parsed.data.targetJarId,
      p_amount: parsed.data.amount,
      p_is_emergency: parsed.data.isEmergency,
      p_intent_note: parsed.data.intentNote ?? null,
    });
    if (error || !data || typeof data !== "object") {
      const message = (error?.message ?? "").toLowerCase();
      if (message.includes("intent note")) return { ok: false, code: PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED };
      if (message.includes("insufficient_reallocatable") || message.includes("capacity") || message.includes("snapshot required")) {
        return { ok: false, code: PLAN_ACTION_ERROR_CODE.CAPACITY_BLOCKED };
      }
      if (message.includes("distinct source") || message.includes("same")) return { ok: false, code: PLAN_ACTION_ERROR_CODE.SAME_JAR };
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    const payload = data as {
      plan_movement_id?: string;
      source_jar_id?: string;
      target_jar_id?: string;
      amount?: number | string;
      is_emergency?: boolean;
      inbox_item_id?: string | null;
      partner_notified_count?: number | string;
      ledger_transactions_created?: number | string;
      ledger_impact?: number | string;
    };
    if (!payload.plan_movement_id) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    const ledgerTransactionsCreated = Number(payload.ledger_transactions_created ?? 0);
    const ledgerImpact = Number(payload.ledger_impact ?? PLAN_MOVEMENT_LEDGER_IMPACT);
    if (!isZeroLedgerImpact({ ledgerTransactionsCreated, ledgerImpact })) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    return { ok: true,
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

/** PLAN 05 domain name; the legacy capacity name remains an API compatibility alias. */
export const reallocateJarBudget = reallocateJarCapacity;
