"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import type { BudgetActionState } from "./action-types";

function ok(message: string): BudgetActionState {
  return { status: "success", message };
}

function fail(message: string): BudgetActionState {
  return { status: "error", message };
}

function normalizeMonthDate(value: string): string | null {
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  return `${value}-01`;
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

export async function upsertMonthlyBudgetAction(
  _prev: BudgetActionState,
  formData: FormData,
): Promise<BudgetActionState> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const monthRaw = String(formData.get("month") ?? "").trim();
  const plannedAmount = Number(formData.get("plannedAmount") ?? 0);
  const monthDate = normalizeMonthDate(monthRaw);

  if (!categoryId) return fail("Category is required.");
  if (!monthDate) return fail("Month is required.");
  if (!Number.isFinite(plannedAmount) || plannedAmount < 0) return fail("Planned amount must be non-negative.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const upsert = await supabase.from("monthly_budgets").upsert(
    {
      household_id: householdId,
      category_id: categoryId,
      month: monthDate,
      planned_amount: Math.round(plannedAmount),
      created_by: user.id,
    },
    { onConflict: "household_id,month,category_id" },
  );

  if (upsert.error) return fail(upsert.error.message);

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return ok("Monthly budget saved.");
}

export async function deleteMonthlyBudgetAction(
  _prev: BudgetActionState,
  formData: FormData,
): Promise<BudgetActionState> {
  const budgetId = String(formData.get("budgetId") ?? "").trim();
  if (!budgetId) return fail("Missing budget id.");

  const { supabase, error } = await resolveContext();
  if (error) return fail(error);

  const del = await supabase.from("monthly_budgets").delete().eq("id", budgetId);
  if (del.error) return fail(del.error.message);

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return ok("Budget entry removed.");
}
