/**
 * HOME 14C.1 deterministic fixture.
 *
 *   node scripts/home-14c1-fixture.mjs setup
 *   node scripts/home-14c1-fixture.mjs cleanup
 */
import { rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const PREFIX = "HOME 14C1";
const STATE_PATH = resolve(
  process.cwd(),
  "output/playwright/home-14c1-fixture.json",
);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = (
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
)?.trim();
const email = process.env.E2E_USER_EMAIL?.trim().toLowerCase();

if (!url || !serviceKey || !email)
  throw new Error("Home fixture environment is incomplete");
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const run = promisify(execFile);

async function target() {
  const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (users.error) throw users.error;
  const user = users.data.users.find(
    (candidate) => candidate.email?.toLowerCase() === email,
  );
  if (!user) throw new Error("E2E user not found");
  const { data, error } = await admin
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();
  if (error) throw error;
  return { userId: user.id, householdId: data.household_id };
}

async function cleanup(householdId) {
  const holdings = await admin
    .from("investment_holdings")
    .select("id, instrument_id")
    .eq("household_id", householdId)
    .like("name", `${PREFIX} %`);
  if (holdings.error) throw holdings.error;
  const holdingIds = (holdings.data ?? []).map((row) => row.id);
  const instrumentIds = (holdings.data ?? [])
    .map((row) => row.instrument_id)
    .filter(Boolean);
  if (holdingIds.length) {
    const valuations = await admin
      .from("investment_valuations")
      .delete()
      .in("holding_id", holdingIds);
    if (valuations.error) throw valuations.error;
    const operations = await admin
      .from("investment_operations")
      .delete()
      .eq("household_id", householdId)
      .or(
        `source_holding_id.in.(${holdingIds.join(",")}),destination_holding_id.in.(${holdingIds.join(",")})`,
      );
    if (operations.error) throw operations.error;
    const deleted = await admin
      .from("investment_holdings")
      .delete()
      .in("id", holdingIds);
    if (deleted.error) throw deleted.error;
  }
  if (instrumentIds.length) {
    const prices = await admin
      .from("market_instrument_prices")
      .delete()
      .in("instrument_id", instrumentIds);
    if (prices.error) throw prices.error;
    const instruments = await admin
      .from("market_instruments")
      .delete()
      .in("id", instrumentIds);
    if (instruments.error) throw instruments.error;
  }
  const savings = await admin
    .from("savings")
    .select("id")
    .eq("household_id", householdId)
    .like("product_name", `${PREFIX} %`);
  if (savings.error) throw savings.error;
  const savingIds = (savings.data ?? []).map((row) => row.id);
  if (savingIds.length) {
    const cycles = await admin
      .from("saving_cycles")
      .delete()
      .in("saving_id", savingIds);
    if (cycles.error) throw cycles.error;
    const deleted = await admin.from("savings").delete().in("id", savingIds);
    if (deleted.error) throw deleted.error;
  }
  const debts = await admin
    .from("liabilities")
    .delete()
    .eq("household_id", householdId)
    .like("name", `${PREFIX} %`);
  if (debts.error) throw debts.error;
}

async function setup() {
  const { userId, householdId } = await target();
  await cleanup(householdId);
  await run(process.execPath, ["scripts/loans-11e-fixture.mjs", "setup"]);
  const accounts = await admin
    .from("accounts")
    .select("id")
    .eq("household_id", householdId)
    .limit(1)
    .single();
  if (accounts.error) throw accounts.error;
  const accountId = accounts.data.id;
  const today = new Date().toISOString().slice(0, 10);
  const staleDate = new Date(Date.now() - 4 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const instruments = await admin
    .from("market_instruments")
    .insert([
      {
        name: `${PREFIX} healthy`,
        symbol: "H14C",
        asset_class: "stock",
        currency: "VND",
        pricing_mode: "UNIT_PRICE",
        auto_price_supported: true,
        is_active: true,
        metadata: { fixture: PREFIX },
      },
      {
        name: `${PREFIX} stale`,
        symbol: "S14C",
        asset_class: "stock",
        currency: "VND",
        pricing_mode: "UNIT_PRICE",
        auto_price_supported: true,
        is_active: true,
        metadata: { fixture: PREFIX },
      },
    ])
    .select("id, name");
  if (instruments.error) throw instruments.error;
  const healthy = instruments.data.find((row) => row.name.endsWith("healthy"));
  const stale = instruments.data.find((row) => row.name.endsWith("stale"));
  const holdings = await admin
    .from("investment_holdings")
    .insert([
      {
        household_id: householdId,
        name: `${PREFIX} healthy holding`,
        asset_class: "stock",
        instrument_id: healthy.id,
        quantity: 10,
        remaining_total_cost_basis: 900000,
        history_status: "full",
        visibility_context: "household",
        lifecycle_status: "active",
        created_by: userId,
      },
      {
        household_id: householdId,
        name: `${PREFIX} stale holding`,
        asset_class: "stock",
        instrument_id: stale.id,
        quantity: 10,
        remaining_total_cost_basis: 900000,
        history_status: "full",
        visibility_context: "household",
        lifecycle_status: "active",
        created_by: userId,
      },
      {
        household_id: householdId,
        name: `${PREFIX} unknown holding`,
        asset_class: "stock",
        quantity: 10,
        remaining_total_cost_basis: null,
        history_status: "cost_basis_unknown",
        visibility_context: "household",
        lifecycle_status: "active",
        created_by: userId,
      },
    ])
    .select("id, name");
  if (holdings.error) throw holdings.error;
  const valuations = await admin.from("market_instrument_prices").insert([
    {
      instrument_id: healthy.id,
      price: 100000,
      currency: "VND",
      price_type: "LAST",
      price_date: today,
      fetched_at: new Date().toISOString(),
      provider: "MANUAL",
      metadata: { fixture: PREFIX },
    },
    {
      instrument_id: stale.id,
      price: 100000,
      currency: "VND",
      price_type: "LAST",
      price_date: staleDate,
      fetched_at: new Date(`${staleDate}T10:00:00Z`).toISOString(),
      provider: "MANUAL",
      metadata: { fixture: PREFIX },
    },
  ]);
  if (valuations.error) throw valuations.error;
  const savingsProvider = await admin
    .from("saving_providers")
    .select("id")
    .eq("provider_key", "manual")
    .limit(1)
    .single();
  if (savingsProvider.error) throw savingsProvider.error;
  const savingRows = await admin
    .from("savings")
    .insert([
      {
        household_id: householdId,
        funding_account_id: accountId,
        settlement_account_id: accountId,
        provider_id: savingsProvider.data.id,
        product_name: `${PREFIX} upcoming`,
        product_snapshot: {},
        renewal_preference: "manual_review",
        created_by: userId,
        status: "active",
      },
      {
        household_id: householdId,
        funding_account_id: accountId,
        settlement_account_id: accountId,
        provider_id: savingsProvider.data.id,
        product_name: `${PREFIX} matured`,
        product_snapshot: {},
        renewal_preference: "manual_review",
        created_by: userId,
        status: "matured",
      },
    ])
    .select("id, product_name");
  if (savingRows.error) throw savingRows.error;
  const upcoming = savingRows.data.find((row) =>
    row.product_name.endsWith("upcoming"),
  );
  const matured = savingRows.data.find((row) =>
    row.product_name.endsWith("matured"),
  );
  const cycles = await admin.from("saving_cycles").insert([
    {
      saving_id: upcoming.id,
      cycle_number: 1,
      start_date: today,
      end_date: new Date(Date.now() + 5 * 86_400_000)
        .toISOString()
        .slice(0, 10),
      principal: 1000000,
      locked_rate: 0,
      package_snapshot: {},
      status: "active",
    },
    {
      saving_id: matured.id,
      cycle_number: 1,
      start_date: staleDate,
      end_date: staleDate,
      principal: 2000000,
      locked_rate: 0,
      package_snapshot: {},
      status: "matured",
    },
  ]);
  if (cycles.error) throw cycles.error;
  const debt = await admin
    .from("liabilities")
    .insert({
      household_id: householdId,
      name: `${PREFIX} debt attention`,
      creditor: "Fixture",
      principal_amount: 3000000,
      remaining_amount: 3000000,
      currency: "VND",
      due_date: new Date(Date.now() + 2 * 86_400_000)
        .toISOString()
        .slice(0, 10),
      status: "active",
      direction: "borrowed",
      creation_mode: "existing_balance",
      start_date: today,
      is_archived: false,
      created_by: userId,
    });
  if (debt.error) throw debt.error;
  await writeFile(
    STATE_PATH,
    JSON.stringify(
      { householdId, holdingIds: holdings.data.map((row) => row.id) },
      null,
      2,
    ),
  );
  console.error(`Created ${PREFIX} fixture for ${householdId}`);
}

const { householdId } = await target();
if (process.argv[2] === "cleanup") {
  await cleanup(householdId);
  await run(process.execPath, ["scripts/loans-11e-fixture.mjs", "cleanup"]);
  await rm(STATE_PATH, { force: true });
  console.error(`Cleaned ${PREFIX} fixture`);
} else {
  await setup();
}
