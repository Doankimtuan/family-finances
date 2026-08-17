import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import { currentPeriodMonth } from "../ritual-period";
import { logPlanFailure } from "../plan-error";
import { PLAN_OPERATION } from "../plan-constants";
import { listJars } from "../queries/list-jars";
import { JarPlanKind } from "../jar-types";

export type EnsureJarPeriodRuleSnapshotsResult = Result<
  { written: number },
  ProductActionErrorCode
>;

/**
 * Lazy month-start jar rule snapshots for historical Monthly Review stability.
 * Idempotent: skips jars already snapshotted for the period.
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
    const listed = await listJars();
    if (!listed) {
      logPlanFailure(null, PLAN_OPERATION.ENSURE_JAR_PERIOD_SNAPSHOTS, {
        householdId: gate.householdId,
        periodMonth,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    const jars = [...listed.active, ...listed.paused, ...listed.archived];
    if (jars.length === 0) return { ok: true, written: 0 };

    const supabase = await createSupabaseServerClient();
    const { data: existing, error: existingError } = await supabase
      .from("jar_period_rule_snapshots")
      .select("jar_id")
      .eq("household_id", gate.householdId)
      .eq("period_month", periodMonth);
    if (existingError) {
      logPlanFailure(
        existingError,
        PLAN_OPERATION.ENSURE_JAR_PERIOD_SNAPSHOTS,
        {
          householdId: gate.householdId,
          periodMonth,
        },
      );
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    const existingIds = new Set(
      (existing ?? []).flatMap((row) =>
        typeof row.jar_id === "string" ? [row.jar_id] : [],
      ),
    );

    const rows = jars
      .filter((jar) => !existingIds.has(jar.id) && jar.plan)
      .map((jar) => ({
        household_id: gate.householdId,
        jar_id: jar.id,
        period_month: periodMonth,
        jar_name: jar.name,
        plan_kind: jar.plan?.kind ?? JarPlanKind.FIXED,
        percent_bps: jar.plan?.percentBps ?? 0,
        fixed_amount: jar.plan?.fixedAmount ?? 0,
        rollover_mode: jar.rolloverMode,
      }));

    if (rows.length === 0) return { ok: true, written: 0 };

    const { error } = await supabase
      .from("jar_period_rule_snapshots")
      .insert(rows);
    if (error) {
      logPlanFailure(error, PLAN_OPERATION.ENSURE_JAR_PERIOD_SNAPSHOTS, {
        householdId: gate.householdId,
        periodMonth,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, written: rows.length };
  } catch (error) {
    logPlanFailure(error, PLAN_OPERATION.ENSURE_JAR_PERIOD_SNAPSHOTS, {
      householdId: gate.householdId,
      periodMonth,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
