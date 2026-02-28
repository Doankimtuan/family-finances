"use server";

import { revalidatePath } from "next/cache";

import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";

import type { AccountActionState } from "./action-types";

function ok(message: string): AccountActionState {
  return { status: "success", message };
}

function fail(message: string): AccountActionState {
  return { status: "error", message };
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

export async function createAccountAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "checking").trim();
  const openingBalance = Number(formData.get("openingBalance") ?? 0);
  // Credit card extra fields
  const creditLimit = Number(formData.get("creditLimit") ?? 0);
  const statementDay = Number(formData.get("statementDay") ?? 25);
  const linkedBankAccountId = String(
    formData.get("linkedBankAccountId") ?? "",
  ).trim();

  if (name.length < 2)
    return fail("Account name must be at least 2 characters.");
  if (!Number.isFinite(openingBalance) || openingBalance < 0)
    return fail("Opening balance must be non-negative.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId)
    return fail(error ?? "No household found.");

  const openingBalanceRounded = Math.round(openingBalance);
  const insert = await supabase
    .from("accounts")
    .insert({
      household_id: householdId,
      name,
      type,
      opening_balance: openingBalanceRounded,
      opening_balance_date: new Date().toISOString().slice(0, 10),
      include_in_net_worth: true,
      is_archived: false,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id)
    return fail(insert.error?.message ?? "Failed to create account.");

  // If credit card, initialize settings with user-supplied values
  if (type === "credit_card") {
    const settingsInsert = await supabase.from("credit_card_settings").insert({
      account_id: insert.data.id,
      credit_limit: Math.round(creditLimit),
      statement_day:
        statementDay >= 1 && statementDay <= 31 ? statementDay : 25,
      due_day: 15,
      linked_bank_account_id:
        linkedBankAccountId && linkedBankAccountId !== "_none"
          ? linkedBankAccountId
          : null,
    });
    if (settingsInsert.error) {
      // Non-fatal — log but don't block
      console.error(
        "credit_card_settings insert error:",
        settingsInsert.error.message,
      );
    }
  }

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "account.created",
    entityType: "account",
    entityId: insert.data.id,
    payload: { name, type, openingBalance: openingBalanceRounded },
  });

  revalidatePath("/money");
  revalidatePath("/accounts");
  revalidatePath("/transactions");

  return ok("Account created.");
}

export async function archiveAccountAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const accountId = String(formData.get("accountId") ?? "").trim();
  if (!accountId) return fail("Missing account id.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId)
    return fail(error ?? "No household found.");

  const update = await supabase
    .from("accounts")
    .update({ is_archived: true })
    .eq("id", accountId);

  if (update.error) return fail(update.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "account.archived",
    entityType: "account",
    entityId: accountId,
  });

  revalidatePath("/accounts");
  revalidatePath("/transactions");

  return ok("Account archived.");
}
