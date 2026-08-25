/** Deterministic authenticated Plan 13B.1 valuation fixtures. */

import { readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = (
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
)?.trim();
const fixturePath = "output/playwright/plan-13b1-fixture.json";
const FIXTURE_PREFIX = "PLAN 13B.1";

if (!url || !serviceKey) throw new Error("Supabase credentials are incomplete");

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function one(query, label) {
  const { data, error } = await query.select().single();
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function targetHousehold() {
  const user = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (user.error) throw user.error;
  const match = user.data.users.find(
    (candidate) =>
      candidate.email?.toLowerCase() ===
      process.env.E2E_USER_EMAIL?.trim().toLowerCase(),
  );
  if (!match) throw new Error("E2E user was not found");
  const membership = await one(
    admin
      .from("household_members")
      .select("household_id")
      .eq("user_id", match.id)
      .eq("is_active", true)
      .limit(1),
    "find active E2E membership",
  );
  return { userId: match.id, householdId: membership.household_id };
}

async function removeFixture(householdId) {
  const { data: goals, error: goalError } = await admin
    .from("goals")
    .select("id")
    .eq("household_id", householdId)
    .like("name", `${FIXTURE_PREFIX} %`);
  if (goalError) throw goalError;
  const goalIds = (goals ?? []).map((goal) => goal.id);
  if (goalIds.length) {
    const links = await admin
      .from("goal_funding_links")
      .delete()
      .in("goal_id", goalIds);
    if (links.error) throw links.error;
    const deletedGoals = await admin.from("goals").delete().in("id", goalIds);
    if (deletedGoals.error) throw deletedGoals.error;
  }

  const holdings = await admin
    .from("investment_holdings")
    .select("id, instrument_id")
    .eq("household_id", householdId)
    .like("name", `${FIXTURE_PREFIX} %`);
  if (holdings.error) throw holdings.error;
  const holdingIds = (holdings.data ?? []).map((holding) => holding.id);
  const instrumentIds = (holdings.data ?? [])
    .map((holding) => holding.instrument_id)
    .filter(Boolean);
  const orphanInstruments = await admin
    .from("market_instruments")
    .select("id")
    .like("name", `${FIXTURE_PREFIX} %`);
  if (orphanInstruments.error) throw orphanInstruments.error;
  for (const instrument of orphanInstruments.data ?? []) {
    if (!instrumentIds.includes(instrument.id))
      instrumentIds.push(instrument.id);
  }
  if (holdingIds.length) {
    const valuations = await admin
      .from("investment_valuations")
      .delete()
      .in("holding_id", holdingIds);
    if (valuations.error) throw valuations.error;
    const deletedHoldings = await admin
      .from("investment_holdings")
      .delete()
      .in("id", holdingIds);
    if (deletedHoldings.error) throw deletedHoldings.error;
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
}

async function setup() {
  const { userId, householdId } = await targetHousehold();
  await removeFixture(householdId);
  const suffix = crypto.randomUUID().slice(0, 8);
  const today = new Date().toISOString().slice(0, 10);
  const staleDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const instruments = await admin
    .from("market_instruments")
    .insert([
      {
        symbol: `P13B1C${suffix}`,
        name: `${FIXTURE_PREFIX} Current instrument`,
        asset_class: "stock",
        currency: "VND",
        pricing_mode: "UNIT_PRICE",
        auto_price_supported: true,
        is_active: true,
        metadata: { fixture: FIXTURE_PREFIX },
      },
      {
        symbol: `P13B1S${suffix}`,
        name: `${FIXTURE_PREFIX} Stale instrument`,
        asset_class: "stock",
        currency: "VND",
        pricing_mode: "UNIT_PRICE",
        auto_price_supported: true,
        is_active: true,
        metadata: { fixture: FIXTURE_PREFIX },
      },
    ])
    .select("id, symbol");
  if (instruments.error) throw instruments.error;
  const currentInstrument = instruments.data[0];
  const staleInstrument = instruments.data[1];

  const prices = await admin.from("market_instrument_prices").insert([
    {
      instrument_id: currentInstrument.id,
      price: 2_000_000,
      currency: "VND",
      price_type: "LAST",
      price_date: today,
      fetched_at: `${today}T01:00:00.000Z`,
      provider: "VNSTOCK",
      metadata: { fixture: FIXTURE_PREFIX },
    },
    {
      instrument_id: staleInstrument.id,
      price: 1_500_000,
      currency: "VND",
      price_type: "LAST",
      price_date: staleDate,
      fetched_at: `${staleDate}T01:00:00.000Z`,
      provider: "VNSTOCK",
      metadata: { fixture: FIXTURE_PREFIX },
    },
  ]);
  if (prices.error) throw prices.error;

  const holdings = await admin
    .from("investment_holdings")
    .insert([
      {
        household_id: householdId,
        name: `${FIXTURE_PREFIX} AUTO_CURRENT`,
        symbol: currentInstrument.symbol,
        instrument_id: currentInstrument.id,
        asset_class: "stock",
        visibility_context: "household",
        lifecycle_status: "active",
        history_status: "opening_position",
        quantity: 1,
        remaining_total_cost_basis: 1_000_000,
        financial_scope: "household",
        created_by: userId,
      },
      {
        household_id: householdId,
        name: `${FIXTURE_PREFIX} AUTO_STALE`,
        symbol: staleInstrument.symbol,
        instrument_id: staleInstrument.id,
        asset_class: "stock",
        visibility_context: "household",
        lifecycle_status: "active",
        history_status: "opening_position",
        quantity: 1,
        remaining_total_cost_basis: 900_000,
        financial_scope: "household",
        created_by: userId,
      },
      {
        household_id: householdId,
        name: `${FIXTURE_PREFIX} UNKNOWN`,
        symbol: `P13B1U${suffix}`,
        asset_class: "gold",
        visibility_context: "household",
        lifecycle_status: "active",
        history_status: "opening_position",
        quantity: 1,
        remaining_total_cost_basis: 800_000,
        financial_scope: "household",
        created_by: userId,
      },
      {
        household_id: householdId,
        name: `${FIXTURE_PREFIX} MIXED KNOWN`,
        symbol: currentInstrument.symbol,
        instrument_id: currentInstrument.id,
        asset_class: "stock",
        visibility_context: "household",
        lifecycle_status: "active",
        history_status: "opening_position",
        quantity: 1,
        remaining_total_cost_basis: 1_000_000,
        financial_scope: "household",
        created_by: userId,
      },
      {
        household_id: householdId,
        name: `${FIXTURE_PREFIX} MIXED UNKNOWN`,
        symbol: `P13B1MU${suffix}`,
        asset_class: "gold",
        visibility_context: "household",
        lifecycle_status: "active",
        history_status: "opening_position",
        quantity: 1,
        remaining_total_cost_basis: 800_000,
        financial_scope: "household",
        created_by: userId,
      },
    ])
    .select("id, name");
  if (holdings.error) throw holdings.error;
  const currentHolding = holdings.data[0];
  const staleHolding = holdings.data[1];
  const unknownHolding = holdings.data[2];
  const mixedKnownHolding = holdings.data[3];
  const mixedUnknownHolding = holdings.data[4];

  const goals = await admin
    .from("goals")
    .insert([
      {
        household_id: householdId,
        name: `${FIXTURE_PREFIX} current`,
        target_amount: 3_000_000,
        funded_amount: 0,
        legacy_funded_amount: 0,
        goal_type: "invest",
        status: "active",
        created_by: userId,
      },
      {
        household_id: householdId,
        name: `${FIXTURE_PREFIX} stale`,
        target_amount: 3_000_000,
        funded_amount: 0,
        legacy_funded_amount: 0,
        goal_type: "invest",
        status: "active",
        created_by: userId,
      },
      {
        household_id: householdId,
        name: `${FIXTURE_PREFIX} unknown`,
        target_amount: 3_000_000,
        funded_amount: 0,
        legacy_funded_amount: 0,
        goal_type: "invest",
        status: "active",
        created_by: userId,
      },
      {
        household_id: householdId,
        name: `${FIXTURE_PREFIX} mixed`,
        target_amount: 5_000_000,
        funded_amount: 0,
        legacy_funded_amount: 0,
        goal_type: "invest",
        status: "active",
        created_by: userId,
      },
    ])
    .select("id, name");
  if (goals.error) throw goals.error;

  const goalByName = Object.fromEntries(
    goals.data.map((goal) => [goal.name, goal.id]),
  );
  const links = await admin.from("goal_funding_links").insert([
    {
      household_id: householdId,
      goal_id: goalByName[`${FIXTURE_PREFIX} current`],
      source_kind: "holding",
      holding_id: currentHolding.id,
      created_by: userId,
      linked_by: userId,
    },
    {
      household_id: householdId,
      goal_id: goalByName[`${FIXTURE_PREFIX} stale`],
      source_kind: "holding",
      holding_id: staleHolding.id,
      created_by: userId,
      linked_by: userId,
    },
    {
      household_id: householdId,
      goal_id: goalByName[`${FIXTURE_PREFIX} unknown`],
      source_kind: "holding",
      holding_id: unknownHolding.id,
      created_by: userId,
      linked_by: userId,
    },
    {
      household_id: householdId,
      goal_id: goalByName[`${FIXTURE_PREFIX} mixed`],
      source_kind: "holding",
      holding_id: mixedKnownHolding.id,
      created_by: userId,
      linked_by: userId,
    },
    {
      household_id: householdId,
      goal_id: goalByName[`${FIXTURE_PREFIX} mixed`],
      source_kind: "holding",
      holding_id: mixedUnknownHolding.id,
      created_by: userId,
      linked_by: userId,
    },
  ]);
  if (links.error) throw links.error;

  await writeFile(
    fixturePath,
    JSON.stringify(
      { householdId, goalIds: goals.data.map((goal) => goal.id) },
      null,
      2,
    ),
  );
  process.stdout.write(
    `Created ${FIXTURE_PREFIX} fixture for ${householdId}\n`,
  );
}

async function cleanup() {
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  await removeFixture(fixture.householdId);
  process.stdout.write(
    `Cleaned ${FIXTURE_PREFIX} fixture for ${fixture.householdId}\n`,
  );
}

if (process.argv[2] === "setup") await setup();
else if (process.argv[2] === "cleanup") await cleanup();
else throw new Error("Use setup or cleanup");
