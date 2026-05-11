"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  approveMonthClose,
  bulkUpsertCategoryRules,
  createJarEvent,
  createJarMovement,
  ensureJarPreset,
  slugifyJarName,
  previewMonthClose,
  resolveReviewToMovements,
  upsertCategoryRule,
} from "@/lib/jars/intent";
import { writeAuditEvent } from "@/lib/server/audit";
import {
  resolveActionContext,
  resolveActionContextOrThrow,
} from "@/lib/server/action-context";
import { fail, ok } from "@/lib/server/action-helpers";

import type { JarActionState } from "./action-types";

function revalidateJarPaths(jarId?: string | null) {
  revalidatePath("/jars");
  revalidatePath("/jars/review");
  revalidatePath("/jars/setup");
  revalidatePath("/dashboard");
  if (jarId) revalidatePath(`/jars/${jarId}`);
}

function withStatus(path: string, key: "success" | "error", message: string) {
  const url = new URL(path, "http://local");
  url.searchParams.set(key, message);
  return `${url.pathname}${url.search}`;
}

function getReturnTo(formData: FormData, fallback: string) {
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  return returnTo.length > 0 ? returnTo : fallback;
}

export async function bootstrapPresetJarsAction(formData: FormData): Promise<void> {
  const returnTo = getReturnTo(formData, "/jars");
  try {
    const { supabase, user, householdId } = await resolveActionContextOrThrow();
    await ensureJarPreset(supabase, householdId, user.id);
    await writeAuditEvent(supabase, {
      householdId,
      actorUserId: user.id,
      eventType: "jars.preset_bootstrapped",
      entityType: "jar",
      entityId: householdId,
    });
    revalidateJarPaths();
    redirect(withStatus(returnTo, "success", "Da khoi tao bo 6 hu mac dinh."));
  } catch (error) {
    redirect(
      withStatus(
        returnTo,
        "error",
        error instanceof Error
          ? error.message
          : "Khong the khoi tao bo hu mac dinh.",
      ),
    );
  }
}

export async function deleteIntentJarAction(formData: FormData): Promise<void> {
  const returnTo = getReturnTo(formData, "/jars/setup");
  try {
    const { supabase, householdId } = await resolveActionContextOrThrow();
    const jarId = String(formData.get("jarId") ?? "").trim();
    if (!jarId) {
      throw new Error("Thieu hu can xoa.");
    }

    const [balanceResult, movementResult, reviewResult] = await Promise.all([
      supabase
        .from("jar_current_balances")
        .select(
          "current_balance, held_in_cash, held_in_savings, held_in_investments, held_in_assets",
        )
        .eq("household_id", householdId)
        .eq("jar_id", jarId)
        .maybeSingle(),
      supabase
        .from("jar_movements")
        .select("id", { count: "exact", head: true })
        .eq("household_id", householdId)
        .eq("jar_id", jarId),
      supabase
        .from("jar_review_queue")
        .select("id, suggested_allocations, resolved_allocations")
        .eq("household_id", householdId)
        .eq("status", "pending"),
    ]);

    if (balanceResult.error) throw new Error(balanceResult.error.message);
    if (movementResult.error) throw new Error(movementResult.error.message);
    if (reviewResult.error) throw new Error(reviewResult.error.message);

    const balance = Number(balanceResult.data?.current_balance ?? 0);
    const holdings =
      Number(balanceResult.data?.held_in_cash ?? 0) +
      Number(balanceResult.data?.held_in_savings ?? 0) +
      Number(balanceResult.data?.held_in_investments ?? 0) +
      Number(balanceResult.data?.held_in_assets ?? 0);

    const hasLinkedReview = (reviewResult.data ?? []).some((review) => {
      const candidates = [review.suggested_allocations, review.resolved_allocations];
      return candidates.some((value) => {
        if (!Array.isArray(value)) return false;
        return value.some((item) => {
          if (!item || typeof item !== "object") return false;
          return (
            String(
              (item as { jarId?: unknown; jar_id?: unknown }).jarId ??
                (item as { jarId?: unknown; jar_id?: unknown }).jar_id ??
                "",
            ) === jarId
          );
        });
      });
    });

    if (
      balance > 0 ||
      holdings > 0 ||
      (movementResult.count ?? 0) > 0 ||
      hasLinkedReview
    ) {
      throw new Error("Khong the xoa hu da co so du hoac lich su movement.");
    }

    const deleteResult = await supabase
      .from("jars")
      .delete()
      .eq("household_id", householdId)
      .eq("id", jarId);

    if (deleteResult.error) throw new Error(deleteResult.error.message);

    revalidateJarPaths();
    redirect(withStatus(returnTo, "success", "Da xoa hu."));
  } catch (error) {
    redirect(
      withStatus(
        returnTo,
        "error",
        error instanceof Error ? error.message : "Khong the xoa hu.",
      ),
    );
  }
}

