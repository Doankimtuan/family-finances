/**
 * Phase G1 — minimal deterministic E2E fixtures.
 *
 * Unlocks Plan (BR-08) and ensures a non-negative liquid Cash balance so
 * allocate/reallocate/goal contribute and savings funding can be verified.
 *
 * Usage (service role):
 *   SUPABASE_SERVICE_ROLE_KEY=... E2E_USER_EMAIL=... node scripts/g1-seed-e2e-fixtures.mjs
 *
 * Safe to rerun: ritual unlock is status-gated; cash top-up uses a fixed
 * idempotency key; second liquid account uses a fixed name marker.
 */

import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.E2E_USER_EMAIL;

const FIXTURE_CASH_TOPUP_KEY = "e2e-fixture-cash-topup-v1";
const FIXTURE_CASH_TOPUP_AMOUNT = 5_000_000;
const FIXTURE_SECOND_ACCOUNT_NAME = "E2E Transfer Dest";
const FIXTURE_UNLOCK_NOTE = "E2E fixture unlock";

if (!url || !serviceKey || !email) {
  console.error(
    "MISSING_ENV: need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, E2E_USER_EMAIL",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: users, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw listError;

  const user = users.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!user) {
    console.error("E2E_USER_NOT_FOUND", email);
    process.exit(1);
  }

  const { data: membership, error: memberError } = await admin
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!membership?.household_id) {
    console.error("E2E_USER_NO_HOUSEHOLD");
    process.exit(1);
  }

  const householdId = membership.household_id;

  const { data: unlocked, error: unlockError } = await admin
    .from("month_ritual_runs")
    .update({
      status: "corrected",
      correction_note: FIXTURE_UNLOCK_NOTE,
      corrected_at: new Date().toISOString(),
      auto_locked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("household_id", householdId)
    .in("status", ["approved", "pending_review"])
    .select("id, period_month, status");
  if (unlockError) throw unlockError;

  const { data: cashAccount, error: cashError } = await admin
    .from("accounts")
    .select("id, name, type, opening_balance, is_archived")
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .eq("type", "cash")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (cashError) throw cashError;
  if (!cashAccount) {
    console.error("E2E_NO_CASH_ACCOUNT");
    process.exit(1);
  }

  const { data: existingTopup } = await admin
    .from("transactions")
    .select("id")
    .eq("household_id", householdId)
    .eq("idempotency_key", FIXTURE_CASH_TOPUP_KEY)
    .maybeSingle();

  if (!existingTopup) {
    const { error: topupError } = await admin.from("transactions").insert({
      household_id: householdId,
      account_id: cashAccount.id,
      type: "income",
      amount: FIXTURE_CASH_TOPUP_AMOUNT,
      currency: "VND",
      transaction_date: new Date().toISOString().slice(0, 10),
      note: "E2E fixture cash top-up",
      status: "posted",
      idempotency_key: FIXTURE_CASH_TOPUP_KEY,
      created_by: user.id,
      source: "manual",
    });
    if (topupError) throw topupError;
  }

  const { data: liquidAccounts, error: liquidError } = await admin
    .from("accounts")
    .select("id, name, type")
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .in("type", [
      "cash",
      "checking",
      "savings",
      "ewallet",
      "brokerage",
      "other",
    ]);
  if (liquidError) throw liquidError;

  let secondAccountId =
    liquidAccounts?.find((a) => a.id !== cashAccount.id)?.id ?? null;

  if (!secondAccountId) {
    const { data: created, error: createError } = await admin
      .from("accounts")
      .insert({
        household_id: householdId,
        name: FIXTURE_SECOND_ACCOUNT_NAME,
        type: "checking",
        opening_balance: 0,
        is_archived: false,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (createError) throw createError;
    secondAccountId = created.id;
  }

  console.error(
    JSON.stringify(
      {
        ok: true,
        householdId,
        unlockedRituals: unlocked?.length ?? 0,
        cashAccountId: cashAccount.id,
        secondAccountId,
        cashTopupApplied: !existingTopup,
        cashTopupAmount: FIXTURE_CASH_TOPUP_AMOUNT,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
