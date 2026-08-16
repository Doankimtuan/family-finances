import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { TransactionDirection } from "@/modules/ledger/application/ledger-constants";
import { assertPlanPeriodUnlocked } from "../assert-plan-unlocked";
import {
  JarKind,
  JarPlanKind,
  JarRolloverMode,
  JarState,
  JAR_KIND_VALUES,
  JAR_PLAN_KIND_VALUES,
  JAR_ROLLOVER_MODE_VALUES,
  type JarKind as JarKindValue,
} from "../plan-constants";

const categoryIdsSchema = z.array(z.string().uuid()).max(100).default([]);

/** One authoritative payload for Create Jar and Edit Jar V2. */
export const jarConfigurationInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    kind: z.enum(JAR_KIND_VALUES).default(JarKind.SPENDING),
    enabled: z.boolean().default(true),
    planKind: z.enum(JAR_PLAN_KIND_VALUES).default(JarPlanKind.FIXED),
    /** Whole percent 0–100; stored as basis points. */
    percent: z.number().finite().gt(0).lte(100).optional(),
    fixedAmount: z.number().finite().int().gt(0).optional(),
    rolloverMode: z.enum(JAR_ROLLOVER_MODE_VALUES).optional(),
    categoryIds: categoryIdsSchema,
    /** Required when selected categories already belong to another Jar. */
    confirmReassignCategoryIds: categoryIdsSchema,
    /** Edit-only destination for categories removed from the current Jar. */
    removedCategoryTargetJarId: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.planKind === JarPlanKind.PERCENT && value.percent === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "percent_required",
        path: ["percent"],
      });
    }
    if (value.planKind === JarPlanKind.FIXED && value.fixedAmount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fixed_required",
        path: ["fixedAmount"],
      });
    }
    const categoryIds = new Set(value.categoryIds);
    for (const categoryId of value.confirmReassignCategoryIds) {
      if (!categoryIds.has(categoryId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "reassign_category_not_selected",
          path: ["confirmReassignCategoryIds"],
        });
        break;
      }
    }
  });

export type JarConfigurationInput = z.infer<typeof jarConfigurationInputSchema>;

export type ConfigureJarResult =
  | { ok: true; jarId: string }
  | { ok: false; code: ProductActionErrorCode };

type CategoryRow = {
  id: string;
  kind: string;
  jar_id: string | null;
};

function categoryKindForJar(kind: JarKindValue): string {
  return kind === JarKind.INCOME
    ? TransactionDirection.INCOME
    : TransactionDirection.EXPENSE;
}

function percentBps(value: number | undefined): number {
  return Math.round((value ?? 0) * 100);
}

function planValues(input: JarConfigurationInput) {
  return {
    plan_kind: input.planKind,
    percent_bps:
      input.planKind === JarPlanKind.PERCENT ? percentBps(input.percent) : 0,
    fixed_amount:
      input.planKind === JarPlanKind.FIXED ? (input.fixedAmount ?? 0) : 0,
  };
}

async function loadHouseholdCategories(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  householdId: string,
  categoryIds: string[],
): Promise<CategoryRow[] | null> {
  if (categoryIds.length === 0) return [];
  const { data, error } = await supabase
    .from("categories")
    .select("id, kind, jar_id")
    .eq("household_id", householdId)
    .eq("is_system", false)
    .eq("is_active", true)
    .in("id", categoryIds);
  if (error || (data ?? []).length !== new Set(categoryIds).size) return null;
  return (data ?? []) as CategoryRow[];
}

async function validateCategorySelection(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  householdId: string,
  input: JarConfigurationInput,
  currentJarId?: string,
): Promise<CategoryRow[] | null> {
  const categories = await loadHouseholdCategories(
    supabase,
    householdId,
    input.categoryIds,
  );
  if (!categories) return null;

  const expectedKind = categoryKindForJar(input.kind);
  if (categories.some((category) => category.kind !== expectedKind)) return null;

  const conflicts = categories.filter(
    (category) => category.jar_id && category.jar_id !== currentJarId,
  );
  const confirmed = new Set(input.confirmReassignCategoryIds);
  if (conflicts.some((category) => !confirmed.has(category.id))) return null;

  return categories;
}

async function applyCategorySelection(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  householdId: string,
  jarId: string,
  categoryIds: string[],
  currentCategoryIds: string[],
  removedCategoryTargetJarId?: string,
): Promise<boolean> {
  const removedIds = currentCategoryIds.filter(
    (categoryId) => !categoryIds.includes(categoryId),
  );

  if (removedIds.length > 0) {
    if (!removedCategoryTargetJarId || removedCategoryTargetJarId === jarId) {
      return false;
    }
    const { data: targetJar, error: targetJarError } = await supabase
      .from("jars")
      .select("id")
      .eq("id", removedCategoryTargetJarId)
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .eq("is_paused", false)
      .maybeSingle();
    if (targetJarError || !targetJar) return false;

    const { error: moveError } = await supabase
      .from("categories")
      .update({ jar_id: removedCategoryTargetJarId, updated_at: new Date().toISOString() })
      .eq("household_id", householdId)
      .eq("is_system", false)
      .in("id", removedIds);
    if (moveError) return false;
  }

  if (categoryIds.length > 0) {
    const { error: assignError } = await supabase
      .from("categories")
      .update({ jar_id: jarId, updated_at: new Date().toISOString() })
      .eq("household_id", householdId)
      .eq("is_system", false)
      .in("id", categoryIds);
    if (assignError) return false;
  }

  return true;
}