export async function createIntentJarAction(
  formData: FormData,
): Promise<JarActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const jarType = String(formData.get("jarType") ?? "custom").trim();
  const spendPolicy = String(formData.get("spendPolicy") ?? "flexible").trim();
  const color = String(formData.get("color") ?? "").trim() || null;
  const icon = String(formData.get("icon") ?? "").trim() || null;
  const incomePercent = Math.max(0, Number(formData.get("incomePercent") ?? 0));
  const fixedAmount = Math.max(0, Number(formData.get("fixedAmount") ?? 0));
  const month = parsePlanMonth(formData.get("month"));

  if (name.length < 2) return fail("jars.validation.name_min");
  if (!month) return fail("jars.validation.invalid_month");

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  try {
    const baseSlug = slugifyJarName(name) || "jar";
    const existing = await supabase
      .from("jars")
      .select("slug")
      .eq("household_id", householdId)
      .like("slug", `${baseSlug}%`);

    if (existing.error) return fail(existing.error.message);

    const used = new Set((existing.data ?? []).map((row) => row.slug));
    let slug = baseSlug;
    let index = 2;
    while (used.has(slug)) {
      slug = `${baseSlug}-${index}`;
      index += 1;
    }

    const strategy =
      incomePercent > 0 && fixedAmount > 0
        ? "hybrid"
        : incomePercent > 0
          ? "percent"
          : fixedAmount > 0
            ? "fixed"
            : "none";

    const insert = await supabase
      .from("jars")
      .insert({
        household_id: householdId,
        name,
        slug,
        jar_type: jarType,
        spend_policy: spendPolicy,
        monthly_strategy: strategy,
        color,
        icon,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insert.error || !insert.data?.id) {
      return fail(insert.error?.message ?? "jars.error.create_failed");
    }

    const monthStart = `${month}-01`;
    if (incomePercent > 0 || fixedAmount > 0) {
      const planInsert = await supabase.from("jar_month_plans").upsert(
        {
          household_id: householdId,
          jar_id: insert.data.id,
          month: monthStart,
          fixed_amount: Math.round(fixedAmount),
          income_percent: Number(incomePercent.toFixed(2)),
          created_by: user.id,
        },
        { onConflict: "jar_id,month" },
      );
      if (planInsert.error) return fail(planInsert.error.message);
    }

    await createJarEvent(supabase, {
      householdId,
      jarId: insert.data.id,
      eventType: "jar.created",
      sourceType: "jar",
      sourceId: insert.data.id,
      idempotencyKey: `jar:${insert.data.id}:created`,
      actorUserId: user.id,
      payload: { name, jarType, spendPolicy, incomePercent, fixedAmount },
    });

    revalidateJarPaths(insert.data.id);
    return ok("jars.success.created", { movementId: insert.data.id });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "jars.error.create_failed");
  }
}

export async function upsertJarPlanAction(
  formData: FormData,
): Promise<JarActionState> {
  const jarId = String(formData.get("jarId") ?? "").trim();
  const month = parsePlanMonth(formData.get("month"));
  const incomePercent = Math.max(0, Number(formData.get("incomePercent") ?? 0));
  const fixedAmount = Math.max(0, Number(formData.get("fixedAmount") ?? 0));

  if (!jarId) return fail("jars.validation.jar_id_required");
  if (!month) return fail("jars.validation.invalid_month");

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  try {
    const monthStart = `${month}-01`;
    const upsert = await supabase.from("jar_month_plans").upsert(
      {
        household_id: householdId,
        jar_id: jarId,
        month: monthStart,
        fixed_amount: Math.round(fixedAmount),
        income_percent: Number(incomePercent.toFixed(2)),
        created_by: user.id,
      },
      { onConflict: "jar_id,month" },
    );

    if (upsert.error) return fail(upsert.error.message);

    const strategy =
      incomePercent > 0 && fixedAmount > 0
        ? "hybrid"
        : incomePercent > 0
          ? "percent"
          : fixedAmount > 0
            ? "fixed"
            : "none";

    const updateJar = await supabase
      .from("jars")
      .update({ monthly_strategy: strategy })
      .eq("household_id", householdId)
      .eq("id", jarId);

    if (updateJar.error) return fail(updateJar.error.message);

    await createJarEvent(supabase, {
      householdId,
      jarId,
      eventType: "rule.changed",
      sourceType: "jar_month_plan",
      sourceId: `${jarId}:${monthStart}`,
      idempotencyKey: `jar_plan:${jarId}:${monthStart}:upsert`,
      actorUserId: user.id,
      payload: { fixedAmount: Math.round(fixedAmount), incomePercent },
    });

    revalidateJarPaths(jarId);
    return ok("jars.success.target_saved");
  } catch (err) {
    return fail(err instanceof Error ? err.message : "jars.error.plan_failed");
  }
}

