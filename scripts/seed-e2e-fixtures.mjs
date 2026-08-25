/**
 * Minimal deterministic E2E fixtures.
 *
 * Unlocks Plan (BR-08) and ensures a non-negative liquid Cash balance so
 * allocate/reallocate/goal contribute and savings funding can be verified.
 *
 * Usage (service role):
 *   SUPABASE_SERVICE_ROLE_KEY=... E2E_USER_EMAIL=... node scripts/seed-e2e-fixtures.mjs
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
const FIXTURE_PROVIDER_PREFIX = "e2e-savings-13d";
const FIXTURE_PACKAGE_NAME = "E2E 30-day package";
const FIXTURE_PACKAGE_RULES = [
  "roll_principal_interest",
  "roll_principal_only",
  "withdraw_everything",
];

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

  const providerFixtures = [
    {
      family: "BANK",
      key: `${FIXTURE_PROVIDER_PREFIX}-${householdId}-bank`,
      name: "E2E Bank Savings",
      savingType: "bank_deposit",
      iconKey: "bank",
      taxRule: "NONE",
      taxRatePercent: 0,
    },
    {
      family: "PLATFORM",
      key: `${FIXTURE_PROVIDER_PREFIX}-${householdId}-platform`,
      name: "E2E Platform Savings",
      savingType: "digital_saving",
      iconKey: "wallet",
      taxRule: "PROFIT_PERCENTAGE",
      taxRatePercent: 5,
    },
  ];

  for (const fixture of providerFixtures) {
    const { data: provider, error: providerLookupError } = await admin
      .from("saving_providers")
      .select("id")
      .eq("provider_key", fixture.key)
      .eq("household_id", householdId)
      .maybeSingle();
    if (providerLookupError) throw providerLookupError;

    let providerId = provider?.id;
    if (!providerId) {
      const { data: createdProvider, error: providerInsertError } = await admin
        .from("saving_providers")
        .insert({
          household_id: householdId,
          created_by: user.id,
          provider_key: fixture.key,
          display_name: fixture.name,
          saving_type: fixture.savingType,
          family: fixture.family,
          icon_key: fixture.iconKey,
          is_system: false,
          is_active: true,
          metadata: { fixture: FIXTURE_PROVIDER_PREFIX },
        })
        .select("id")
        .single();
      if (providerInsertError) throw providerInsertError;
      providerId = createdProvider.id;
    } else {
      const { error: providerUpdateError } = await admin
        .from("saving_providers")
        .update({
          is_active: true,
          family: fixture.family,
          saving_type: fixture.savingType,
        })
        .eq("id", providerId);
      if (providerUpdateError) throw providerUpdateError;
    }

    const { data: packageRow, error: packageLookupError } = await admin
      .from("saving_packages")
      .select("id")
      .eq("provider_id", providerId)
      .eq("package_name", FIXTURE_PACKAGE_NAME)
      .maybeSingle();
    if (packageLookupError) throw packageLookupError;
    const packageValues = {
      provider_id: providerId,
      package_name: FIXTURE_PACKAGE_NAME,
      duration_days: 30,
      term_amount: 30,
      term_unit: "DAY",
      annual_interest_rate: 6,
      interest_calculation_method: "simple",
      currency: "VND",
      tax_rule: fixture.taxRule,
      tax_rate_percent: fixture.taxRatePercent,
      min_amount: 100_000,
      max_amount: 100_000_000,
      settlement_rules: FIXTURE_PACKAGE_RULES,
      penalty_rules: [],
      early_settlement_rule: "RETURN_PRINCIPAL_ONLY",
      early_settlement_rate_percent: null,
      renewable_available: true,
      supports_partial_settlement: false,
      is_active: true,
    };
    const packageMutation = packageRow
      ? admin
          .from("saving_packages")
          .update(packageValues)
          .eq("id", packageRow.id)
      : admin.from("saving_packages").insert(packageValues);
    const { error: packageMutationError } = await packageMutation;
    if (packageMutationError) throw packageMutationError;
  }

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
