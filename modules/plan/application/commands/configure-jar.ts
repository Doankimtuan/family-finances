import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { TransactionDirection } from "@/modules/ledger/application/ledger-constants";
import type { Result } from "@/modules/shared-kernel/application/result";
import { assertPlanPeriodUnlocked } from "../assert-plan-unlocked";
import { logPlanFailure } from "../plan-error";
import { PLAN_OPERATION } from "../plan-constants";
import { percentageToBasisPoints } from "@/shared/utils/percentage";
import {
  JarKind,
  JarPlanKind,
  JarRolloverMode,
  JarState,
  type JarKind as JarKindValue,
} from "../plan-constants";
import {
  jarConfigurationInputSchema,
  type JarConfigurationInput,
} from "./configure-jar.schema";
import { ensureJarPeriodRuleSnapshots } from "./ensure-jar-period-snapshots";

/** One authoritative payload for Create Jar and Edit Jar V2. */
export { jarConfigurationInputSchema };
export type { JarConfigurationInput };

export type ConfigureJarResult = Result<
  { jarId: string },
  ProductActionErrorCode
>;

type CategoryRow = {
  id: string;
  kind: string;
  jar_id: string | null;
};

type CategorySelectionResult =
  | { ok: true; categories: CategoryRow[] }
  | { ok: false; code: ProductActionErrorCode };

type CategoryMappingResult =
  { ok: true } | { ok: false; code: ProductActionErrorCode };

function categoryKindForJar(kind: JarKindValue): string {
  return kind === JarKind.INCOME
    ? TransactionDirection.INCOME
    : TransactionDirection.EXPENSE;
}

function isCategoryRow(value: unknown): value is CategoryRow {
  if (
    typeof value !== "object" ||
    value === null ||
    !Object.prototype.hasOwnProperty.call(value, "id") ||
    !Object.prototype.hasOwnProperty.call(value, "kind") ||
    !Object.prototype.hasOwnProperty.call(value, "jar_id")
  ) {
    return false;
  }
  const row = value as {
    id: unknown;
    kind: unknown;
    jar_id: unknown;
  };
  return (
    typeof row.id === "string" &&
    typeof row.kind === "string" &&
    (row.jar_id === null || typeof row.jar_id === "string")
  );
}

function planValues(input: JarConfigurationInput) {
  return {
    plan_kind: input.planKind,
    percent_bps:
      input.planKind === JarPlanKind.PERCENT
        ? percentageToBasisPoints(input.percent ?? 0)
        : 0,
    fixed_amount:
      input.planKind === JarPlanKind.FIXED ? (input.fixedAmount ?? 0) : 0,
  };
}