export async function resolveJarReviewItemDirectAction(
  formData: FormData,
): Promise<void> {
  await resolveJarReviewItemAction(formData);
}

function parseMonth(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (/^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 8) + "01";
  return null;
}

function parsePlanMonth(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 7);
  return null;
}

function parseAllocations(value: FormDataEntryValue | null) {
  let parsed: Array<{ jarId?: unknown; amount?: unknown }> = [];
  try {
    parsed = JSON.parse(String(value ?? "[]")) as Array<{
      jarId?: unknown;
      amount?: unknown;
    }>;
  } catch {
    parsed = [];
  }
  return parsed
    .map((row) => ({
      jarId: String(row.jarId ?? "").trim(),
      amount: Math.round(Number(row.amount ?? 0)),
    }))
    .filter((row) => row.jarId && row.amount > 0);
}

export async function upsertJarCategoryRuleAction(
  formData: FormData,
): Promise<JarActionState> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const jarId = String(formData.get("jarId") ?? "").trim();

  if (!categoryId) return fail("jars.validation.category_required");
  if (!jarId) return fail("jars.validation.jar_id_required");

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  try {
    await upsertCategoryRule(supabase, {
      householdId,
      categoryId,
      jarId,
      createdBy: user.id,
    });
    await createJarEvent(supabase, {
      householdId,
      jarId,
      eventType: "rule.changed",
      sourceType: "category_rule",
      sourceId: categoryId,
      idempotencyKey: `rule:${categoryId}:changed:${Date.now()}`,
      actorUserId: user.id,
      payload: { categoryId, jarId },
    });
    revalidateJarPaths(jarId);
    return ok("jars.success.category_rule_updated");
  } catch (err) {
    return fail(err instanceof Error ? err.message : "jars.error.category_rule_failed");
  }
}

export async function bulkUpsertJarCategoryRulesAction(
  formData: FormData,
): Promise<JarActionState> {
  const rulesJson = String(formData.get("rulesJson") ?? "[]");

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  try {
    const rules = (JSON.parse(rulesJson) as Array<{ categoryId?: unknown; jarId?: unknown }>)
      .map((row) => ({
        categoryId: String(row.categoryId ?? "").trim(),
        jarId: String(row.jarId ?? "").trim(),
      }))
      .filter((row) => row.categoryId && row.jarId);

    if (rules.length === 0) return fail("jars.validation.category_required");

    await bulkUpsertCategoryRules(supabase, {
      householdId,
      rules,
      createdBy: user.id,
    });
    await createJarEvent(supabase, {
      householdId,
      jarId: null,
      eventType: "rule.bulk_updated",
      sourceType: "category_rule",
      sourceId: householdId,
      idempotencyKey: `rule:${householdId}:bulk:${Date.now()}`,
      actorUserId: user.id,
      payload: { count: rules.length },
    });
    revalidateJarPaths();
    return ok("jars.success.category_rules_updated", { updatedCount: rules.length });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "jars.error.category_rule_failed");
  }
}

export async function resolveJarReviewItemAction(
  formData: FormData,
): Promise<JarActionState> {
  const reviewId = String(formData.get("reviewId") ?? "").trim();
  if (!reviewId) return fail("jars.validation.review_id_required");

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  try {
    const allocations = parseAllocations(formData.get("allocationsJson"));
    const result = await resolveReviewToMovements(supabase, {
      householdId,
      reviewId,
      userId: user.id,
      allocations,
    });
    revalidateJarPaths();
    return ok("jars.success.review_resolved", {
      movementCount: result.movements.length,
      eventCount: result.events.length,
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "jars.error.review_failed");
  }
}

export async function createManualJarMovementAction(
  formData: FormData,
): Promise<JarActionState> {
  const jarId = String(formData.get("jarId") ?? "").trim();
  const movementDate = String(formData.get("movementDate") ?? "").trim();
  const amount = Math.round(Number(formData.get("amount") ?? 0));
  const direction = String(formData.get("direction") ?? "in") === "out" ? "out" : "in";
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!jarId) return fail("jars.validation.jar_id_required");
  if (!movementDate) return fail("jars.validation.invalid_date");
  if (amount <= 0) return fail("common.validation.amount_positive");

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  try {
    const sourceId = `${jarId}:${movementDate}:${amount}:${direction}`;
    const idempotencyKey = `manual_adjustment:${sourceId}`;
    const movementId = await createJarMovement(supabase, {
      householdId,
      jarId,
      movementDate,
      amount,
      balanceDelta: direction === "out" ? -1 : 1,
      locationFrom: direction === "out" ? "cash" : "external",
      locationTo: direction === "out" ? "external" : "cash",
      sourceType: "manual_adjustment",
      sourceId,
      sourceLineKey: "default",
      movementType: direction === "out" ? "correction_out" : "correction_in",
      idempotencyKey,
      note,
      createdBy: user.id,
    });
    await createJarEvent(supabase, {
      householdId,
      jarId,
      eventType: "correction.created",
      sourceType: "manual_adjustment",
      sourceId,
      idempotencyKey: `${idempotencyKey}:event`,
      actorUserId: user.id,
      payload: { movementId, amount, direction, note },
    });
    revalidateJarPaths(jarId);
    return ok("jars.success.movement_created", { movementId });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "jars.error.movement_failed");
  }
}

