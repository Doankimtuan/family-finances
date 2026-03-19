"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createJarMovement,
  ensureJarPreset,
  resolveJarReviewQueue,
  slugifyJarName,
} from "@/lib/jars/intent";
import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";

function withStatus(path: string, key: "success" | "error", message: string) {
  const url = new URL(path, "http://local");
  url.searchParams.set(key, message);
  return `${url.pathname}${url.search}`;
}

async function resolveContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const membership = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership.error || !membership.data?.household_id) {
    throw new Error(membership.error?.message ?? "No household found.");
  }

  return { supabase, user, householdId: membership.data.household_id };
}

function getReturnTo(formData: FormData, fallback: string) {
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  return returnTo.length > 0 ? returnTo : fallback;
}

export async function bootstrapPresetJarsAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/jars");
  try {
    const { supabase, user, householdId } = await resolveContext();
    await ensureJarPreset(supabase, householdId, user.id);
    await writeAuditEvent(supabase, {
      householdId,
      actorUserId: user.id,
      eventType: "jars.preset_bootstrapped",
      entityType: "jar",
      entityId: householdId,
    });
    revalidatePath("/jars");
    revalidatePath("/dashboard");
    redirect(withStatus(returnTo, "success", "Da khoi tao bo 6 hu mac dinh."));
  } catch (error) {
    redirect(
      withStatus(
        returnTo,
        "error",
        error instanceof Error ? error.message : "Khong the khoi tao bo hu mac dinh.",
      ),
    );
  }
}

export async function createIntentJarAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/jars/setup");
  try {
    const { supabase, user, householdId } = await resolveContext();
    const name = String(formData.get("name") ?? "").trim();
    const jarType = String(formData.get("jarType") ?? "custom").trim();
    const spendPolicy = String(formData.get("spendPolicy") ?? "flexible").trim();
    const color = String(formData.get("color") ?? "").trim() || null;
    const icon = String(formData.get("icon") ?? "").trim() || null;
    const incomePercent = Math.max(0, Number(formData.get("incomePercent") ?? 0));
    const fixedAmount = Math.max(0, Number(formData.get("fixedAmount") ?? 0));
    const month = String(formData.get("month") ?? new Date().toISOString().slice(0, 7)).trim();

    if (name.length < 2) throw new Error("Ten hu phai co it nhat 2 ky tu.");
    const baseSlug = slugifyJarName(name) || "jar";

    const existing = await supabase
      .from("jars")
      .select("slug")
      .eq("household_id", householdId)
      .like("slug", `${baseSlug}%`);
    if (existing.error) throw new Error(existing.error.message);

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
      throw new Error(insert.error?.message ?? "Khong the tao hu.");
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
      if (planInsert.error) throw new Error(planInsert.error.message);
    }

    await writeAuditEvent(supabase, {
      householdId,
      actorUserId: user.id,
      eventType: "jars.created",
      entityType: "jar",
      entityId: insert.data.id,
      payload: { name, jarType, spendPolicy, incomePercent, fixedAmount },
    });

    revalidatePath("/jars");
    revalidatePath("/jars/setup");
    redirect(withStatus(returnTo, "success", "Da tao hu moi."));
  } catch (error) {
    redirect(
      withStatus(
        returnTo,
        "error",
        error instanceof Error ? error.message : "Khong the tao hu.",
      ),
    );
  }
}

export async function upsertJarPlanAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/jars");
  try {
    const { supabase, user, householdId } = await resolveContext();
    const jarId = String(formData.get("jarId") ?? "").trim();
    const month = String(formData.get("month") ?? "").trim();
    const incomePercent = Math.max(0, Number(formData.get("incomePercent") ?? 0));
    const fixedAmount = Math.max(0, Number(formData.get("fixedAmount") ?? 0));

    if (!jarId) throw new Error("Thieu hu can cap nhat.");
    if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("Thang khong hop le.");

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
    if (upsert.error) throw new Error(upsert.error.message);

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
    if (updateJar.error) throw new Error(updateJar.error.message);

    revalidatePath("/jars");
    revalidatePath(`/jars/${jarId}`);
    redirect(withStatus(returnTo, "success", "Da cap nhat ke hoach thang."));
  } catch (error) {
    redirect(
      withStatus(
        returnTo,
        "error",
        error instanceof Error ? error.message : "Khong the cap nhat ke hoach thang.",
      ),
    );
  }
}

