"use server";

import { revalidatePath } from "next/cache";

import { writeAuditEvent } from "@/lib/server/audit";
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
  const categoryIdRaw = String(formData.get("categoryId") ?? "").trim();
  const accountIdRaw = String(formData.get("accountId") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();

  if (!(type === "income" || type === "expense")) return fail("Invalid transaction type.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Amount must be greater than zero.");
  if (type === "expense" && !categoryIdRaw) return fail("Choose a category to finish quick logging.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  let accountId = accountIdRaw;
  if (!accountId) {
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
    accountId = account.data.id;
  }

  const categoryId = categoryIdRaw.length > 0 ? categoryIdRaw : await getDefaultCategoryId(supabase, householdId, type);

  const amountRounded = Math.round(amount);
  const transactionDate = new Date().toISOString().slice(0, 10);
  const description = descriptionRaw.length > 0 ? descriptionRaw : type === "income" ? "Quick income" : "Quick expense";
  const insert = await supabase
    .from("transactions")
    .insert({
      household_id: householdId,
      account_id: accountId,
      type,
      amount: amountRounded,
      currency: "VND",
      transaction_date: transactionDate,
      description,
      category_id: categoryId,
      paid_by_member_id: user.id,
      status: "cleared",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id) return fail(insert.error?.message ?? "Failed to add transaction.");

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "transaction.created",
    entityType: "transaction",
    entityId: insert.data.id,
    payload: { type, amount: amountRounded, accountId, categoryId, transactionDate, source: "quick_add" },
  });

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
  const counterpartyAccountIdRaw = String(formData.get("counterpartyAccountId") ?? "").trim();
  const transactionDate = String(formData.get("transactionDate") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!accountId) return fail("Account is required.");
  if (!(type === "income" || type === "expense" || type === "transfer")) return fail("Invalid transaction type.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Amount must be greater than zero.");
  if (!transactionDate) return fail("Transaction date is required.");
  if (type === "transfer" && !counterpartyAccountIdRaw) return fail("Destination account is required for transfer.");
  if (type === "transfer" && counterpartyAccountIdRaw === accountId) return fail("Transfer requires two different accounts.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  const amountRounded = Math.round(amount);
  const categoryId = type === "transfer" ? null : categoryIdRaw.length > 0 ? categoryIdRaw : null;
  const counterpartyAccountId = type === "transfer" ? counterpartyAccountIdRaw : null;
  const insert = await supabase
    .from("transactions")
    .insert({
      household_id: householdId,
      account_id: accountId,
      type,
      amount: amountRounded,
      currency: "VND",
      transaction_date: transactionDate,
      description: description.length > 0 ? description : null,
      category_id: categoryId,
      counterparty_account_id: counterpartyAccountId,
      paid_by_member_id: user.id,
      status: "cleared",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id) return fail(insert.error?.message ?? "Failed to save transaction.");

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "transaction.created",
    entityType: "transaction",
    entityId: insert.data.id,
    payload: {
      type,
      amount: amountRounded,
      accountId,
      counterpartyAccountId,
      categoryId,
      transactionDate,
      source: "detailed_add",
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");

  return ok("Transaction saved.");
}
