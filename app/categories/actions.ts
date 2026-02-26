"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import type { CategoryActionState } from "./action-types";

function ok(message: string): CategoryActionState {
  return { status: "success", message };
}

function fail(message: string): CategoryActionState {
  return { status: "error", message };
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

  if (!(kind === "income" || kind === "expense")) return fail("Invalid category type.");
  if (name.length < 2) return fail("Category name must be at least 2 characters.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  const insert = await supabase.from("categories").insert({
    household_id: householdId,
    kind,
    name,
    is_system: false,
    is_active: true,
    sort_order: 1000,
  });

  if (insert.error) return fail(insert.error.message);

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

  const { supabase, error } = await resolveContext();
  if (error) return fail(error);

  const update = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", categoryId)
    .eq("is_system", false);

  if (update.error) return fail(update.error.message);

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return ok(isActive ? "Category enabled." : "Category disabled.");
}
