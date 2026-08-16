import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { assertPlanPeriodUnlocked } from "../assert-plan-unlocked";
import {
  JarPlanKind,
  JAR_PLAN_KIND_VALUES,
  JAR_ROLLOVER_MODE_VALUES,
  type JarPlanKind as JarPlanKindValue,
} from "../plan-constants";

export const upsertJarPlanInputSchema = z
  .object({
    jarId: z.string().uuid(),
    planKind: z.enum(JAR_PLAN_KIND_VALUES),
    /** Whole percent 0–100 when planKind=percent */
    percent: z.number().finite().min(0).max(100).optional(),
    fixedAmount: z.number().finite().int().min(0).optional(),
    rolloverMode: z.enum(JAR_ROLLOVER_MODE_VALUES).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.planKind === JarPlanKind.PERCENT && value.percent === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "percent_required",
        path: ["percent"],
      });
    }
    if (
      value.planKind === JarPlanKind.FIXED &&
      value.fixedAmount === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fixed_required",
        path: ["fixedAmount"],
      });
    }
  });

export type UpsertJarPlanInput = z.infer<typeof upsertJarPlanInputSchema>;

export type UpsertJarPlanResult =
  | { ok: true; planKind: JarPlanKindValue }
  | { ok: false; code: ProductActionErrorCode };

/**
 * Upsert intention plan for a jar (percent|fixed). Not a bank balance (BR-01).
 */
export async function upsertJarPlan(
  raw: UpsertJarPlanInput,
): Promise<UpsertJarPlanResult> {
  const parsed = upsertJarPlanInputSchema.safeParse(raw);
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

  const lock = await assertPlanPeriodUnlocked(gate.householdId);
  if (!lock.ok) {
    return { ok: false, code: lock.code };
  }

  const percentBps =
    parsed.data.planKind === JarPlanKind.PERCENT
      ? Math.round((parsed.data.percent ?? 0) * 100)
      : 0;
  const fixedAmount =
    parsed.data.planKind === JarPlanKind.FIXED
      ? (parsed.data.fixedAmount ?? 0)
      : 0;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: jar, error: jarError } = await supabase
      .from("jars")
      .select("id")
      .eq("id", parsed.data.jarId)
      .eq("household_id", gate.householdId)
      .maybeSingle();

    if (jarError || !jar) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { error } = await supabase.from("jar_plans").upsert(
      {
        household_id: gate.householdId,
        jar_id: parsed.data.jarId,
        plan_kind: parsed.data.planKind,
        percent_bps: percentBps,
        fixed_amount: fixedAmount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "jar_id" },
    );

    if (error) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    if (parsed.data.rolloverMode) {
      const { error: rolloverError } = await supabase
        .from("jars")
        .update({
          rollover_mode: parsed.data.rolloverMode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsed.data.jarId)
        .eq("household_id", gate.householdId);
      if (rolloverError) {
        return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
      }
    }

    return { ok: true, planKind: parsed.data.planKind };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
