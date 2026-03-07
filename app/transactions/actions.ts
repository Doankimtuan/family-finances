"use server";

import { revalidatePath } from "next/cache";

import { isServerFeatureEnabled } from "@/lib/config/features";
import type { SpendingJarAlertLevel, SpendingJarSummaryRow } from "@/lib/jars/spending";
import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";

import type { TransactionActionState } from "./action-types";

function ok(message: string): TransactionActionState {
  return { status: "success", message };
}

function fail(message: string): TransactionActionState {
  return { status: "error", message };
}

type SpendingJarWarning = {
  jarId: string;
  jarName: string;
  alertLevel: SpendingJarAlertLevel;
  usagePercent: number | null;
  spent: number;
  limit: number;
};

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
    .select("opening_balance, type")
    .eq("household_id", householdId)
    .eq("id", accountId)
    .maybeSingle();

  if (accountRes.error || !accountRes.data) {
    return {
      balance: null as number | null,
      error: accountRes.error?.message ?? "Account not found.",
    };
  }

  // Credit cards operate on credit limit, not a deposited balance.
  // We skip the balance check — spending is always allowed up to the credit limit.
  // The credit limit constraint is handled separately through card_billing_months.
  if (accountRes.data.type === "credit_card") {
    return { balance: null as number | null, error: null as string | null };
  }

  let txQuery = supabase
    .from("transactions")
    .select("account_id, counterparty_account_id, type, amount")
    .eq("household_id", householdId)
    .or(`account_id.eq.${accountId},counterparty_account_id.eq.${accountId}`)
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
    if (row.type === "income" && row.account_id === accountId) balance += amount;
    if (row.type === "expense" && row.account_id === accountId) balance -= amount;
    if (row.type === "transfer") {
      if (row.account_id === accountId) balance -= amount;
      if (row.counterparty_account_id === accountId) balance += amount;
    }
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

async function ensureFallbackSpendingJarId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  userId: string,
): Promise<string | null> {
  const existing = await supabase
    .from("jar_definitions")
    .select("id")
    .eq("household_id", householdId)
    .eq("slug", "unassigned")
    .eq("is_archived", false)
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id;

  await supabase.from("jar_definitions").upsert(
    {
      household_id: householdId,
      name: "Unassigned",
      slug: "unassigned",
      color: "#64748B",
      icon: "archive",
      sort_order: 999,
      is_system_default: true,
      is_archived: false,
      created_by: userId,
    },
    { onConflict: "household_id,slug", ignoreDuplicates: true },
  );

  const afterUpsert = await supabase
    .from("jar_definitions")
    .select("id")
    .eq("household_id", householdId)
    .eq("slug", "unassigned")
    .eq("is_archived", false)
    .limit(1)
    .maybeSingle();

  return afterUpsert.data?.id ?? null;
}

async function ensureSpendingJarCategoryMapping(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  categoryId: string,
  userId: string,
) {
  const existing = await supabase
    .from("spending_jar_category_map")
    .select("jar_id")
    .eq("household_id", householdId)
    .eq("category_id", categoryId)
    .limit(1)
    .maybeSingle();

  if (existing.data?.jar_id) return existing.data.jar_id;

  const fallbackJarId = await ensureFallbackSpendingJarId(
    supabase,
    householdId,
    userId,
  );
  if (!fallbackJarId) return null;

  await supabase.from("spending_jar_category_map").upsert(
    {
      household_id: householdId,
      category_id: categoryId,
      jar_id: fallbackJarId,
      created_by: userId,
    },
    { onConflict: "household_id,category_id", ignoreDuplicates: true },
  );

  return fallbackJarId;
}

