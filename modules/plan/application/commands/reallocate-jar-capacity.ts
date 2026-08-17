import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import type { Result } from "@/modules/shared-kernel/application/result";
import { assertPlanPeriodUnlocked } from "../assert-plan-unlocked";
import {
  PLAN_ACTION_ERROR_CODE,
  PLAN_MOVEMENT_LEDGER_IMPACT,
  PLAN_OPERATION,
  PLAN_REALLOCATION_LEGACY_ERROR_MARKERS,
  type PlanActionErrorCode,
} from "../plan-constants";
import { isZeroLedgerImpact } from "../plan-movement-policy";
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

type ReallocateJarCapacitySuccess = {
  planMovementId: string;
  sourceJarId: string;
  targetJarId: string;
  amount: number;
  isEmergency: boolean;
  inboxItemId: string | null;
  partnerNotifiedCount: number;
  ledgerTransactionsCreated: number;
  ledgerImpact: number;
};

export type ReallocateJarCapacityResult = Result<
  ReallocateJarCapacitySuccess,
  ReallocateJarCapacityErrorCode
>;

type ReallocateJarCapacityRpcPayload = Record<string, unknown> & {
  plan_movement_id: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isReallocateJarCapacityRpcPayload(
  value: unknown,
): value is ReallocateJarCapacityRpcPayload {
  return isRecord(value) && typeof value.plan_movement_id === "string";
}

const STRUCTURED_REALLOCATION_ERROR_CODES: ReadonlySet<string> = new Set([
  PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
  PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED,
  PLAN_ACTION_ERROR_CODE.CAPACITY_BLOCKED,
  PLAN_ACTION_ERROR_CODE.SAME_JAR,
]);

function stringOrFallback(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isReallocateJarCapacityErrorCode(
  value: string,
): value is ReallocateJarCapacityErrorCode {
  return STRUCTURED_REALLOCATION_ERROR_CODES.has(value);
}

/**
 * Compatibility boundary for the current RPC. Prefer structured `code`,
 * `details`, or `hint` values; text matching stays here until the RPC exposes
 * stable domain metadata and must not spread to callers.
 */
export function classifyLegacyReallocationRpcError(
  error: unknown,
): ReallocateJarCapacityErrorCode {
  if (!isRecord(error) || typeof error.message !== "string") {
    return PRODUCT_ACTION_ERROR_CODE.UNKNOWN;
  }

  const message = error.message.toLowerCase();
  if (
    PLAN_REALLOCATION_LEGACY_ERROR_MARKERS.EMERGENCY_NOTE_REQUIRED.some(
      (marker) => message.includes(marker),
    )
  ) {
    return PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED;
  }
  if (
    PLAN_REALLOCATION_LEGACY_ERROR_MARKERS.CAPACITY_BLOCKED.some((marker) =>
      message.includes(marker),
    )
  ) {
    return PLAN_ACTION_ERROR_CODE.CAPACITY_BLOCKED;
  }
  if (
    PLAN_REALLOCATION_LEGACY_ERROR_MARKERS.SAME_JAR.some((marker) =>
      message.includes(marker),
    )
  ) {
    return PLAN_ACTION_ERROR_CODE.SAME_JAR;
  }
  return PRODUCT_ACTION_ERROR_CODE.UNKNOWN;
}

export function classifyReallocationRpcError(
  error: unknown,
): ReallocateJarCapacityErrorCode {
  if (isRecord(error)) {
    for (const field of [error.code, error.details, error.hint]) {
      if (
        typeof field === "string" &&
        isReallocateJarCapacityErrorCode(field)
      ) {
        return field;
      }
    }
  }

  return classifyLegacyReallocationRpcError(error);
}

function logReallocationFailure(
  error: unknown,
  context: {
    householdId: string;
    sourceJarId: string;
    targetJarId: string;
    responseInvalid?: boolean;
  },
): void {
  logActionFailure({
    operation: PLAN_OPERATION.REALLOCATE_JAR_CAPACITY,
    error,
    context,
  });
}

/**
 * Reallocate a period-scoped budget envelope. This is not a Money transfer.
 * The database RPC validates the current period, source availability, tenancy,
 * and writes both signed adjustments plus the audit movement atomically.
 */
export async function reallocateJarCapacity(
  raw: ReallocateJarCapacityInput,
): Promise<ReallocateJarCapacityResult> {
  const parsed = reallocateJarCapacityInputSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message;
    if (issue === PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED)
      return {
        ok: false,
        code: PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED,
      };
    if (issue === PLAN_ACTION_ERROR_CODE.SAME_JAR)
      return { ok: false, code: PLAN_ACTION_ERROR_CODE.SAME_JAR };
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok)
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
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
    if (error) {
      const code = classifyReallocationRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logReallocationFailure(error, {
          householdId: gate.householdId,
          sourceJarId: parsed.data.sourceJarId,
          targetJarId: parsed.data.targetJarId,
        });
      }
      return { ok: false, code };
    }

    if (!isReallocateJarCapacityRpcPayload(data)) {
      logReallocationFailure(null, {
        householdId: gate.householdId,
        sourceJarId: parsed.data.sourceJarId,
        targetJarId: parsed.data.targetJarId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    const payload = data;
    const ledgerTransactionsCreated = Number(
      payload.ledger_transactions_created ?? 0,
    );
    const ledgerImpact = Number(
      payload.ledger_impact ?? PLAN_MOVEMENT_LEDGER_IMPACT,
    );
    if (!isZeroLedgerImpact({ ledgerTransactionsCreated, ledgerImpact })) {
      logReallocationFailure(null, {
        householdId: gate.householdId,
        sourceJarId: parsed.data.sourceJarId,
        targetJarId: parsed.data.targetJarId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return {
      ok: true,
      planMovementId: payload.plan_movement_id,
      sourceJarId: stringOrFallback(
        payload.source_jar_id,
        parsed.data.sourceJarId,
      ),
      targetJarId: stringOrFallback(
        payload.target_jar_id,
        parsed.data.targetJarId,
      ),
      amount: Number(payload.amount ?? parsed.data.amount),
      isEmergency: Boolean(payload.is_emergency),
      inboxItemId: nullableString(payload.inbox_item_id),
      partnerNotifiedCount: Number(payload.partner_notified_count ?? 0),
      ledgerTransactionsCreated,
      ledgerImpact,
    };
  } catch (error) {
    logReallocationFailure(error, {
      householdId: gate.householdId,
      sourceJarId: parsed.data.sourceJarId,
      targetJarId: parsed.data.targetJarId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

/** PLAN 05 domain name; the legacy capacity name remains an API compatibility alias. */
export const reallocateJarBudget = reallocateJarCapacity;
