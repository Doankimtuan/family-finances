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
  JarKind,
  JarPlanKind,
  JAR_KIND_VALUES,
  type JarKind as JarKindValue,
} from "../plan-constants";

export const createJarInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  kind: z.enum(JAR_KIND_VALUES).default(JarKind.SPENDING),
});

export type CreateJarInput = z.infer<typeof createJarInputSchema>;

export type CreateJarResult =
  { ok: true; jarId: string } | { ok: false; code: ProductActionErrorCode };

/**
 * Create an Active jar (allocation target). Intention only — no ledger balance.
 */
export async function createJar(raw: CreateJarInput): Promise<CreateJarResult> {
  const parsed = createJarInputSchema.safeParse(raw);
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

  try {
    const supabase = await createSupabaseServerClient();
    const { data: maxRow } = await supabase
      .from("jars")
      .select("sort_order")
      .eq("household_id", gate.householdId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = (maxRow?.sort_order ?? 0) + 1;

    const { data, error } = await supabase
      .from("jars")
      .insert({
        household_id: gate.householdId,
        name: parsed.data.name,
        kind: parsed.data.kind satisfies JarKindValue,
        sort_order: sortOrder,
        is_archived: false,
        is_paused: false,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    await supabase.from("jar_plans").insert({
      household_id: gate.householdId,
      jar_id: data.id,
      plan_kind: JarPlanKind.PERCENT,
      percent_bps: 0,
      fixed_amount: 0,
    });

    return { ok: true, jarId: data.id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