async function getSpendingJarWarningForCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  categoryId: string | null,
  userId: string,
): Promise<SpendingJarWarning | null> {
  if (!isServerFeatureEnabled("jars") || !categoryId) return null;

  await ensureSpendingJarCategoryMapping(supabase, householdId, categoryId, userId);

  const monthStart = `${new Date().toISOString().slice(0, 7)}-01`;
  const summaryResult = await supabase.rpc("rpc_spending_jar_monthly_summary", {
    p_household_id: householdId,
    p_month: monthStart,
  });

  if (summaryResult.error) return null;

  const rows = (summaryResult.data ?? []) as SpendingJarSummaryRow[];
  const mapRow = await supabase
    .from("spending_jar_category_map")
    .select("jar_id")
    .eq("household_id", householdId)
    .eq("category_id", categoryId)
    .limit(1)
    .maybeSingle();

  const jarId = mapRow.data?.jar_id;
  if (!jarId) return null;

  const jarSummary = rows.find((row) => row.jar_id === jarId);
  if (!jarSummary) return null;
  if (
    jarSummary.alert_level !== "warning" &&
    jarSummary.alert_level !== "exceeded"
  ) {
    return null;
  }

  return {
    jarId: jarSummary.jar_id,
    jarName: jarSummary.jar_name,
    alertLevel: jarSummary.alert_level,
    usagePercent:
      jarSummary.usage_percent === null || jarSummary.usage_percent === undefined
        ? null
        : Number(jarSummary.usage_percent),
    spent: Number(jarSummary.monthly_spent ?? 0),
    limit: Number(jarSummary.monthly_limit ?? 0),
  };
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
  revalidatePath("/jars");

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
  revalidatePath("/jars");

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

function revalidateTransactionRelatedPaths() {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/budgets");
  revalidatePath("/jars");
}

async function getAccountType(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  accountId: string,
): Promise<string | null> {
  const result = await supabase
    .from("accounts")
    .select("type")
    .eq("household_id", householdId)
    .eq("id", accountId)
    .maybeSingle();
  if (result.error || !result.data?.type) return null;
  return result.data.type;
}

async function resolveCardBillingMonth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  cardAccountId: string,
  transactionDate: string,
): Promise<{ id: string; billing_month: string } | null> {
  const settings = await supabase
    .from("credit_card_settings")
    .select("statement_day")
    .eq("account_id", cardAccountId)
    .maybeSingle();
  const statementDay = settings.data?.statement_day ?? 25;

  const d = new Date(`${transactionDate}T00:00:00.000Z`);
  let year = d.getUTCFullYear();
  let monthIdx = d.getUTCMonth();
  if (d.getUTCDate() > statementDay) {
    monthIdx += 1;
    if (monthIdx > 11) {
      monthIdx = 0;
      year += 1;
    }
  }
  const billingMonth = `${year}-${String(monthIdx + 1).padStart(2, "0")}-01`;

  await supabase.from("card_billing_months").upsert(
    {
      household_id: householdId,
      card_account_id: cardAccountId,
      billing_month: billingMonth,
    },
    { onConflict: "card_account_id,billing_month" },
  );

  const monthResult = await supabase
    .from("card_billing_months")
    .select("id, billing_month")
    .eq("card_account_id", cardAccountId)
    .eq("billing_month", billingMonth)
    .maybeSingle();

  if (monthResult.error || !monthResult.data) return null;
  return monthResult.data;
}

