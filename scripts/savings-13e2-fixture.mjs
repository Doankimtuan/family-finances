/** Deterministic authenticated Savings lifecycle fixtures for 13E.2. */

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.E2E_USER_EMAIL;
const outputPath = resolve(
  process.cwd(),
  process.env.SAVINGS_FIXTURE_PATH ??
    "output/playwright/savings-13e2-fixture.json",
);
const FIXTURE_PREFIX = process.env.SAVINGS_FIXTURE_PREFIX ?? "e2e-savings-13e2";
const PRINCIPAL = 1_000_000;
const RENEWAL_POLICY = "always_ask";
const RENEWAL_PREFERENCE = "manual_review";
const SAVINGS_FAMILY = { BANK: "BANK", PLATFORM: "PLATFORM" };
const CYCLE_STATUS = {
  ACTIVE: "active",
  MATURED: "matured",
  EARLY_CLOSED: "early_closed",
  ROLLED: "rolled",
};

if (!url || !serviceKey || !email) {
  throw new Error(
    "E2E_USER_EMAIL, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required",
  );
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function one(query, label) {
  const { data, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  if (!data) throw new Error(`${label}: no row`);
  return data;
}

function isoDate(offsetDays) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function packageSnapshot(pkg, provider) {
  return {
    packageId: pkg.id,
    packageName: pkg.package_name,
    durationDays: pkg.duration_days,
    annualInterestRate: pkg.annual_interest_rate,
    settlementRules: pkg.settlement_rules,
    penaltyRules: pkg.penalty_rules,
    renewableAvailable: pkg.renewable_available,
    minAmount: pkg.min_amount,
    maxAmount: pkg.max_amount,
    termAmount: pkg.term_amount,
    termUnit: pkg.term_unit,
    interestCalculationMethod: pkg.interest_calculation_method,
    currency: pkg.currency,
    taxRule: pkg.tax_rule,
    taxRatePercent: pkg.tax_rate_percent,
    earlySettlementRule: pkg.early_settlement_rule,
    earlySettlementRatePercent: pkg.early_settlement_rate_percent,
    supportsPartialSettlement: pkg.supports_partial_settlement,
    providerId: provider.id,
    providerFamily: provider.family,
  };
}

function productSnapshot(pkg, provider, fixtureKey) {
  return {
    fixtureKey,
    packageId: pkg.id,
    providerId: provider.id,
    productName: pkg.package_name,
    packageName: pkg.package_name,
    depositTermDays: pkg.duration_days,
    annualInterestRate: pkg.annual_interest_rate,
    interestCalculationMethod: pkg.interest_calculation_method,
    settlementRule: "withdraw_everything",
    renewalPolicy: RENEWAL_POLICY,
    renewalPreference: RENEWAL_PREFERENCE,
    penaltyStrategy: "no_interest",
    providerRules: {},
    savingsFamily: provider.family,
    providerNameSnapshot: provider.display_name,
    providerKey: provider.provider_key,
    currency: pkg.currency,
    taxRule: pkg.tax_rule,
    taxRatePercent: pkg.tax_rate_percent,
    termAmount: pkg.term_amount,
    termUnit: pkg.term_unit,
    settlementRules: pkg.settlement_rules,
    earlySettlementRule: pkg.early_settlement_rule,
    earlySettlementRatePercent: pkg.early_settlement_rate_percent,
    supportsPartialSettlement: pkg.supports_partial_settlement,
  };
}

async function main() {
  const { data: users, error: usersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (usersError) throw usersError;
  const user = users.users.find(
    (item) => item.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!user) throw new Error("E2E user not found");

  const membership = await one(
    admin
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
    "active household membership",
  );
  const householdId = membership.household_id;

  const providers = {};
  for (const family of Object.values(SAVINGS_FAMILY)) {
    const providerKey = `${FIXTURE_PREFIX}-${family.toLowerCase()}`;
    let provider = await admin
      .from("saving_providers")
      .select("id, display_name, provider_key, family")
      .eq("household_id", householdId)
      .eq("provider_key", providerKey)
      .maybeSingle();
    if (provider.error)
      throw new Error(`${family} provider: ${provider.error.message}`);
    if (!provider.data) {
      provider = await admin
        .from("saving_providers")
        .insert({
          household_id: householdId,
          created_by: user.id,
          provider_key: providerKey,
          display_name: `E2E 13E2 ${family} Savings`,
          saving_type: family === "BANK" ? "bank_deposit" : "digital_saving",
          family,
          icon_key: family === "BANK" ? "bank" : "wallet",
          is_system: false,
          is_active: true,
          metadata: { fixture: FIXTURE_PREFIX },
        })
        .select("id, display_name, provider_key, family")
        .single();
      if (provider.error)
        throw new Error(`${family} provider: ${provider.error.message}`);
    }
    providers[family] = provider.data;
  }

  const packages = {};
  for (const family of Object.values(SAVINGS_FAMILY)) {
    const existingPackage = await admin
      .from("saving_packages")
      .select(
        "id, package_name, duration_days, annual_interest_rate, settlement_rules, penalty_rules, renewable_available, min_amount, max_amount, term_amount, term_unit, interest_calculation_method, currency, tax_rule, tax_rate_percent, early_settlement_rule, early_settlement_rate_percent, supports_partial_settlement",
      )
      .eq("provider_id", providers[family].id)
      .eq("is_active", true)
      .order("duration_days")
      .limit(1)
      .maybeSingle();
    if (existingPackage.error)
      throw new Error(`${family} package: ${existingPackage.error.message}`);
    if (existingPackage.data) {
      packages[family] = existingPackage.data;
    } else {
      packages[family] = await one(
        admin
          .from("saving_packages")
          .insert({
            provider_id: providers[family].id,
            package_name: `E2E 13E2 ${family} 30-day package`,
            duration_days: 30,
            term_amount: 30,
            term_unit: "DAY",
            annual_interest_rate: 6,
            interest_calculation_method: "simple",
            currency: "VND",
            tax_rule: family === "BANK" ? "NONE" : "PROFIT_PERCENTAGE",
            tax_rate_percent: family === "BANK" ? 0 : 5,
            min_amount: 100_000,
            max_amount: 100_000_000,
            settlement_rules: [
              "roll_principal_interest",
              "roll_principal_only",
              "withdraw_everything",
            ],
            penalty_rules: [],
            early_settlement_rule: "RETURN_PRINCIPAL_ONLY",
            early_settlement_rate_percent: null,
            renewable_available: true,
            supports_partial_settlement: false,
            is_active: true,
          })
          .select(
            "id, package_name, duration_days, annual_interest_rate, settlement_rules, penalty_rules, renewable_available, min_amount, max_amount, term_amount, term_unit, interest_calculation_method, currency, tax_rule, tax_rate_percent, early_settlement_rule, early_settlement_rate_percent, supports_partial_settlement",
          )
          .single(),
        `${family} package`,
      );
    }
  }

  const accounts = await one(
    admin
      .from("accounts")
      .select("id, name, type")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .in("type", ["cash", "checking", "savings", "ewallet"])
      .order("created_at"),
    "eligible accounts",
  );
  if (accounts.length < 2) throw new Error("Two eligible accounts required");
  const fundingAccount = accounts[0];
  const settlementAccount = accounts.find(
    (account) => account.id !== fundingAccount.id,
  );

  const oldFixtures = await one(
    admin
      .from("savings")
      .select("id")
      .eq("household_id", householdId)
      .like("product_name", `${FIXTURE_PREFIX}:%`),
    "existing Savings 13E.2 fixtures",
  );
  const oldSavingIds = oldFixtures.map((saving) => saving.id);
  if (oldSavingIds.length > 0) {
    const { error } = await admin
      .from("inbox_items")
      .delete()
      .eq("household_id", householdId)
      .in("kind", ["savings_maturity", "early_withdrawal_confirmation"])
      .in("source_id", oldSavingIds);
    if (error) throw error;
  }

  await admin
    .from("savings")
    .delete()
    .eq("household_id", householdId)
    .like("product_name", `${FIXTURE_PREFIX}:%`);

  const fixtureDefinitions = [
    ["early-withdrawal", "active", CYCLE_STATUS.ACTIVE, -1, 29],
    ["maturity-settlement", "matured", CYCLE_STATUS.MATURED, -31, -1],
    ["principal-only-rollover", "matured", CYCLE_STATUS.MATURED, -31, -1],
    ["principal-interest-rollover", "matured", CYCLE_STATUS.MATURED, -31, -1],
    ["settled-terminal", "closed", CYCLE_STATUS.ROLLED, -31, -1],
    [
      "early-settled-terminal",
      "early_closed",
      CYCLE_STATUS.EARLY_CLOSED,
      -1,
      29,
    ],
  ];
  const fixtures = {};

  for (const [
    key,
    savingStatus,
    cycleStatus,
    startOffset,
    endOffset,
  ] of fixtureDefinitions) {
    const family = key === "early-withdrawal" ? "PLATFORM" : "BANK";
    const provider = providers[family];
    const pkg = packages[family];
    const snapshot = productSnapshot(pkg, provider, `${FIXTURE_PREFIX}:${key}`);
    const saving = await one(
      admin
        .from("savings")
        .insert({
          household_id: householdId,
          status: savingStatus,
          funding_account_id: fundingAccount.id,
          settlement_account_id: settlementAccount.id,
          provider_id: provider.id,
          product_name: `${FIXTURE_PREFIX}:${key}`,
          product_snapshot: snapshot,
          renewal_preference: RENEWAL_PREFERENCE,
          renewal_policy: RENEWAL_POLICY,
          renewal_config: {
            preferredPackageId: pkg.id,
            preferredSettlementRule: "withdraw_everything",
            preferredSettlementAccountId: settlementAccount.id,
          },
          maturity_instruction: {
            strategy: "withdraw_everything",
            targetMode: "keep_current_package",
            targetPackageId: pkg.id,
            payoutAccountId: settlementAccount.id,
            fallbackPolicy: "ask_user",
          },
          financial_scope: "household",
          owner_membership_id: null,
          created_by: user.id,
        })
        .select("id")
        .single(),
      `${key} saving`,
    );
    const cycle = await one(
      admin
        .from("saving_cycles")
        .insert({
          saving_id: saving.id,
          cycle_number: 1,
          start_date: isoDate(startOffset),
          end_date: isoDate(endOffset),
          principal: PRINCIPAL,
          locked_rate: pkg.annual_interest_rate,
          package_snapshot: packageSnapshot(pkg, provider),
          status: cycleStatus,
          accrued_interest: 0,
        })
        .select("id")
        .single(),
      `${key} cycle`,
    );
    fixtures[key] = { savingId: saving.id, cycleId: cycle.id, family };
  }

  const output = {
    householdId,
    accounts: {
      fundingAccountId: fundingAccount.id,
      settlementAccountId: settlementAccount.id,
    },
    providers: Object.fromEntries(
      Object.entries(providers).map(([family, provider]) => [
        family,
        provider.id,
      ]),
    ),
    packages: Object.fromEntries(
      Object.entries(packages).map(([family, pkg]) => [family, pkg.id]),
    ),
    fixtures,
    createdAt: new Date().toISOString(),
  };
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.error(JSON.stringify(output, null, 2));
}

await main();
