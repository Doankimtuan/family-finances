/**
 * Read-only Home Investment raw-input benchmark and tenancy probe.
 *
 * Run with:
 *   VINHA_HOME_INVESTMENT_BENCH=1 node scripts/home-investment-one-wave-benchmark.mjs
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import { createJiti } from "jiti";

const { loadEnvConfig } = nextEnv;
const jiti = createJiti(import.meta.url);
const { resolveInvestmentValuation } = await jiti.import(
  "../modules/investments/application/market-valuation.ts",
);

const BENCHMARK_FLAG = "VINHA_HOME_INVESTMENT_BENCH";
const BENCHMARK_ENABLED = "1";
const DEFAULT_REPEATS = 20;
const AUTH_COOKIE_PREFIX = "sb-";
const AUTH_COOKIE_SUFFIX = "-auth-token";
const BASE64_COOKIE_PREFIX = "base64-";
const REPORTING_CURRENCY = "VND";

const SELECT = {
  HOLDING: "id,asset_class,instrument_id,quantity,remaining_total_cost_basis",
  SUMMARY:
    "holding_id,asset_class,instrument_id,quantity,remaining_total_cost_basis,value_vnd,valuation_date,valuation_created_at,unit_price_vnd,valuation_source,realized_pnl,investment_income",
  INSTRUMENT:
    "id,asset_class,symbol,name,exchange,currency,pricing_mode,auto_price_supported,is_active,metadata",
  PRICE:
    "instrument_id,price,currency,price_type,price_date,fetched_at,provider,metadata,updated_at",
  FX: "base_currency,quote_currency,rate,rate_date,fetched_at,provider,updated_at",
  MEMBERSHIP: "household_id",
};

const RPC = {
  CURRENT: "get_investment_home_summary_inputs",
  PROTOTYPE: "get_home_investment_raw_inputs",
};

function assertEnabled() {
  if (process.env[BENCHMARK_FLAG] !== BENCHMARK_ENABLED)
    throw new Error(`${BENCHMARK_FLAG}=1 is required`);
}

function percentile(sorted, percentage) {
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentage / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

function summarize(samples) {
  const values = samples.filter((value) => Number.isFinite(value));
  const sorted = [...values].sort((left, right) => left - right);
  if (sorted.length === 0)
    return { n: 0, min: null, median: null, p75: null, p95: null, max: null };
  return {
    n: sorted.length,
    min: sorted[0],
    median: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1],
  };
}

function readCookieJson(cookieValue) {
  const encoded = cookieValue.startsWith(BASE64_COOKIE_PREFIX)
    ? cookieValue.slice(BASE64_COOKIE_PREFIX.length)
    : cookieValue;
  return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
}

function readJwtSubject(accessToken) {
  const [, payload] = accessToken.split(".");
  if (!payload) return null;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  return typeof parsed.sub === "string" ? parsed.sub : null;
}

function accessTokenExpired(accessToken) {
  const [, payload] = accessToken.split(".");
  if (!payload) return true;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  return Number(parsed.exp) * 1000 <= Date.now() + 30_000;
}

async function signIn(url, publicKey, email, password) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publicKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`sign-in failed: HTTP ${response.status}`);
  const session = await response.json();
  if (typeof session.access_token !== "string")
    throw new Error("sign-in returned no access token");
  return session;
}

async function readPrimarySession(url, publicKey) {
  const statePath = resolve(
    process.env.VINHA_SUPABASE_AUTH_STATE ??
      "output/playwright/.auth/user.json",
  );
  const state = JSON.parse(await readFile(statePath, "utf8"));
  const cookie = state.cookies?.find(
    (candidate) =>
      candidate.name.startsWith(AUTH_COOKIE_PREFIX) &&
      candidate.name.endsWith(AUTH_COOKIE_SUFFIX),
  );
  if (!cookie?.value) throw new Error("no Playwright Supabase auth cookie");
  let session = readCookieJson(cookie.value);
  if (typeof session.access_token !== "string")
    throw new Error("auth cookie has no access token");
  if (accessTokenExpired(session.access_token)) {
    session = await signIn(
      url,
      publicKey,
      process.env.E2E_USER_EMAIL?.trim(),
      process.env.E2E_USER_PASSWORD,
    );
  }
  return session;
}

function headers(publicKey, accessToken) {
  return {
    apikey: publicKey,
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };
}

function pathFor(table, select, filters = []) {
  const params = new URLSearchParams({ select });
  for (const [key, value] of filters) params.set(key, value);
  return `/rest/v1/${table}?${params.toString()}`;
}

async function request(url, requestHeaders, path, options = {}) {
  const started = performance.now();
  try {
    const response = await fetch(`${url}${path}`, {
      ...options,
      headers: { ...requestHeaders, ...(options.headers ?? {}) },
      cache: "no-store",
    });
    const body = await response.arrayBuffer();
    let data = null;
    try {
      data = JSON.parse(new TextDecoder().decode(body));
    } catch {
      data = null;
    }
    return {
      durationMs: performance.now() - started,
      status: response.status,
      responseBytes: body.byteLength,
      ok: response.ok,
      data,
      errorCode: response.ok ? null : (data?.code ?? null),
    };
  } catch (error) {
    return {
      durationMs: performance.now() - started,
      status: null,
      responseBytes: null,
      ok: false,
      data: null,
      errorCode: error instanceof Error ? error.name : "NETWORK_ERROR",
    };
  }
}

function rpcPath(name) {
  return `/rest/v1/rpc/${name}`;
}

function numeric(value) {
  return value == null ? null : String(value);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stable(item)]),
    );
  }
  return value;
}

function currentContract(results) {
  const [
    holdingResult,
    summaryResult,
    instrumentResult,
    priceResult,
    fxResult,
  ] = results;
  const holdings = holdingResult.data ?? [];
  const summaries = summaryResult.data ?? [];
  const instruments = new Map(
    (instrumentResult.data ?? []).map((row) => [row.id, row]),
  );
  const prices = new Map(
    (priceResult.data ?? []).map((row) => [row.instrument_id, row]),
  );
  const rates = new Map(
    (fxResult.data ?? []).map((row) => [
      `${row.base_currency}/${row.quote_currency}`,
      row,
    ]),
  );
  const summaryByHolding = new Map(
    summaries.map((row) => [row.holding_id, row]),
  );
  return holdings
    .map((holding) => {
      const instrument = holding.instrument_id
        ? (instruments.get(holding.instrument_id) ?? null)
        : null;
      const price = holding.instrument_id
        ? (prices.get(holding.instrument_id) ?? null)
        : null;
      const summary = summaryByHolding.get(holding.id) ?? null;
      const fx = price
        ? (rates.get(`${price.currency}/${REPORTING_CURRENCY}`) ?? null)
        : null;
      return stable({
        holdingId: holding.id,
        assetClass: holding.asset_class,
        instrumentId: holding.instrument_id,
        quantity: numeric(holding.quantity),
        remainingCostBasis: numeric(holding.remaining_total_cost_basis),
        instrument: instrument
          ? {
              assetClass: instrument.asset_class,
              symbol: instrument.symbol,
              name: instrument.name,
              exchange: instrument.exchange,
              currency: instrument.currency,
              pricingMode: instrument.pricing_mode,
              autoPriceSupported: instrument.auto_price_supported,
              isActive: instrument.is_active,
              metadata: instrument.metadata,
            }
          : null,
        price: price
          ? {
              price: numeric(price.price),
              currency: price.currency,
              priceType: price.price_type,
              priceDate: price.price_date,
              fetchedAt: price.fetched_at,
              provider: price.provider,
              metadata: price.metadata,
              updatedAt: price.updated_at,
            }
          : null,
        fx: fx
          ? {
              baseCurrency: fx.base_currency,
              quoteCurrency: fx.quote_currency,
              rate: numeric(fx.rate),
              rateDate: fx.rate_date,
              fetchedAt: fx.fetched_at,
              provider: fx.provider,
              updatedAt: fx.updated_at,
            }
          : null,
        manual:
          summary?.value_vnd == null
            ? null
            : {
                valueVnd: numeric(summary.value_vnd),
                valuationDate: summary.valuation_date,
                createdAt: summary.valuation_created_at,
                unitPriceVnd: numeric(summary.unit_price_vnd),
                source: summary.valuation_source,
              },
        realizedPnl: numeric(summaries[0]?.realized_pnl ?? 0),
        investmentIncome: numeric(summaries[0]?.investment_income ?? 0),
      });
    })
    .sort((left, right) => left.holdingId.localeCompare(right.holdingId));
}

function prototypeContract(result) {
  return (result.data ?? [])
    .map((row) =>
      stable({
        holdingId: row.holding_id,
        assetClass: row.asset_class,
        instrumentId: row.instrument_id,
        quantity: numeric(row.quantity),
        remainingCostBasis: numeric(row.remaining_total_cost_basis),
        instrument: row.instrument_id
          ? {
              assetClass: row.instrument_asset_class,
              symbol: row.instrument_symbol,
              name: row.instrument_name,
              exchange: row.instrument_exchange,
              currency: row.instrument_currency,
              pricingMode: row.instrument_pricing_mode,
              autoPriceSupported: row.instrument_auto_price_supported,
              isActive: row.instrument_is_active,
              metadata: row.instrument_metadata,
            }
          : null,
        price:
          row.price == null
            ? null
            : {
                price: numeric(row.price),
                currency: row.price_currency,
                priceType: row.price_type,
                priceDate: row.price_date,
                fetchedAt: row.price_fetched_at,
                provider: row.price_provider,
                metadata: row.price_metadata,
                updatedAt: row.price_updated_at,
              },
        fx:
          row.fx_rate == null
            ? null
            : {
                baseCurrency: row.fx_base_currency,
                quoteCurrency: row.fx_quote_currency,
                rate: numeric(row.fx_rate),
                rateDate: row.fx_rate_date,
                fetchedAt: row.fx_fetched_at,
                provider: row.fx_provider,
                updatedAt: row.fx_updated_at,
              },
        manual:
          row.manual_value_vnd == null
            ? null
            : {
                valueVnd: numeric(row.manual_value_vnd),
                valuationDate: row.manual_valuation_date,
                createdAt: row.manual_created_at,
                unitPriceVnd: numeric(row.manual_unit_price_vnd),
                source: row.manual_source,
              },
        realizedPnl: numeric(row.realized_pnl ?? 0),
        investmentIncome: numeric(row.investment_income ?? 0),
      }),
    )
    .sort((left, right) => left.holdingId.localeCompare(right.holdingId));
}

function resolverInputFromCurrent(results) {
  const [
    holdingResult,
    summaryResult,
    instrumentResult,
    priceResult,
    fxResult,
  ] = results;
  const instruments = new Map(
    (instrumentResult.data ?? []).map((row) => [row.id, row]),
  );
  const prices = new Map(
    (priceResult.data ?? []).map((row) => [row.instrument_id, row]),
  );
  const rates = new Map(
    (fxResult.data ?? []).map((row) => [
      `${row.base_currency}/${row.quote_currency}`,
      row,
    ]),
  );
  const summaries = new Map(
    (summaryResult.data ?? []).map((row) => [row.holding_id, row]),
  );
  return (holdingResult.data ?? [])
    .map((holding) => {
      const instrumentRow = holding.instrument_id
        ? (instruments.get(holding.instrument_id) ?? null)
        : null;
      const priceRow = holding.instrument_id
        ? (prices.get(holding.instrument_id) ?? null)
        : null;
      const fxRow = priceRow
        ? (rates.get(`${priceRow.currency}/${REPORTING_CURRENCY}`) ?? null)
        : null;
      const summary = summaries.get(holding.id) ?? null;
      return {
        holdingId: holding.id,
        input: {
          assetClass: holding.asset_class,
          quantity: String(holding.quantity),
          remainingCostBasis:
            holding.remaining_total_cost_basis == null
              ? null
              : Number(holding.remaining_total_cost_basis),
          instrument: instrumentRow
            ? {
                id: instrumentRow.id,
                assetClass: instrumentRow.asset_class,
                symbol: instrumentRow.symbol,
                name: instrumentRow.name,
                exchange: instrumentRow.exchange,
                currency: instrumentRow.currency,
                pricingMode: instrumentRow.pricing_mode,
                autoPriceSupported: instrumentRow.auto_price_supported,
                isActive: instrumentRow.is_active,
                metadata: instrumentRow.metadata,
              }
            : null,
          price: priceRow
            ? {
                instrumentId: priceRow.instrument_id,
                price: Number(priceRow.price),
                currency: priceRow.currency,
                priceType: priceRow.price_type,
                priceDate: priceRow.price_date,
                fetchedAt: priceRow.fetched_at,
                provider: priceRow.provider,
                metadata: priceRow.metadata,
                updatedAt: priceRow.updated_at,
              }
            : null,
          fxRate: fxRow
            ? {
                baseCurrency: fxRow.base_currency,
                quoteCurrency: fxRow.quote_currency,
                rate: Number(fxRow.rate),
                rateDate: fxRow.rate_date,
                fetchedAt: fxRow.fetched_at,
                provider: fxRow.provider,
                updatedAt: fxRow.updated_at,
              }
            : null,
          manualValuation:
            summary?.value_vnd == null
              ? null
              : {
                  valueVnd: Number(summary.value_vnd),
                  valuationDate: summary.valuation_date ?? "",
                  unitPriceVnd:
                    summary.unit_price_vnd == null
                      ? null
                      : Number(summary.unit_price_vnd),
                  source: summary.valuation_source ?? "",
                },
        },
      };
    })
    .sort((left, right) => left.holdingId.localeCompare(right.holdingId));
}

function resolverInputFromPrototype(result) {
  return (result.data ?? [])
    .map((row) => ({
      holdingId: row.holding_id,
      input: {
        assetClass: row.asset_class,
        quantity: String(row.quantity),
        remainingCostBasis:
          row.remaining_total_cost_basis == null
            ? null
            : Number(row.remaining_total_cost_basis),
        instrument: row.instrument_id
          ? {
              id: row.instrument_id,
              assetClass: row.instrument_asset_class,
              symbol: row.instrument_symbol,
              name: row.instrument_name,
              exchange: row.instrument_exchange,
              currency: row.instrument_currency,
              pricingMode: row.instrument_pricing_mode,
              autoPriceSupported: row.instrument_auto_price_supported,
              isActive: row.instrument_is_active,
              metadata: row.instrument_metadata,
            }
          : null,
        price:
          row.price == null
            ? null
            : {
                instrumentId: row.instrument_id,
                price: Number(row.price),
                currency: row.price_currency,
                priceType: row.price_type,
                priceDate: row.price_date,
                fetchedAt: row.price_fetched_at,
                provider: row.price_provider,
                metadata: row.price_metadata,
                updatedAt: row.price_updated_at,
              },
        fxRate:
          row.fx_rate == null
            ? null
            : {
                baseCurrency: row.fx_base_currency,
                quoteCurrency: row.fx_quote_currency,
                rate: Number(row.fx_rate),
                rateDate: row.fx_rate_date,
                fetchedAt: row.fx_fetched_at,
                provider: row.fx_provider,
                updatedAt: row.fx_updated_at,
              },
        manualValuation:
          row.manual_value_vnd == null
            ? null
            : {
                valueVnd: Number(row.manual_value_vnd),
                valuationDate: row.manual_valuation_date ?? "",
                unitPriceVnd:
                  row.manual_unit_price_vnd == null
                    ? null
                    : Number(row.manual_unit_price_vnd),
                source: row.manual_source ?? "",
                inputCurrency: row.manual_input_currency,
                inputUnitPrice:
                  row.manual_input_unit_price == null
                    ? null
                    : Number(row.manual_input_unit_price),
                inputTotalValue:
                  row.manual_input_total_value == null
                    ? null
                    : Number(row.manual_input_total_value),
                inputRateToVnd:
                  row.manual_input_rate_to_vnd == null
                    ? null
                    : Number(row.manual_input_rate_to_vnd),
                inputRateDate: row.manual_input_rate_date,
                inputRateSource: row.manual_input_rate_source,
              },
      },
    }))
    .sort((left, right) => left.holdingId.localeCompare(right.holdingId));
}

function homeValuationContract(inputs, now) {
  return inputs.map(({ holdingId, input }) => {
    const resolution = resolveInvestmentValuation({ ...input, now });
    return {
      holdingId,
      valuation: stable({
        currentValue: resolution.currentValue,
        estimatedUnrealizedPnl: resolution.estimatedUnrealizedPnl,
        estimatedUnrealizedPnlPercent: resolution.estimatedUnrealizedPnlPercent,
        source: resolution.source,
        freshness: resolution.freshness,
        quality: resolution.quality,
      }),
    };
  });
}

async function currentShape(url, requestHeaders) {
  const started = performance.now();
  const holdingResult = await request(
    url,
    requestHeaders,
    pathFor("investment_holdings", SELECT.HOLDING, [
      ["lifecycle_status", "neq.exited"],
      ["quantity", "gt.0"],
    ]),
  );
  if (!holdingResult.ok)
    return {
      durationMs: performance.now() - started,
      calls: 1,
      results: [holdingResult],
    };
  const ids = [
    ...new Set(
      (holdingResult.data ?? [])
        .map((row) => row.instrument_id)
        .filter((id) => typeof id === "string"),
    ),
  ];
  const secondWave = await Promise.all([
    request(url, requestHeaders, rpcPath(RPC.CURRENT), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }),
    ids.length
      ? request(
          url,
          requestHeaders,
          pathFor("market_instruments", SELECT.INSTRUMENT, [
            ["id", `in.(${ids.join(",")})`],
          ]),
        )
      : Promise.resolve({
          data: [],
          ok: true,
          durationMs: 0,
          responseBytes: 0,
        }),
    ids.length
      ? request(
          url,
          requestHeaders,
          pathFor("market_instrument_prices", SELECT.PRICE, [
            ["instrument_id", `in.(${ids.join(",")})`],
          ]),
        )
      : Promise.resolve({
          data: [],
          ok: true,
          durationMs: 0,
          responseBytes: 0,
        }),
    request(
      url,
      requestHeaders,
      pathFor("market_currency_rates", SELECT.FX, [
        ["quote_currency", `eq.${REPORTING_CURRENCY}`],
      ]),
    ),
  ]);
  return {
    durationMs: performance.now() - started,
    calls: 1 + secondWave.filter((result) => result.responseBytes !== 0).length,
    results: [holdingResult, ...secondWave],
    raw: currentContract([holdingResult, ...secondWave]),
    responseBytes: [holdingResult, ...secondWave].reduce(
      (sum, result) => sum + (result.responseBytes ?? 0),
      0,
    ),
  };
}

async function prototypeShape(url, requestHeaders) {
  const result = await request(url, requestHeaders, rpcPath(RPC.PROTOTYPE), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  return {
    durationMs: result.durationMs,
    calls: 1,
    results: [result],
    raw: prototypeContract(result),
    responseBytes: result.responseBytes ?? 0,
  };
}

async function benchmark(url, requestHeaders, repeats) {
  await currentShape(url, requestHeaders);
  await prototypeShape(url, requestHeaders);
  const current = [];
  const prototype = [];
  const equivalence = [];
  const valuationEquivalence = [];
  const valuationNow = new Date();
  for (let index = 0; index < repeats; index += 1) {
    const currentSample = await currentShape(url, requestHeaders);
    const prototypeSample = await prototypeShape(url, requestHeaders);
    current.push(currentSample);
    prototype.push(prototypeSample);
    equivalence.push(
      JSON.stringify(currentSample.raw) === JSON.stringify(prototypeSample.raw),
    );
    valuationEquivalence.push(
      JSON.stringify(
        homeValuationContract(
          resolverInputFromCurrent(currentSample.results),
          valuationNow,
        ),
      ) ===
        JSON.stringify(
          homeValuationContract(
            resolverInputFromPrototype(prototypeSample.results[0]),
            valuationNow,
          ),
        ),
    );
  }
  const shapeSummary = (samples) => ({
    duration: summarize(samples.map((sample) => sample.durationMs)),
    responseBytes: summarize(samples.map((sample) => sample.responseBytes)),
    calls: [...new Set(samples.map((sample) => sample.calls))],
    errors: samples.reduce(
      (count, sample) =>
        count + sample.results.filter((result) => !result.ok).length,
      0,
    ),
  });
  return {
    current: shapeSummary(current),
    prototype: shapeSummary(prototype),
    rawInputEquivalence: {
      samples: equivalence.length,
      matches: equivalence.filter(Boolean).length,
      mismatches: equivalence
        .map((matched, index) => (matched ? null : index + 1))
        .filter((index) => index != null),
    },
    valuationEquivalence: {
      samples: valuationEquivalence.length,
      matches: valuationEquivalence.filter(Boolean).length,
      mismatches: valuationEquivalence
        .map((matched, index) => (matched ? null : index + 1))
        .filter((index) => index != null),
    },
  };
}

async function tenancyProbe(url, publicKey, primarySession) {
  const identities = [
    {
      name: "primary",
      session: primarySession,
    },
  ];
  for (const [name, emailKey, passwordKey] of [
    ["ownershipA", "OWNERSHIP_TEST_A_EMAIL", "OWNERSHIP_TEST_A_PASSWORD"],
    ["ownershipB", "OWNERSHIP_TEST_B_EMAIL", "OWNERSHIP_TEST_B_PASSWORD"],
  ]) {
    const email = process.env[emailKey]?.trim();
    const password = process.env[passwordKey];
    if (email && password)
      identities.push({
        name,
        session: await signIn(url, publicKey, email, password),
      });
  }
  const rows = [];
  for (const identity of identities) {
    const requestHeaders = headers(publicKey, identity.session.access_token);
    const subject = readJwtSubject(identity.session.access_token);
    const [memberships, holdings, prototype] = await Promise.all([
      request(
        url,
        requestHeaders,
        pathFor("household_members", SELECT.MEMBERSHIP, [
          ["user_id", `eq.${subject}`],
          ["is_active", "eq.true"],
        ]),
      ),
      request(
        url,
        requestHeaders,
        pathFor("investment_holdings", SELECT.HOLDING, [
          ["lifecycle_status", "neq.exited"],
          ["quantity", "gt.0"],
        ]),
      ),
      request(url, requestHeaders, rpcPath(RPC.PROTOTYPE), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    ]);
    rows.push({
      identity: identity.name,
      activeMemberships: memberships.data?.length ?? 0,
      activeHoldings: holdings.data?.length ?? 0,
      prototypeRows: prototype.data?.length ?? 0,
      rpcStatus: prototype.status,
      rpcErrorCode: prototype.errorCode,
      holdingIds: new Set((holdings.data ?? []).map((row) => row.id)),
    });
  }
  const primary = rows[0];
  const comparison = rows.slice(1).map((row) => ({
    identity: row.identity,
    sharesPrimaryHolding:
      primary && [...row.holdingIds].some((id) => primary.holdingIds.has(id)),
    targetHouseholdReadRows:
      row.activeMemberships === 0 ? row.activeHoldings : null,
  }));
  const anonymous = await request(
    url,
    { apikey: publicKey, Accept: "application/json" },
    rpcPath(RPC.PROTOTYPE),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    },
  );
  return {
    identities: rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).filter(([key]) => key !== "holdingIds"),
      ),
    ),
    nonMemberComparisons: comparison,
    anonymous: {
      status: anonymous.status,
      errorCode: anonymous.errorCode,
      denied: !anonymous.ok,
    },
  };
}

async function main() {
  assertEnabled();
  loadEnvConfig(process.cwd());
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publicKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !publicKey) throw new Error("Supabase public URL/key required");
  const repeats = Number(
    process.env.VINHA_HOME_INVESTMENT_BENCH_REPEATS ?? DEFAULT_REPEATS,
  );
  if (!Number.isInteger(repeats) || repeats < DEFAULT_REPEATS)
    throw new Error(`repeats must be an integer >= ${DEFAULT_REPEATS}`);
  const primarySession = await readPrimarySession(url, publicKey);
  const requestHeaders = headers(publicKey, primarySession.access_token);
  const report = await benchmark(url, requestHeaders, repeats);
  const rls = await tenancyProbe(url, publicKey, primarySession);
  process.stdout.write(
    `${JSON.stringify({ repeats, authenticated: true, report, rls }, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "benchmark failed");
  process.exitCode = 1;
});