function signedCardAmount(type: string, amount: number): number {
  return type === "income" ? -Math.round(amount) : Math.round(amount);
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

  // Keep card billing tables in sync when a credit-card transaction is edited.
  const prevAccountId = String(existing.data.account_id ?? "");
  const prevAmount = Number(existing.data.amount ?? 0);
  const prevType = String(existing.data.type ?? "expense");
  const prevDate = String(existing.data.transaction_date ?? transactionDate);
  const prevSigned = signedCardAmount(prevType, prevAmount);
  const nextSigned = signedCardAmount(type, amountRounded);

  const prevAccountType = prevAccountId
    ? await getAccountType(supabase, householdId, prevAccountId)
    : null;
  const nextAccountType = await getAccountType(supabase, householdId, accountId);

  const prevIsCard = prevAccountType === "credit_card";
  const nextIsCard = nextAccountType === "credit_card";

  if (prevIsCard || nextIsCard) {
    const billingItemResult = await supabase
      .from("card_billing_items")
      .select(
        "id, billing_month_id, card_account_id, is_converted_to_installment, item_type",
      )
      .eq("household_id", householdId)
      .eq("transaction_id", transactionId)
      .maybeSingle();

    const billingItem = billingItemResult.data;

    if (billingItem?.is_converted_to_installment) {
      // Prevent unsafe edit once original card item has been converted to installment.
      const financiallySensitiveChanged =
        prevAmount !== amountRounded ||
        prevDate !== transactionDate ||
        prevAccountId !== accountId;
      if (financiallySensitiveChanged) {
        return fail(
          "Cannot edit amount/date/account for a transaction already converted to installments.",
        );
      }
    } else if (billingItem && billingItem.item_type === "standard") {
      const oldMonthId = billingItem.billing_month_id;
      const oldCardId = billingItem.card_account_id;

      if (!nextIsCard) {
        // Moved away from card account: remove billing item + statement contribution.
        await supabase.rpc("increment_statement_amount", {
          month_id: oldMonthId,
          inc: -prevSigned,
        });
        await supabase
          .from("card_billing_items")
          .delete()
          .eq("id", billingItem.id);
      } else {
        const targetMonth = await resolveCardBillingMonth(
          supabase,
          householdId,
          accountId,
          transactionDate,
        );
        if (targetMonth) {
          const sameMonth = oldMonthId === targetMonth.id;
          const sameCard = oldCardId === accountId;

          if (sameMonth && sameCard) {
            const delta = nextSigned - prevSigned;
            if (delta !== 0) {
              await supabase.rpc("increment_statement_amount", {
                month_id: oldMonthId,
                inc: delta,
              });
            }
            await supabase
              .from("card_billing_items")
              .update({
                card_account_id: accountId,
                amount: amountRounded,
                description,
              })
              .eq("id", billingItem.id);
          } else {
            await supabase.rpc("increment_statement_amount", {
              month_id: oldMonthId,
              inc: -prevSigned,
            });
            await supabase.rpc("increment_statement_amount", {
              month_id: targetMonth.id,
              inc: nextSigned,
            });
            await supabase
              .from("card_billing_items")
              .update({
                card_account_id: accountId,
                billing_month_id: targetMonth.id,
                amount: amountRounded,
                description,
              })
              .eq("id", billingItem.id);
          }
        }
      }
    } else if (!billingItem && nextIsCard && (type === "expense" || type === "income")) {
      // Was non-card before, now moved to card: create matching standard billing item.
      const targetMonth = await resolveCardBillingMonth(
        supabase,
        householdId,
        accountId,
        transactionDate,
      );
      if (targetMonth) {
        await supabase.from("card_billing_items").insert({
          household_id: householdId,
          card_account_id: accountId,
          billing_month_id: targetMonth.id,
          transaction_id: transactionId,
          description: description ?? `Giao dịch thẻ ${transactionDate}`,
          amount: amountRounded,
          item_type: "standard",
        });
        await supabase.rpc("increment_statement_amount", {
          month_id: targetMonth.id,
          inc: nextSigned,
        });
      }
    }
  }

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
  revalidatePath("/money");
  if (prevIsCard && prevAccountId) revalidatePath(`/money/card/${prevAccountId}`);
  if (nextIsCard) revalidatePath(`/money/card/${accountId}`);
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

  const { supabase, user, householdId, error } = await resolveContext();
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
  const prevSigned = signedCardAmount(prevType, prevAmount);
  const prevAccountType = prevAccountId
    ? await getAccountType(supabase, householdId, prevAccountId)
    : null;
  const prevIsCard = prevAccountType === "credit_card";

  if (prevIsCard) {
    const billingItemResult = await supabase
      .from("card_billing_items")
      .select(
        "id, billing_month_id, is_converted_to_installment, item_type",
      )
      .eq("household_id", householdId)
      .eq("transaction_id", transactionId)
      .maybeSingle();

    const billingItem = billingItemResult.data;
    if (billingItem?.is_converted_to_installment) {
      return fail(
        "Cannot delete a transaction already converted to installments.",
      );
    }

    if (billingItem && billingItem.item_type === "standard") {
      await supabase.rpc("increment_statement_amount", {
        month_id: billingItem.billing_month_id,
        inc: -prevSigned,
      });
      await supabase
        .from("card_billing_items")
        .delete()
        .eq("id", billingItem.id);
    }
  }

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
  revalidatePath("/money");
  if (prevIsCard && prevAccountId) revalidatePath(`/money/card/${prevAccountId}`);
  return ok("Transaction deleted.");
}
