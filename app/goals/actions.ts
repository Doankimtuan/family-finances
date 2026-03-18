"use server";

import { revalidatePath } from "next/cache";

import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";

import type { GoalActionState } from "./action-types";

function ok(message: string): GoalActionState {
  return { status: "success", message };
}

function fail(message: string): GoalActionState {
  return { status: "error", message };
}

async function getAccountBalanceSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  accountId: string,
) {
  const accountRes = await supabase
    .from("accounts")
    .select("opening_balance")
    .eq("household_id", householdId)
    .eq("id", accountId)
    .maybeSingle();

  if (accountRes.error || !accountRes.data) {
    return { balance: null as number | null, error: accountRes.error?.message ?? "Account not found." };
  }

  const txRes = await supabase
    .from("transactions")
    .select("account_id, counterparty_account_id, type, amount")
    .eq("household_id", householdId)
    .eq("is_non_cash", false)
    .or(`account_id.eq.${accountId},counterparty_account_id.eq.${accountId}`)
    .eq("status", "cleared");

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

export async function createGoalAction(
  _prev: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const goalType = String(formData.get("goalType") ?? "custom").trim();
  const targetAmount = Number(formData.get("targetAmount") ?? 0);
  const targetDate = String(formData.get("targetDate") ?? "").trim();
  const priority = Number(formData.get("priority") ?? 3);

  if (name.length < 2) return fail("Goal name must be at least 2 characters.");
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) return fail("Target amount must be positive.");
  if (![1, 2, 3, 4, 5].includes(priority)) return fail("Priority must be between 1 and 5.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const targetAmountRounded = Math.round(targetAmount);
  const insert = await supabase
    .from("goals")
    .insert({
      household_id: householdId,
      goal_type: goalType,
      name,
      target_amount: targetAmountRounded,
      target_date: targetDate.length > 0 ? targetDate : null,
      start_date: new Date().toISOString().slice(0, 10),
      priority,
      status: "active",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id) return fail(insert.error?.message ?? "Failed to create goal.");

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "goal.created",
    entityType: "goal",
    entityId: insert.data.id,
    payload: { goalType, name, targetAmount: targetAmountRounded, targetDate: targetDate || null, priority },
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return ok("Goal created.");
}

export async function addGoalContributionAction(
  _prev: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  const goalId = String(formData.get("goalId") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const contributionDate = String(formData.get("contributionDate") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const flowType = String(formData.get("flowType") ?? "inflow").trim();
  const accountId = String(formData.get("accountId") ?? "").trim();

  if (!goalId) return fail("Missing goal id.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Contribution amount must be greater than zero.");
  if (!contributionDate) return fail("Contribution date is required.");
  if (!(flowType === "inflow" || flowType === "outflow")) return fail("Invalid flow type.");
  if (!accountId) return fail("Account is required.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const goalResult = await supabase
    .from("goals")
    .select("id, name")
    .eq("household_id", householdId)
    .eq("id", goalId)
    .maybeSingle();
  if (goalResult.error || !goalResult.data) return fail(goalResult.error?.message ?? "Goal not found.");

  const accountResult = await supabase
    .from("accounts")
    .select("id, name")
    .eq("household_id", householdId)
    .eq("id", accountId)
    .eq("is_archived", false)
    .maybeSingle();
  if (accountResult.error || !accountResult.data) return fail(accountResult.error?.message ?? "Account not found.");

  const amountRounded = Math.round(amount);
  if (flowType === "inflow") {
    const snapshot = await getAccountBalanceSnapshot(supabase, householdId, accountId);
    if (snapshot.error) return fail(snapshot.error);
    if (snapshot.balance !== null && amountRounded > snapshot.balance) {
      return fail("Goal cash inflow not recorded: amount exceeds source account balance.");
    }
  }

  const insert = await supabase
    .from("goal_contributions")
    .insert({
      goal_id: goalId,
      household_id: householdId,
      contribution_date: contributionDate,
      amount: amountRounded,
      flow_type: flowType,
      source_account_id: flowType === "inflow" ? accountId : null,
      destination_account_id: flowType === "outflow" ? accountId : null,
      member_id: user.id,
      note: note.length > 0 ? note : null,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id) return fail(insert.error?.message ?? "Failed to add contribution.");

  const txInsert = await supabase
    .from("transactions")
    .insert({
      household_id: householdId,
      account_id: accountId,
      type: flowType === "inflow" ? "expense" : "income",
      amount: amountRounded,
      currency: "VND",
      transaction_date: contributionDate,
      description:
        flowType === "inflow"
          ? `Goal inflow: ${goalResult.data.name}`
          : `Goal outflow: ${goalResult.data.name}`,
      category_id: null,
      paid_by_member_id: user.id,
      status: "cleared",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (txInsert.error || !txInsert.data?.id) {
    await supabase.from("goal_contributions").delete().eq("id", insert.data.id);
    return fail(txInsert.error?.message ?? "Failed to record account cash flow for goal.");
  }

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "goal.contribution_added",
    entityType: "goal_contribution",
    entityId: insert.data.id,
    payload: { goalId, amount: amountRounded, contributionDate, flowType, accountId, transactionId: txInsert.data.id },
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  return ok("Goal cash flow recorded.");
}
