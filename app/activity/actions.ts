"use server";

import { revalidatePath } from "next/cache";

import { syncTransactionToJarIntent } from "@/lib/jars/intent";
import { resolveActionContext } from "@/lib/server/action-context";
import { ok, fail } from "@/lib/server/action-helpers";
import { getAccountBalanceSnapshot } from "@/lib/server/balance";
import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";

import type { TransactionActionState } from "./action-types";
import { getSpendingJarWarningForCategory } from "./_lib/spending-jars";
import {
  getAccountType,
  syncCardBillingOnDelete,
  syncCardBillingOnUpdate,
} from "./_lib/card-billing";

// ─── Helpers ────────────────────────────────────────────────────────────────

function isInsufficientFundsError(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("insufficient") ||
    m.includes("not enough") ||
    (m.includes("balance") && m.includes("exceed"))
  );
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

function revalidateTransactionRelatedPaths() {
  revalidatePath("/activity");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/goals");
}

// ─── Actions ────────────────────────────────────────────────────────────────

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
    return fail("errors.invalid_type");
  if (!Number.isFinite(amount) || amount <= 0)
    return fail("errors.amount_positive");
  if (type === "expense" && !categoryIdRaw)
    return fail("transactions.error.select_category");

  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? "errors.household_not_found");

  let accountId = accountIdRaw;
  if (!accountId) {
    const account = await supabase
      .from("accounts")
      .select("id")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (account.error || !account.data?.id) {
      return fail(account.error?.message ?? t("transactions.error.add_account_first"));
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
      return fail(t("transactions.error.insufficient_funds"));
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
    return fail(t("transactions.error.insufficient_funds"));
  }

  if (insert.error || !insert.data?.id)
    return fail(insert.error?.message ?? t("errors.failed_to_save"));

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

  revalidatePath("/activity");
  revalidatePath("/dashboard");
  revalidatePath("/goals");

  await syncTransactionToJarIntent(supabase, {
    householdId,
    userId: user.id,
    transactionId: insert.data.id,
    type,
    amount: amountRounded,
    transactionDate,
    categoryId,
    description,
  });

  const spendingJarWarning =
    type === "expense"
      ? await getSpendingJarWarningForCategory(
          supabase,
          householdId,
          categoryId,
          user.id,
        )
      : null;

  return {
    ...ok("Transaction added."),
    spendingJarWarning,
  };
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

  const { supabase, user, householdId, t, error } = await resolveActionContext();
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
      return fail(t("transactions.error.insufficient_funds"));
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
    return fail(t("transactions.error.insufficient_funds"));
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

  revalidatePath("/activity");
  revalidatePath("/dashboard");
  revalidatePath("/goals");

  await syncTransactionToJarIntent(supabase, {
    householdId,
    userId: user.id,
    transactionId: insert.data.id,
    type: type as "income" | "expense" | "transfer",
    amount: amountRounded,
    transactionDate,
    categoryId,
    description: description.length > 0 ? description : null,
  });

  const spendingJarWarning =
    type === "expense"
      ? await getSpendingJarWarningForCategory(
          supabase,
          householdId,
          categoryId,
          user.id,
        )
      : null;

  return {
    ...ok("Transaction saved."),
    spendingJarWarning,
  };
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

  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? "No household found.");

  const existing = await supabase
    .from("transactions")
    .select("id, status, account_id, amount, type, transaction_date")
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

  const billingSync = await syncCardBillingOnUpdate(
    supabase,
    householdId,
    transactionId,
    {
      prevAccountId: String(existing.data.account_id ?? ""),
      prevAmount: Number(existing.data.amount ?? 0),
      prevType: String(existing.data.type ?? "expense"),
      prevDate: String(existing.data.transaction_date ?? transactionDate),
      nextAccountId: accountId,
      nextAmount: amountRounded,
      nextType: type,
      nextDate: transactionDate,
      nextDescription: description,
    },
  );

  if (billingSync.error) return fail(billingSync.error);

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
  revalidatePath("/accounts");

  const prevAccountId = String(existing.data.account_id ?? "");
  const prevAccountType = prevAccountId
    ? await getAccountType(supabase, householdId, prevAccountId)
    : null;
  const nextAccountType = await getAccountType(supabase, householdId, accountId);

  if (prevAccountType === "credit_card" && prevAccountId)
    revalidatePath(`/accounts/card/${prevAccountId}`);
  if (nextAccountType === "credit_card")
    revalidatePath(`/accounts/card/${accountId}`);

  const spendingJarWarning =
    type === "expense"
      ? await getSpendingJarWarningForCategory(
          supabase,
          householdId,
          categoryId,
          user.id,
        )
      : null;

  return {
    ...ok("Transaction updated."),
    spendingJarWarning,
  };
}

export async function deleteTransactionAction(
  _prev: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const transactionId = String(formData.get("transactionId") ?? "").trim();
  if (!transactionId) return fail("Transaction is required.");

  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? "No household found.");

  const existing = await supabase
    .from("transactions")
    .select("id, account_id, amount, type")
    .eq("household_id", householdId)
    .eq("id", transactionId)
    .maybeSingle();
  if (existing.error || !existing.data?.id)
    return fail(existing.error?.message ?? "Transaction not found.");

  const prevAccountId = String(existing.data.account_id ?? "");
  const prevAmount = Number(existing.data.amount ?? 0);
  const prevType = String(existing.data.type ?? "expense");

  const billingSync = await syncCardBillingOnDelete(
    supabase,
    householdId,
    transactionId,
    {
      accountId: prevAccountId,
      amount: prevAmount,
      type: prevType,
    },
  );

  if (billingSync.error) return fail(billingSync.error);

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
  revalidatePath("/accounts");

  const prevAccountType = prevAccountId
    ? await getAccountType(supabase, householdId, prevAccountId)
    : null;
  if (prevAccountType === "credit_card" && prevAccountId)
    revalidatePath(`/accounts/card/${prevAccountId}`);

  return ok("Transaction deleted.");
}
