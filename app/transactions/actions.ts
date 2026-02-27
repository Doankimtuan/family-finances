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

function isInsufficientFundsError(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("insufficient") ||
    m.includes("not enough") ||
    (m.includes("balance") && m.includes("exceed"))
  );
}

async function getAccountBalanceSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  accountId: string,
  excludeTransactionId?: string,
) {
  const accountRes = await supabase
    .from("accounts")
    .select("opening_balance")
    .eq("household_id", householdId)
    .eq("id", accountId)
    .maybeSingle();

  if (accountRes.error || !accountRes.data) {
    return {
      balance: null as number | null,
      error: accountRes.error?.message ?? "Account not found.",
    };
  }

  let txQuery = supabase
    .from("transactions")
    .select("type, amount")
    .eq("household_id", householdId)
    .eq("account_id", accountId)
    .eq("status", "cleared");
  if (excludeTransactionId) {
    txQuery = txQuery.neq("id", excludeTransactionId);
  }

  const txRes = await txQuery;

  if (txRes.error) {
    return { balance: null as number | null, error: txRes.error.message };
  }

  let balance = Number(accountRes.data.opening_balance ?? 0);
  for (const row of txRes.data ?? []) {
    const amount = Number(row.amount ?? 0);
    if (row.type === "income") balance += amount;
    if (row.type === "expense") balance -= amount;
  }

  return { balance, error: null as string | null };
}