async function loadHouseholdCategories(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  householdId: string,
  categoryIds: string[],
  operation: typeof PLAN_OPERATION.CONFIGURE_JAR,
): Promise<CategorySelectionResult> {
  if (categoryIds.length === 0) return { ok: true, categories: [] };
  const { data, error } = await supabase
    .from("categories")
    .select("id, kind, jar_id")
    .eq("household_id", householdId)
    .eq("is_system", false)
    .eq("is_active", true)
    .in("id", categoryIds);
  if (error) {
    logPlanFailure(error, operation, { householdId });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
  const rows = data ?? [];
  if (rows.length !== new Set(categoryIds).size || !rows.every(isCategoryRow)) {
    if (rows.length === new Set(categoryIds).size) {
      logPlanFailure(null, operation, {
        householdId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  return { ok: true, categories: rows };
}

async function validateCategorySelection(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  householdId: string,
  input: JarConfigurationInput,
  currentJarId?: string,
): Promise<CategorySelectionResult> {
  const result = await loadHouseholdCategories(
    supabase,
    householdId,
    input.categoryIds,
    PLAN_OPERATION.CONFIGURE_JAR,
  );
  if (!result.ok) return result;
  const categories = result.categories;

  const expectedKind = categoryKindForJar(input.kind);
  if (categories.some((category) => category.kind !== expectedKind)) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const conflicts = categories.filter(
    (category) => category.jar_id && category.jar_id !== currentJarId,
  );
  const confirmed = new Set(input.confirmReassignCategoryIds);
  if (conflicts.some((category) => !confirmed.has(category.id))) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  return { ok: true, categories };
}

async function applyCategorySelection(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  householdId: string,
  jarId: string,
  categoryIds: string[],
  currentCategoryIds: string[],
  removedCategoryTargetJarId?: string,
): Promise<CategoryMappingResult> {
  const removedIds = currentCategoryIds.filter(
    (categoryId) => !categoryIds.includes(categoryId),
  );

  if (removedIds.length > 0) {
    if (!removedCategoryTargetJarId || removedCategoryTargetJarId === jarId) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    const { data: targetJar, error: targetJarError } = await supabase
      .from("jars")
      .select("id")
      .eq("id", removedCategoryTargetJarId)
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .eq("is_paused", false)
      .maybeSingle();
    if (targetJarError) {
      logPlanFailure(targetJarError, PLAN_OPERATION.CONFIGURE_JAR, {
        householdId,
        jarId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (!targetJar) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { error: moveError } = await supabase
      .from("categories")
      .update({
        jar_id: removedCategoryTargetJarId,
        updated_at: new Date().toISOString(),
      })
      .eq("household_id", householdId)
      .eq("is_system", false)
      .in("id", removedIds);
    if (moveError) {
      logPlanFailure(moveError, PLAN_OPERATION.CONFIGURE_JAR, {
        householdId,
        jarId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
  }

  if (categoryIds.length > 0) {
    const { error: assignError } = await supabase
      .from("categories")
      .update({ jar_id: jarId, updated_at: new Date().toISOString() })
      .eq("household_id", householdId)
      .eq("is_system", false)
      .in("id", categoryIds);
    if (assignError) {
      logPlanFailure(assignError, PLAN_OPERATION.CONFIGURE_JAR, {
        householdId,
        jarId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
  }

  return { ok: true };
}

async function removeCreatedJar(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  householdId: string,
  jarId: string,
): Promise<void> {
  const { error: planCleanupError } = await supabase
    .from("jar_plans")
    .delete()
    .eq("jar_id", jarId)
    .eq("household_id", householdId);
  if (planCleanupError) {
    logPlanFailure(planCleanupError, PLAN_OPERATION.CONFIGURE_JAR, {
      householdId,
      jarId,
    });
  }

  const { error: jarCleanupError } = await supabase
    .from("jars")
    .delete()
    .eq("id", jarId)
    .eq("household_id", householdId);
  if (jarCleanupError) {
    logPlanFailure(jarCleanupError, PLAN_OPERATION.CONFIGURE_JAR, {
      householdId,
      jarId,
    });
  }
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
  if (!parsed.success)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };

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
    if (!categories.ok) return categories;

    const { data: maxRow, error: maxRowError } = await supabase
      .from("jars")
      .select("sort_order")
      .eq("household_id", gate.householdId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (maxRowError) {
      logPlanFailure(maxRowError, PLAN_OPERATION.CONFIGURE_JAR, {
        householdId: gate.householdId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
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
    if (jarError) {
      logPlanFailure(jarError, PLAN_OPERATION.CONFIGURE_JAR, {
        householdId: gate.householdId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (!jar?.id) {
      logPlanFailure(null, PLAN_OPERATION.CONFIGURE_JAR, {
        householdId: gate.householdId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const { error: planError } = await supabase.from("jar_plans").insert({
      household_id: gate.householdId,
      jar_id: jar.id,
      ...planValues(parsed.data),
    });
    if (planError) {
      logPlanFailure(planError, PLAN_OPERATION.CONFIGURE_JAR, {
        householdId: gate.householdId,
        jarId: jar.id,
      });
      await removeCreatedJar(supabase, gate.householdId, jar.id);
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const mapped = await applyCategorySelection(
      supabase,
      gate.householdId,
      jar.id,
      parsed.data.categoryIds,
      [],
    );
    if (!mapped.ok) {
      await removeCreatedJar(supabase, gate.householdId, jar.id);
      return mapped;
    }

    await ensureJarPeriodRuleSnapshots();
    return { ok: true, jarId: jar.id };
  } catch (error) {
    logPlanFailure(error, PLAN_OPERATION.CONFIGURE_JAR, {
      householdId: gate.householdId,
    });
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
    if (jarError) {
      logPlanFailure(jarError, PLAN_OPERATION.CONFIGURE_JAR, {
        householdId: gate.householdId,
        jarId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (!jar) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };

    const { data: currentCategories, error: currentCategoryError } =
      await supabase
        .from("categories")
        .select("id")
        .eq("household_id", gate.householdId)
        .eq("is_system", false)
        .eq("jar_id", jarId);
    if (currentCategoryError) {
      logPlanFailure(currentCategoryError, PLAN_OPERATION.CONFIGURE_JAR, {
        householdId: gate.householdId,
        jarId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const categories = await validateCategorySelection(
      supabase,
      gate.householdId,
      parsed.data,
      jarId,
    );
    if (!categories.ok) return categories;

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
    if (updateError) {
      logPlanFailure(updateError, PLAN_OPERATION.CONFIGURE_JAR, {
        householdId: gate.householdId,
        jarId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const { error: planError } = await supabase.from("jar_plans").upsert(
      {
        household_id: gate.householdId,
        jar_id: jarId,
        ...planValues(parsed.data),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "jar_id" },
    );
    if (planError) {
      logPlanFailure(planError, PLAN_OPERATION.CONFIGURE_JAR, {
        householdId: gate.householdId,
        jarId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const mapped = await applyCategorySelection(
      supabase,
      gate.householdId,
      jarId,
      parsed.data.categoryIds,
      (currentCategories ?? []).map((category) => category.id),
      parsed.data.removedCategoryTargetJarId,
    );
    if (!mapped.ok) return mapped;

    await ensureJarPeriodRuleSnapshots();
    return { ok: true, jarId };
  } catch (error) {
    logPlanFailure(error, PLAN_OPERATION.CONFIGURE_JAR, {
      householdId: gate.householdId,
      jarId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const configureJarInputSchema = jarConfigurationInputSchema;
export type ConfigureJarInput = JarConfigurationInput;
export type ConfigureJarResultCode = ProductActionErrorCode;
export { JarState };