export async function upsertExpenseRuleAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/jars/setup");
  try {
    const { supabase, user, householdId } = await resolveContext();
    const categoryId = String(formData.get("categoryId") ?? "").trim();
    const jarId = String(formData.get("jarId") ?? "").trim();

    if (!categoryId || !jarId) throw new Error("Can chon category va hu.");

    const deactivate = await supabase
      .from("jar_rules")
      .update({ is_active: false })
      .eq("household_id", householdId)
      .eq("rule_type", "expense_category")
      .eq("category_id", categoryId);
    if (deactivate.error) throw new Error(deactivate.error.message);

    const insert = await supabase.from("jar_rules").insert({
      household_id: householdId,
      jar_id: jarId,
      rule_type: "expense_category",
      category_id: categoryId,
      priority: 10,
      confidence: "high",
      is_active: true,
      created_by: user.id,
    });
    if (insert.error) throw new Error(insert.error.message);

    revalidatePath("/jars");
    revalidatePath("/jars/setup");
    redirect(withStatus(returnTo, "success", "Da luu quy tac category -> hu."));
  } catch (error) {
    redirect(
      withStatus(
        returnTo,
        "error",
        error instanceof Error ? error.message : "Khong the luu quy tac.",
      ),
    );
  }
}

export async function resolveJarReviewAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/jars/review");
  try {
    const { supabase, user, householdId } = await resolveContext();
    const reviewId = String(formData.get("reviewId") ?? "").trim();
    const mode = String(formData.get("mode") ?? "suggested").trim();
    const allocationsJson = String(formData.get("allocationsJson") ?? "[]");
    const manualJarId = String(formData.get("manualJarId") ?? "").trim();
    const manualAmount = Math.max(0, Number(formData.get("manualAmount") ?? 0));

    if (!reviewId) throw new Error("Thieu review item.");

    const allocations =
      mode === "manual"
        ? [{ jarId: manualJarId, amount: manualAmount }]
        : ((JSON.parse(allocationsJson) as Array<{ jarId: string; amount: number }>) ?? []);

    await resolveJarReviewQueue(supabase, {
      householdId,
      reviewId,
      userId: user.id,
      allocations,
    });

    revalidatePath("/jars");
    revalidatePath("/jars/review");
    revalidatePath("/dashboard");
    redirect(withStatus(returnTo, "success", "Da xu ly review item."));
  } catch (error) {
    redirect(
      withStatus(
        returnTo,
        "error",
        error instanceof Error ? error.message : "Khong the xu ly review item.",
      ),
    );
  }
}

export async function deleteIntentJarAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/jars/setup");
  try {
    const { supabase, householdId } = await resolveContext();
    const jarId = String(formData.get("jarId") ?? "").trim();
    if (!jarId) throw new Error("Thieu hu can xoa.");

    const [balanceResult, movementResult, reviewResult] = await Promise.all([
      supabase
        .from("jar_current_balances")
        .select("current_balance, held_in_cash, held_in_savings, held_in_investments, held_in_assets")
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
          return String((item as { jarId?: unknown; jar_id?: unknown }).jarId ?? (item as { jarId?: unknown; jar_id?: unknown }).jar_id ?? "") === jarId;
        });
      });
    });

    if (balance > 0 || holdings > 0 || (movementResult.count ?? 0) > 0 || hasLinkedReview) {
      throw new Error("Khong the xoa hu da co so du hoac lich su movement.");
    }

    const deleteResult = await supabase
      .from("jars")
      .delete()
      .eq("household_id", householdId)
      .eq("id", jarId);
    if (deleteResult.error) throw new Error(deleteResult.error.message);

    revalidatePath("/jars");
    revalidatePath("/jars/setup");
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

export async function addManualJarAdjustmentAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/jars");
  try {
    const { supabase, user, householdId } = await resolveContext();
    const jarId = String(formData.get("jarId") ?? "").trim();
    const movementDate = String(formData.get("movementDate") ?? "").trim();
    const amount = Math.max(0, Number(formData.get("amount") ?? 0));
    const direction = String(formData.get("direction") ?? "in").trim();
    const note = String(formData.get("note") ?? "").trim();
    if (!jarId || !movementDate || amount <= 0) {
      throw new Error("Thong tin dieu chinh thu cong chua hop le.");
    }

    await createJarMovement(supabase, {
      householdId,
      jarId,
      movementDate,
      amount,
      balanceDelta: direction === "out" ? -1 : 1,
      locationFrom: direction === "out" ? "cash" : "external",
      locationTo: direction === "out" ? "external" : "cash",
      sourceType: "manual_adjustment",
      sourceId: `${jarId}:${movementDate}:${amount}:${direction}`,
      note,
      createdBy: user.id,
    });

    revalidatePath("/jars");
    revalidatePath(`/jars/${jarId}`);
    redirect(withStatus(returnTo, "success", "Da ghi nhan dieu chinh thu cong."));
  } catch (error) {
    redirect(
      withStatus(
        returnTo,
        "error",
        error instanceof Error ? error.message : "Khong the ghi nhan dieu chinh thu cong.",
      ),
    );
  }
}