/**
 * Create a fully configured budget envelope. Category mappings affect only
 * future transaction capture defaults; historical transaction.jar_id values
 * are never updated here.
 */
export async function createJar(
  raw: JarConfigurationInput,
): Promise<ConfigureJarResult> {
  const parsed = jarConfigurationInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  }
  const lock = await assertPlanPeriodUnlocked(gate.householdId);
  if (!lock.ok) return { ok: false, code: lock.code };

  try {
    const supabase = await createSupabaseServerClient();
    const categories = await validateCategorySelection(
      supabase,
      gate.householdId,
      parsed.data,
    );
    if (!categories) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };

    const { data: maxRow } = await supabase
      .from("jars")
      .select("sort_order")
      .eq("household_id", gate.householdId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = (maxRow?.sort_order ?? 0) + 1;

    const { data: jar, error: jarError } = await supabase
      .from("jars")
      .insert({
        household_id: gate.householdId,
        name: parsed.data.name,
        is_name_custom: true,
        kind: parsed.data.kind satisfies JarKindValue,
        sort_order: sortOrder,
        is_archived: false,
        is_paused: !parsed.data.enabled,
        rollover_mode: parsed.data.rolloverMode ?? JarRolloverMode.RESET,
      })
      .select("id")
      .single();
    if (jarError || !jar?.id) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };

    const { error: planError } = await supabase.from("jar_plans").insert({
      household_id: gate.householdId,
      jar_id: jar.id,
      ...planValues(parsed.data),
    });
    if (planError) {
      await supabase.from("jars").delete().eq("id", jar.id).eq("household_id", gate.householdId);
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const mapped = await applyCategorySelection(
      supabase,
      gate.householdId,
      jar.id,
      parsed.data.categoryIds,
      [],
    );
    if (!mapped) {
      await supabase.from("jar_plans").delete().eq("jar_id", jar.id).eq("household_id", gate.householdId);
      await supabase.from("jars").delete().eq("id", jar.id).eq("household_id", gate.householdId);
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, jarId: jar.id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

/** Update a Jar and its single authoritative plan mode in one application boundary. */
export async function updateJarConfiguration(
  jarId: string,
  raw: JarConfigurationInput,
): Promise<ConfigureJarResult> {
  const parsed = jarConfigurationInputSchema.safeParse(raw);
  if (!parsed.success || !z.string().uuid().safeParse(jarId).success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  }
  const lock = await assertPlanPeriodUnlocked(gate.householdId);
  if (!lock.ok) return { ok: false, code: lock.code };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: jar, error: jarError } = await supabase
      .from("jars")
      .select("id, kind, is_archived, is_paused")
      .eq("id", jarId)
      .eq("household_id", gate.householdId)
      .maybeSingle();
    if (jarError || !jar) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };

    const { data: currentCategories, error: currentCategoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("household_id", gate.householdId)
      .eq("is_system", false)
      .eq("jar_id", jarId);
    if (currentCategoryError) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };

    const categories = await validateCategorySelection(
      supabase,
      gate.householdId,
      parsed.data,
      jarId,
    );
    if (!categories) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };

    const isIncomeKindChange =
      (jar.kind === JarKind.INCOME) !== (parsed.data.kind === JarKind.INCOME);
    if (isIncomeKindChange && (currentCategories ?? []).length > 0) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { error: updateError } = await supabase
      .from("jars")
      .update({
        name: parsed.data.name,
        is_name_custom: true,
        kind: parsed.data.kind,
        is_paused: !parsed.data.enabled,
        is_archived: jar.is_archived,
        rollover_mode: parsed.data.rolloverMode ?? JarRolloverMode.RESET,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jarId)
      .eq("household_id", gate.householdId);
    if (updateError) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };

    const { error: planError } = await supabase.from("jar_plans").upsert(
      {
        household_id: gate.householdId,
        jar_id: jarId,
        ...planValues(parsed.data),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "jar_id" },
    );
    if (planError) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };

    const mapped = await applyCategorySelection(
      supabase,
      gate.householdId,
      jarId,
      parsed.data.categoryIds,
      (currentCategories ?? []).map((category) => category.id),
      parsed.data.removedCategoryTargetJarId,
    );
    if (!mapped) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };

    return { ok: true, jarId };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const configureJarInputSchema = jarConfigurationInputSchema;
export type ConfigureJarInput = JarConfigurationInput;
export type ConfigureJarResultCode = ProductActionErrorCode;
export { JarState };
