"use server";

import { revalidatePath } from "next/cache";

import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";

import type { CategoryActionState } from "./action-types";

function ok(message: string): CategoryActionState {
  return { status: "success", message };
}

function fail(message: string): CategoryActionState {
  return { status: "error", message };
}

function normalizeHexColor(input: string | null | undefined) {
  const fallback = "#64748b";
  if (!input) return fallback;
  const normalized = input.trim();
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : fallback;
}

async function resolveContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, householdId: null, error: "You must be logged in." };
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
    return { supabase, user, householdId: null, error: membership.error?.message ?? "No household found." };
  }

  return { supabase, user, householdId: membership.data.household_id, error: null };
}

export async function createCategoryAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const kind = String(formData.get("kind") ?? "expense").trim();
  const name = String(formData.get("name") ?? "").trim();
  const color = normalizeHexColor(String(formData.get("color") ?? ""));

  if (!(kind === "income" || kind === "expense")) return fail("Invalid category type.");
  if (name.length < 2) return fail("Category name must be at least 2 characters.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  const insert = await supabase
    .from("categories")
    .insert({
      household_id: householdId,
      kind,
      name,
      is_system: false,
      is_active: true,
      color,
      sort_order: 1000,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id) return fail(insert.error?.message ?? "Failed to create category.");

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "category.created",
    entityType: "category",
    entityId: insert.data.id,
    payload: { kind, name, color },
  });

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return ok("Category created.");
}

export async function setCategoryActiveAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "").trim() === "true";

  if (!categoryId) return fail("Missing category id.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  const update = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", categoryId)
    .eq("is_system", false);

  if (update.error) return fail(update.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "category.status_changed",
    entityType: "category",
    entityId: categoryId,
    payload: { isActive },
  });

  revalidatePath("/categories");
  revalidatePath("/settings/categories");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return ok(isActive ? "Category enabled." : "Category disabled.");
}

export async function renameCategoryAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const color = normalizeHexColor(String(formData.get("color") ?? ""));

  if (!categoryId) return fail("Missing category id.");
  if (name.length < 2) return fail("Category name must be at least 2 characters.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  const categoryResult = await supabase
    .from("categories")
    .select("id, household_id")
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryResult.error || !categoryResult.data) {
    return fail(categoryResult.error?.message ?? "Category not found.");
  }
  if (categoryResult.data.household_id && categoryResult.data.household_id !== householdId) {
    return fail("You do not have permission to edit this category.");
  }

  const update = await supabase
    .from("categories")
    .update({ name, color })
    .eq("id", categoryId)
    .or(`household_id.is.null,household_id.eq.${householdId}`);

  if (update.error) return fail(update.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "category.renamed",
    entityType: "category",
    entityId: categoryId,
    payload: { name, color },
  });

  revalidatePath("/categories");
  revalidatePath("/settings/categories");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return ok("Category updated.");
}

export async function deleteCategoryAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();

  if (!categoryId) return fail("Missing category id.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  const categoryResult = await supabase
    .from("categories")
    .select("id, household_id")
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryResult.error || !categoryResult.data) {
    return fail(categoryResult.error?.message ?? "Category not found.");
  }
  if (categoryResult.data.household_id && categoryResult.data.household_id !== householdId) {
    return fail("You do not have permission to delete this category.");
  }

  const [txCount, budgetCount] = await Promise.all([
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId),
    supabase
      .from("monthly_budgets")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("category_id", categoryId),
  ]);

  if (txCount.error) return fail(txCount.error.message);
  if (budgetCount.error) return fail(budgetCount.error.message);

  if ((txCount.count ?? 0) > 0) {
    return fail("This category has transactions, so it cannot be deleted. You can still edit it.");
  }

  if ((budgetCount.count ?? 0) > 0) {
    const removeBudgets = await supabase
      .from("monthly_budgets")
      .delete()
      .eq("household_id", householdId)
      .eq("category_id", categoryId);
    if (removeBudgets.error) return fail(removeBudgets.error.message);
  }

  const del = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .or(`household_id.is.null,household_id.eq.${householdId}`);

  if (del.error) return fail(del.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "category.deleted",
    entityType: "category",
    entityId: categoryId,
    payload: {},
  });

  revalidatePath("/categories");
  revalidatePath("/settings/categories");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return ok("Category deleted.");
}
