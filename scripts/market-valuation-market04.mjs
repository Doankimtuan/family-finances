import { readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = (
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
)?.trim();
const fixturePath = "/tmp/family-finances-market04-fixture.json";

if (!url || !serviceKey) throw new Error("Supabase credentials are incomplete");

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function one(query, label) {
  const { data, error } = await query.select().single();
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function setup() {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `market04-${suffix}@example.com`;
  const password = `Market04-${crypto.randomUUID()}!aA1`;
  const userResult = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userResult.error) throw userResult.error;
  const userId = userResult.data.user.id;
  let householdId = null;

  try {
    const household = await one(
      admin.from("households").insert({
        name: `MARKET 04 ${suffix}`,
        base_currency: "VND",
        locale: "en-VN",
        timezone: "Asia/Ho_Chi_Minh",
        created_by: userId,
      }),
      "create household",
    );
    householdId = household.id;
    const membership = await one(
      admin.from("household_members").insert({
        household_id: household.id,
        user_id: userId,
        role: "admin",
        is_active: true,
      }),
      "create membership",
    );
    const instruments = await admin
      .from("market_instruments")
      .insert([
        {
          asset_class: "crypto",
          symbol: `M04BTC${suffix}`,
          name: "MARKET 04 Bitcoin",
          currency: "USD",
          pricing_mode: "UNIT_PRICE",
          auto_price_supported: true,
          metadata: {},
        },
        {
          asset_class: "stock",
          symbol: `M04FPT${suffix}`,
          name: "MARKET 04 Stock",
          currency: "VND",
          pricing_mode: "UNIT_PRICE",
          auto_price_supported: true,
          metadata: {},
        },
        {
          asset_class: "fund",
          symbol: `M04FUND${suffix}`,
          name: "MARKET 04 Fund",
          currency: "VND",
          pricing_mode: "NAV_PER_UNIT",
          auto_price_supported: true,
          metadata: {},
        },
      ])
      .select("id,asset_class,currency,pricing_mode");
    if (instruments.error) throw instruments.error;
    const [cryptoInstrument, stockInstrument, fundInstrument] =
      instruments.data;
    const prices = await admin.from("market_instrument_prices").insert([
      {
        instrument_id: cryptoInstrument.id,
        price: 60_000,
        currency: "USD",
        price_type: "LAST",
        price_date: "2026-08-22",
        fetched_at: "2026-08-22T10:00:00.000Z",
        provider: "COINGECKO",
        metadata: {},
      },
      {
        instrument_id: stockInstrument.id,
        price: 125_000,
        currency: "VND",
        price_type: "LAST",
        price_date: "2026-08-21",
        fetched_at: "2026-08-21T10:00:00.000Z",
        provider: "VNSTOCK",
        metadata: {},
      },
      {
        instrument_id: fundInstrument.id,
        price: 15_000,
        currency: "VND",
        price_type: "NAV",
        price_date: "2026-08-21",
        fetched_at: "2026-08-21T10:00:00.000Z",
        provider: "FMARKET",
        metadata: {},
      },
    ]);
    if (prices.error) throw prices.error;
    const fx = await admin.from("market_currency_rates").upsert(
      {
        base_currency: "USD",
        quote_currency: "VND",
        rate: 25_000,
        rate_date: "2026-08-22",
        fetched_at: "2026-08-22T10:00:00.000Z",
        provider: "FRANKFURTER",
      },
      { onConflict: "base_currency,quote_currency" },
    );
    if (fx.error) throw fx.error;

    const holdings = await admin
      .from("investment_holdings")
      .insert([
        {
          household_id: household.id,
          name: "MARKET 04 Crypto",
          symbol: cryptoInstrument.id,
          instrument_id: cryptoInstrument.id,
          asset_class: "crypto",
          visibility_context: "household",
          lifecycle_status: "active",
          history_status: "opening_position",
          quantity: 0.5,
          remaining_total_cost_basis: 800_000_000,
          financial_scope: "household",
          created_by: userId,
        },
        {
          household_id: household.id,
          name: "MARKET 04 Stock",
          symbol: stockInstrument.id,
          instrument_id: stockInstrument.id,
          asset_class: "stock",
          visibility_context: "household",
          lifecycle_status: "active",
          history_status: "opening_position",
          quantity: 10,
          remaining_total_cost_basis: 1_000_000,
          financial_scope: "household",
          created_by: userId,
        },
        {
          household_id: household.id,
          name: "MARKET 04 Fund",
          symbol: fundInstrument.id,
          instrument_id: fundInstrument.id,
          asset_class: "fund",
          visibility_context: "household",
          lifecycle_status: "active",
          history_status: "opening_position",
          quantity: 100,
          remaining_total_cost_basis: 1_000_000,
          accounting_method: "FIFO",
          financial_scope: "household",
          created_by: userId,
        },
        {
          household_id: household.id,
          name: "MARKET 04 Manual",
          symbol: `M04MANUAL${suffix}`,
          asset_class: "gold",
          visibility_context: "household",
          lifecycle_status: "active",
          history_status: "opening_position",
          quantity: 1,
          remaining_total_cost_basis: 700_000,
          financial_scope: "household",
          created_by: userId,
        },
      ])
      .select("id,name");
    if (holdings.error) throw holdings.error;
    const manualHolding = holdings.data.find((row) =>
      row.name.endsWith("Manual"),
    );
    const valuation = await admin.from("investment_valuations").insert({
      household_id: household.id,
      holding_id: manualHolding.id,
      value_vnd: 900_000,
      valuation_date: "2026-08-21",
      source: "manual",
      quantity: 1,
      unit_price_vnd: 900_000,
      idempotency_key: `market04-manual-${suffix}`,
      created_by: userId,
    });
    if (valuation.error) throw valuation.error;

    const fixture = {
      userId,
      email,
      password,
      householdId: household.id,
      membershipId: membership.id,
      holdingIds: holdings.data.map((row) => row.id),
      expected: {
        crypto: 750_000_000,
        stock: 1_250_000,
        fund: 1_500_000,
        manual: 900_000,
      },
    };
    await writeFile(fixturePath, JSON.stringify(fixture));
    process.stdout.write(`${JSON.stringify(fixture)}\n`);
  } catch (error) {
    if (householdId)
      await admin.from("households").delete().eq("id", householdId);
    await admin.auth.admin.deleteUser(userId);
    throw error;
  }
}

async function cleanup() {
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  const household = await admin
    .from("households")
    .delete()
    .eq("id", fixture.householdId);
  if (household.error) throw household.error;
  const user = await admin.auth.admin.deleteUser(fixture.userId);
  if (user.error) throw user.error;
  process.stdout.write(`Cleaned MARKET 04 fixture ${fixture.householdId}\n`);
}

if (process.argv[2] === "setup") await setup();
else if (process.argv[2] === "cleanup") await cleanup();
else throw new Error("Use setup or cleanup");
