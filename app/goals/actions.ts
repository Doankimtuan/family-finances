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

  if (!goalId) return fail("Missing goal id.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Contribution amount must be greater than zero.");
  if (!contributionDate) return fail("Contribution date is required.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const amountRounded = Math.round(amount);
  const insert = await supabase
    .from("goal_contributions")
    .insert({
      goal_id: goalId,
      household_id: householdId,
      contribution_date: contributionDate,
      amount: amountRounded,
      member_id: user.id,
      note: note.length > 0 ? note : null,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id) return fail(insert.error?.message ?? "Failed to add contribution.");

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "goal.contribution_added",
    entityType: "goal_contribution",
    entityId: insert.data.id,
    payload: { goalId, amount: amountRounded, contributionDate },
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return ok("Contribution added.");
}
