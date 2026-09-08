import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import { SUPABASE_POSTGRES_ERROR_CODE } from "@/modules/tenancy/application/tenancy-constants";
import { currentPeriodMonth } from "../ritual-period";
import { logPlanFailure } from "../plan-error";
import { PLAN_OPERATION } from "../plan-constants";
import { collectCurrentPeriodSnapshotInserts } from "../queries/get-current-jar-budgets";

export type EnsureJarPeriodRuleSnapshotsResult = Result<
  { written: number },
  ProductActionErrorCode
>;

const JAR_PERIOD_SNAPSHOT_CONFLICT_TARGET = "jar_id,period_month";

function isUniqueViolation(error: { code?: string } | null): boolean {
  return (
    (error?.code ?? "").toLowerCase() ===
    SUPABASE_POSTGRES_ERROR_CODE.UNIQUE_VIOLATION
  );
}

/**
 * Month-start jar rule snapshots for historical Monthly Review stability.
 * Idempotent: unique (jar_id, period_month) wins; concurrent writers do not
 * duplicate. GET paths must not call this.
 */
export async function ensureJarPeriodRuleSnapshots(
  periodMonth = currentPeriodMonth(),
): Promise<EnsureJarPeriodRuleSnapshotsResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const collected = await collectCurrentPeriodSnapshotInserts();
    if (!collected) {
      logPlanFailure(null, PLAN_OPERATION.ENSURE_JAR_PERIOD_SNAPSHOTS, {
        householdId: gate.householdId,
        periodMonth,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (collected.periodMonth !== periodMonth) {
      return { ok: true, written: 0 };
    }
    if (collected.rows.length === 0) return { ok: true, written: 0 };

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("jar_period_rule_snapshots")
      .upsert(collected.rows, {
        onConflict: JAR_PERIOD_SNAPSHOT_CONFLICT_TARGET,
        ignoreDuplicates: true,
      });
    if (error && !isUniqueViolation(error)) {
      logPlanFailure(error, PLAN_OPERATION.ENSURE_JAR_PERIOD_SNAPSHOTS, {
        householdId: gate.householdId,
        periodMonth,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, written: collected.rows.length };
  } catch (error) {
    logPlanFailure(error, PLAN_OPERATION.ENSURE_JAR_PERIOD_SNAPSHOTS, {
      householdId: gate.householdId,
      periodMonth,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
