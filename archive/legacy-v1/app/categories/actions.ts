"use server";

import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, resolveActionContext, revalidateCategories, revalidateCategoriesWithSettings } from "@/lib/server/action-helpers";

import type { CategoryActionState } from "./action-types";

function normalizeHexColor(input: string | null | undefined) {
  const fallback = "#64748b";
  if (!input) return fallback;
  const normalized = input.trim();
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : fallback;
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

  const { supabase, user, householdId, error } = await resolveActionContext();
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

  revalidateCategories();
  return ok("Category created.");
}

export async function setCategoryActiveAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "").trim() === "true";

  if (!categoryId) return fail("Missing category id.");

  const { supabase, user, householdId, error } = await resolveActionContext();
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

  revalidateCategoriesWithSettings();
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

  const { supabase, user, householdId, error } = await resolveActionContext();
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

  revalidateCategoriesWithSettings();
  return ok("Category updated.");
}

export async function deleteCategoryAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();

  if (!categoryId) return fail("Missing category id.");

  const { supabase, user, householdId, error } = await resolveActionContext();
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

  const txCount = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (txCount.error) return fail(txCount.error.message);

  if ((txCount.count ?? 0) > 0) {
    return fail("This category has transactions, so it cannot be deleted. You can still edit it.");
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

  revalidateCategoriesWithSettings();
  return ok("Category deleted.");
}
