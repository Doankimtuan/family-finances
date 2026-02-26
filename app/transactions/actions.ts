"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import type { TransactionActionState } from "./action-types";

function ok(message: string): TransactionActionState {
  return { status: "success", message };
}

function fail(message: string): TransactionActionState {
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

async function getDefaultCategoryId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  type: "income" | "expense",
): Promise<string | null> {
  const name = type === "income" ? "Salary" : "Groceries";

  const system = await supabase
    .from("categories")
    .select("id")
    .is("household_id", null)
    .eq("kind", type)
    .eq("name", name)
    .limit(1)
    .maybeSingle();

  if (system.data?.id) return system.data.id;

  const fallback = await supabase
    .from("categories")
    .select("id")
    .eq("household_id", householdId)
    .eq("kind", type)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  return fallback.data?.id ?? null;
}

export async function quickAddTransactionAction(
  _prev: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const type = String(formData.get("type") ?? "expense").trim() as "income" | "expense";
  const amount = Number(formData.get("amount") ?? 0);

  if (!(type === "income" || type === "expense")) return fail("Invalid transaction type.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Amount must be greater than zero.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  const account = await supabase
    .from("accounts")
    .select("id")
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (account.error || !account.data?.id) {
    return fail(account.error?.message ?? "Add an account first.");
  }

  const categoryId = await getDefaultCategoryId(supabase, householdId, type);

  const insert = await supabase.from("transactions").insert({
    household_id: householdId,
    account_id: account.data.id,
    type,
    amount: Math.round(amount),
    currency: "VND",
    transaction_date: new Date().toISOString().slice(0, 10),
    description: type === "income" ? "Quick income" : "Quick expense",
    category_id: categoryId,
    paid_by_member_id: user.id,
    status: "cleared",
    created_by: user.id,
  });

  if (insert.error) return fail(insert.error.message);

  revalidatePath("/transactions");
  revalidatePath("/dashboard");

  return ok("Transaction added.");
}

export async function addTransactionDetailedAction(
  _prev: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const accountId = String(formData.get("accountId") ?? "").trim();
  const type = String(formData.get("type") ?? "expense").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const categoryIdRaw = String(formData.get("categoryId") ?? "").trim();
  const transactionDate = String(formData.get("transactionDate") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!accountId) return fail("Account is required.");
  if (!(type === "income" || type === "expense" || type === "transfer")) return fail("Invalid transaction type.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Amount must be greater than zero.");
  if (!transactionDate) return fail("Transaction date is required.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  const insert = await supabase.from("transactions").insert({
    household_id: householdId,
    account_id: accountId,
    type,
    amount: Math.round(amount),
    currency: "VND",
    transaction_date: transactionDate,
    description: description.length > 0 ? description : null,
    category_id: categoryIdRaw.length > 0 ? categoryIdRaw : null,
    paid_by_member_id: user.id,
    status: "cleared",
    created_by: user.id,
  });

  if (insert.error) return fail(insert.error.message);

  revalidatePath("/transactions");
  revalidatePath("/dashboard");

  return ok("Transaction saved.");
}