export async function previewMonthCloseAction(
  formData: FormData,
): Promise<JarActionState> {
  const month = parseMonth(formData.get("month"));
  if (!month) return fail("jars.validation.invalid_month");

  const { supabase, householdId, error } = await resolveActionContext();
  if (error || !householdId) return fail(error ?? "No household found.");

  try {
    const preview = await previewMonthClose(supabase, householdId, month);
    revalidateJarPaths();
    return ok("jars.success.month_close_previewed", {
      closeRunId: preview.closeRunId,
      month: preview.month,
      jarBalances: preview.jarBalances,
      overspendCoverage: preview.overspendCoverage,
      rollovers: preview.rollovers,
      totalSurplus: preview.totalSurplus,
      totalDeficit: preview.totalDeficit,
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "jars.error.month_close_preview_failed");
  }
}

export async function approveMonthCloseAction(
  formData: FormData,
): Promise<JarActionState> {
  const month = parseMonth(formData.get("month"));
  const closeRunId = String(formData.get("closeRunId") ?? "").trim();
  const userRolloversStr = String(formData.get("userRollovers") ?? "");
  const userCoverageStr = String(formData.get("userCoverage") ?? "");
  
  if (!month) return fail("jars.validation.invalid_month");
  if (!closeRunId) return fail("jars.validation.close_run_required");

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  try {
    const userRollovers = userRolloversStr ? JSON.parse(userRolloversStr) : undefined;
    const userCoverage = userCoverageStr ? JSON.parse(userCoverageStr) : undefined;
    
    const result = await approveMonthClose(
      supabase,
      householdId,
      user.id,
      month,
      closeRunId,
      userRollovers,
      userCoverage
    );
    revalidateJarPaths();
    return ok("jars.success.month_closed", {
      closeRunId: result.closeRunId,
      snapshotCount: result.snapshots.length,
      movementCount: result.movements.length,
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "jars.error.month_close_failed");
  }
}

export async function fundJarAction(
  formData: FormData,
): Promise<JarActionState> {
  const jarId = String(formData.get("jarId") ?? "").trim();
  const assetId = String(formData.get("assetId") ?? "").trim();
  const amount = Math.round(Number(formData.get("amount") ?? 0));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!jarId) return fail("jars.validation.jar_id_required");
  if (!assetId) return fail("jars.validation.asset_required");
  if (amount <= 0) return fail("common.validation.amount_positive");

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  try {
    const sourceId = crypto.randomUUID();
    const idempotencyKey = `fund_jar:${householdId}:${jarId}:${assetId}:${amount}`;
    
    const movementId = await createJarMovement(supabase, {
      householdId,
      jarId,
      movementDate: new Date().toISOString().slice(0, 10),
      amount,
      balanceDelta: 1,
      locationFrom: "external",
      locationTo: "cash",
      sourceType: "manual_adjustment",
      sourceId,
      sourceLineKey: "fund",
      movementType: "allocation_manual",
      idempotencyKey,
      note,
      metadata: { sourceAssetId: assetId },
      createdBy: user.id,
    });

    await createJarEvent(supabase, {
      householdId,
      jarId,
      eventType: "allocation.manual_resolved",
      sourceType: "manual_adjustment",
      sourceId,
      idempotencyKey: `${idempotencyKey}:event`,
      actorUserId: user.id,
      payload: { movementId, amount, assetId, note },
    });

    revalidateJarPaths(jarId);
    return ok("jars.success.jar_funded", { movementId, amount });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "jars.error.funding_failed");
  }
}