async function resolveContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      householdId: null,
      error: "You must be logged in.",
    };
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
    return {
      supabase,
      user,
      householdId: null,
      error: membership.error?.message ?? "No household found.",
    };
  }

  return {
    supabase,
    user,
    householdId: membership.data.household_id,
    error: null,
  };
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
  const type = String(formData.get("type") ?? "expense").trim() as
    | "income"
    | "expense";
  const amount = Number(formData.get("amount") ?? 0);
  const categoryIdRaw = String(formData.get("categoryId") ?? "").trim();
  const accountIdRaw = String(formData.get("accountId") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();

  if (!(type === "income" || type === "expense"))
    return fail("Invalid transaction type.");
  if (!Number.isFinite(amount) || amount <= 0)
    return fail("Amount must be greater than zero.");
  if (type === "expense" && !categoryIdRaw)
    return fail("Choose a category to finish quick logging.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId)
    return fail(error ?? "No household found.");

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

  const categoryId =
    categoryIdRaw.length > 0
      ? categoryIdRaw
      : await getDefaultCategoryId(supabase, householdId, type);

  const amountRounded = Math.round(amount);
  const transactionDate = new Date().toISOString().slice(0, 10);
  const description =
    descriptionRaw.length > 0
      ? descriptionRaw
      : type === "income"
        ? "Quick income"
        : "Quick expense";
  const status: "cleared" | "pending" = "cleared";
  if (type === "expense") {
    const snapshot = await getAccountBalanceSnapshot(
      supabase,
      householdId,
      accountId,
    );
    if (snapshot.error) return fail(snapshot.error);
    if (snapshot.balance !== null && amountRounded > snapshot.balance) {
      return fail(
        "Transaction not recorded: expense amount exceeds current account balance.",
      );
    }
  }
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
      status,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (
    (insert.error || !insert.data?.id) &&
    type === "expense" &&
    isInsufficientFundsError(insert.error?.message)
  ) {
    return fail(
      "Transaction not recorded: expense amount exceeds current account balance.",
    );
  }

  if (insert.error || !insert.data?.id)
    return fail(insert.error?.message ?? "Failed to add transaction.");

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
      categoryId,
      transactionDate,
      source: "quick_add",
      status,
    },
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
  const counterpartyAccountIdRaw = String(
    formData.get("counterpartyAccountId") ?? "",
  ).trim();
  const transactionDate = String(formData.get("transactionDate") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!accountId) return fail("Account is required.");
  if (!(type === "income" || type === "expense" || type === "transfer"))
    return fail("Invalid transaction type.");
  if (!Number.isFinite(amount) || amount <= 0)
    return fail("Amount must be greater than zero.");
  if (!transactionDate) return fail("Transaction date is required.");
  if (type === "expense" && !categoryIdRaw)
    return fail("Category is required for expense.");
  if (type === "transfer" && !counterpartyAccountIdRaw)
    return fail("Destination account is required for transfer.");
  if (type === "transfer" && counterpartyAccountIdRaw === accountId)
    return fail("Transfer requires two different accounts.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId)
    return fail(error ?? "No household found.");

  const amountRounded = Math.round(amount);
  const categoryId =
    type === "transfer"
      ? null
      : categoryIdRaw.length > 0
        ? categoryIdRaw
        : null;
  const counterpartyAccountId =
    type === "transfer" ? counterpartyAccountIdRaw : null;
  const status: "cleared" | "pending" = "cleared";
  if (type === "expense") {
    const snapshot = await getAccountBalanceSnapshot(
      supabase,
      householdId,
      accountId,
    );
    if (snapshot.error) return fail(snapshot.error);
    if (snapshot.balance !== null && amountRounded > snapshot.balance) {
      return fail(
        "Transaction not recorded: expense amount exceeds current account balance.",
      );
    }
  }
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
      status,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (
    (insert.error || !insert.data?.id) &&
    type === "expense" &&
    isInsufficientFundsError(insert.error?.message)
  ) {
    return fail(
      "Transaction not recorded: expense amount exceeds current account balance.",
    );
  }

  if (insert.error || !insert.data?.id)
    return fail(insert.error?.message ?? "Failed to save transaction.");

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
      status,
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");

  return ok("Transaction saved.");
}

function revalidateTransactionRelatedPaths() {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/budgets");
}

export async function updateTransactionAction(
  _prev: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const transactionId = String(formData.get("transactionId") ?? "").trim();
  const accountId = String(formData.get("accountId") ?? "").trim();
  const type = String(formData.get("type") ?? "expense").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const categoryIdRaw = String(formData.get("categoryId") ?? "").trim();
  const counterpartyAccountIdRaw = String(
    formData.get("counterpartyAccountId") ?? "",
  ).trim();
  const transactionDate = String(formData.get("transactionDate") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();

  if (!transactionId) return fail("Transaction is required.");
  if (!accountId) return fail("Account is required.");
  if (!(type === "income" || type === "expense" || type === "transfer"))
    return fail("Invalid transaction type.");
  if (!Number.isFinite(amount) || amount <= 0)
    return fail("Amount must be greater than zero.");
  if (!transactionDate) return fail("Transaction date is required.");
  if (type === "expense" && !categoryIdRaw)
    return fail("Category is required for expense.");
  if (type === "transfer" && !counterpartyAccountIdRaw)
    return fail("Destination account is required for transfer.");
  if (type === "transfer" && counterpartyAccountIdRaw === accountId)
    return fail("Transfer requires two different accounts.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId)
    return fail(error ?? "No household found.");

  const existing = await supabase
    .from("transactions")
    .select("id, status")
    .eq("household_id", householdId)
    .eq("id", transactionId)
    .maybeSingle();
  if (existing.error || !existing.data?.id)
    return fail(existing.error?.message ?? "Transaction not found.");

  const amountRounded = Math.round(amount);
  const categoryId =
    type === "transfer"
      ? null
      : categoryIdRaw.length > 0
        ? categoryIdRaw
        : null;
  const counterpartyAccountId =
    type === "transfer" ? counterpartyAccountIdRaw : null;
  const description = descriptionRaw.length > 0 ? descriptionRaw : null;
  const status: "cleared" | "pending" = "cleared";

  if (type === "expense") {
    const snapshot = await getAccountBalanceSnapshot(
      supabase,
      householdId,
      accountId,
      transactionId,
    );
    if (snapshot.error) return fail(snapshot.error);
    if (snapshot.balance !== null && amountRounded > snapshot.balance) {
      return fail(
        "Transaction not updated: expense amount exceeds current account balance.",
      );
    }
  }

  const update = await supabase
    .from("transactions")
    .update({
      account_id: accountId,
      type,
      amount: amountRounded,
      transaction_date: transactionDate,
      description,
      category_id: categoryId,
      counterparty_account_id: counterpartyAccountId,
      status,
    })
    .eq("household_id", householdId)
    .eq("id", transactionId)
    .select("id")
    .single();

  if (
    (update.error || !update.data?.id) &&
    type === "expense" &&
    isInsufficientFundsError(update.error?.message)
  ) {
    return fail(
      "Transaction not updated: expense amount exceeds current account balance.",
    );
  }

  if (update.error || !update.data?.id)
    return fail(update.error?.message ?? "Failed to update transaction.");

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "transaction.updated",
    entityType: "transaction",
    entityId: transactionId,
    payload: {
      type,
      amount: amountRounded,
      accountId,
      categoryId,
      counterpartyAccountId,
      transactionDate,
      status,
    },
  });

  revalidateTransactionRelatedPaths();
  return ok("Transaction updated.");
}

export async function deleteTransactionAction(
  _prev: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const transactionId = String(formData.get("transactionId") ?? "").trim();
  if (!transactionId) return fail("Transaction is required.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId)
    return fail(error ?? "No household found.");

  const existing = await supabase
    .from("transactions")
    .select("id")
    .eq("household_id", householdId)
    .eq("id", transactionId)
    .maybeSingle();
  if (existing.error || !existing.data?.id)
    return fail(existing.error?.message ?? "Transaction not found.");

  const deletion = await supabase
    .from("transactions")
    .delete()
    .eq("household_id", householdId)
    .eq("id", transactionId);
  if (deletion.error) return fail(deletion.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "transaction.deleted",
    entityType: "transaction",
    entityId: transactionId,
    payload: {},
  });

  revalidateTransactionRelatedPaths();
  return ok("Transaction deleted.");
}
