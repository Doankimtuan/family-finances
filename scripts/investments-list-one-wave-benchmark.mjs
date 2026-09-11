/**
 * Read-only Investments list raw-input benchmark and tenancy probe.
 *
 * Run with:
 *   VINHA_INVESTMENTS_LIST_BENCH=1 node scripts/investments-list-one-wave-benchmark.mjs
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import { createJiti } from "jiti";

const { loadEnvConfig } = nextEnv;
const jiti = createJiti(import.meta.url, { tsconfigPaths: true });
const { resolveInvestmentValuation } = await jiti.import(
  "../modules/investments/application/market-valuation.ts",
);
const { buildInvestmentPortfolio } = await jiti.import(
  "../modules/investments/application/queries/investment-queries.ts",
);

const BENCHMARK_FLAG = "VINHA_INVESTMENTS_LIST_BENCH";
const BENCHMARK_ENABLED = "1";
const DEFAULT_REPEATS = 20;
const AUTH_COOKIE_PREFIX = "sb-";
const AUTH_COOKIE_SUFFIX = "-auth-token";
const BASE64_COOKIE_PREFIX = "base64-";
const REPORTING_CURRENCY = "VND";

const SELECT = {
  HOLDING:
    "id,household_id,name,symbol,instrument_id,asset_class,provider_custodian,visibility_context,lifecycle_status,history_status,quantity,remaining_total_cost_basis,notes,financial_scope,owner_membership_id,accounting_method,created_at",
  VALUATION:
    "holding_id,value_vnd,valuation_date,created_at,quantity,unit_price_vnd,source,input_currency,input_unit_price,input_total_value,input_rate_to_vnd,input_rate_date,input_rate_source",
  ACTIVITY_VALUATION:
    "id,holding_id,value_vnd,valuation_date,quantity,unit_price_vnd,input_currency,input_unit_price,input_total_value,input_rate_to_vnd,input_rate_date,input_rate_source",
  LOT: "id,position_id,source_event_id,acquired_at,original_quantity,remaining_quantity,unit_cost,total_cost",
  OPERATION:
    "id,operation_type,source_holding_id,destination_holding_id,source_quantity,destination_quantity,executed_value_vnd,quoted_value_vnd,source_basis_consumed,destination_basis_added,realized_result_vnd,income_kind,transaction_id,correlation_id,effective_date,unit_price_vnd,input_currency,input_amount,input_unit_price,input_total_value,input_executed_value,input_quoted_value,input_cost_basis,input_current_valuation,input_rate_to_vnd,input_rate_date,input_rate_source,investment_fees(fee_value_vnd,input_amount,input_fee_value)",
  INSTRUMENT:
    "id,asset_class,symbol,name,exchange,currency,pricing_mode,auto_price_supported,is_active,metadata",
  PRICE:
    "instrument_id,price,currency,price_type,price_date,fetched_at,provider,metadata,updated_at",
  FX: "base_currency,quote_currency,rate,rate_date,fetched_at,provider,updated_at",
  MEMBERSHIP: "id",
};

const RPC = "get_investments_list_raw_inputs";

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
    min: percentile(sorted, 0),
    median: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p95: percentile(sorted, 95),
    max: percentile(sorted, 100),
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

function rpcPath(name) {
  return `/rest/v1/rpc/${name}`;
}

function noCall() {
  return {
    durationMs: 0,
    status: null,
    responseBytes: 0,
    ok: true,
    data: [],
    errorCode: null,
    skipped: true,
  };
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

function numeric(value) {
  return value == null ? null : String(value);
}

function rowsOf(data) {
  return Array.isArray(data) ? data : [];
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

function latestValuations(rows) {
  const latest = new Map();
  for (const row of rows ?? []) {
    if (!latest.has(row.holding_id)) latest.set(row.holding_id, row);
  }
  return latest;
}

function operationTotals(rows) {
  return rowsOf(rows).reduce(
    (totals, row) => ({
      realizedPnl: totals.realizedPnl + Number(row.realized_result_vnd ?? 0),
      investmentIncome:
        totals.investmentIncome +
        (row.income_kind != null ? Number(row.executed_value_vnd ?? 0) : 0),
      fees:
        totals.fees +
        (row.investment_fees ?? []).reduce(
          (sum, fee) => sum + Number(fee.fee_value_vnd),
          0,
        ),
    }),
    { realizedPnl: 0, investmentIncome: 0, fees: 0 },
  );
}

function rawHolding(row, instrument, price, fx, manual, ownerActive, totals) {
  return {
    holdingId: row.id,
    householdId: row.household_id,
    name: row.name,
    symbol: row.symbol,
    instrumentId: row.instrument_id,
    assetClass: row.asset_class,
    providerCustodian: row.provider_custodian,
    visibilityContext: row.visibility_context,
    lifecycleStatus: row.lifecycle_status,
    historyStatus: row.history_status,
    quantity: numeric(row.quantity),
    remainingCostBasis: numeric(row.remaining_total_cost_basis),
    notes: row.notes,
    financialScope: row.financial_scope,
    ownerMembershipId: row.owner_membership_id,
    accountingMethod: row.accounting_method,
    createdAt: row.created_at,
    ownerMembershipIsActive: ownerActive,
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
    manual: manual
      ? {
          valueVnd: numeric(manual.value_vnd),
          valuationDate: manual.valuation_date,
          createdAt: manual.created_at,
          quantity: numeric(manual.quantity),
          unitPriceVnd: numeric(manual.unit_price_vnd),
          source: manual.source,
          inputCurrency: manual.input_currency,
          inputUnitPrice: numeric(manual.input_unit_price),
          inputTotalValue: numeric(manual.input_total_value),
          inputRateToVnd: numeric(manual.input_rate_to_vnd),
          inputRateDate: manual.input_rate_date,
          inputRateSource: manual.input_rate_source,
        }
      : null,
    realizedPnl: numeric(totals.realizedPnl),
    investmentIncome: numeric(totals.investmentIncome),
    fees: numeric(totals.fees),
  };
}

function currentContract(results) {
  const instruments = new Map(
    rowsOf(results.instruments.data).map((row) => [row.id, row]),
  );
  const prices = new Map(
    rowsOf(results.prices.data).map((row) => [row.instrument_id, row]),
  );
  const rates = new Map(
    rowsOf(results.fx.data).map((row) => [
      `${row.base_currency}/${row.quote_currency}`,
      row,
    ]),
  );
  const valuations = latestValuations(results.valuations.data);
  const activeOwnerIds = new Set(
    rowsOf(results.memberships.data).map((row) => row.id),
  );
  const totals = operationTotals(results.operations.data);
  return rowsOf(results.holdings.data)
    .map((row) => {
      const instrument = row.instrument_id
        ? (instruments.get(row.instrument_id) ?? null)
        : null;
      const price = row.instrument_id
        ? (prices.get(row.instrument_id) ?? null)
        : null;
      const fx = price
        ? (rates.get(`${price.currency}/${REPORTING_CURRENCY}`) ?? null)
        : null;
      return stable(
        rawHolding(
          row,
          instrument,
          price,
          fx,
          valuations.get(row.id) ?? null,
          row.owner_membership_id == null
            ? true
            : activeOwnerIds.has(row.owner_membership_id),
          totals,
        ),
      );
    })
    .sort((left, right) => left.holdingId.localeCompare(right.holdingId));
}

function prototypeContract(result) {
  return rowsOf(result.data)
    .map((row) =>
      stable({
        holdingId: row.holding_id,
        householdId: row.household_id,
        name: row.name,
        symbol: row.symbol,
        instrumentId: row.instrument_id,
        assetClass: row.asset_class,
        providerCustodian: row.provider_custodian,
        visibilityContext: row.visibility_context,
        lifecycleStatus: row.lifecycle_status,
        historyStatus: row.history_status,
        quantity: numeric(row.quantity),
        remainingCostBasis: numeric(row.remaining_total_cost_basis),
        notes: row.notes,
        financialScope: row.financial_scope,
        ownerMembershipId: row.owner_membership_id,
        accountingMethod: row.accounting_method,
        createdAt: row.created_at,
        ownerMembershipIsActive:
          row.owner_membership_id == null
            ? true
            : row.owner_membership_is_active,
        instrument:
          row.instrument_id == null
            ? null
            : {
                assetClass: row.instrument_asset_class,
                symbol: row.instrument_symbol,
                name: row.instrument_name,
                exchange: row.instrument_exchange,
                currency: row.instrument_currency,
                pricingMode: row.instrument_pricing_mode,
                autoPriceSupported: row.instrument_auto_price_supported,
                isActive: row.instrument_is_active,
                metadata: row.instrument_metadata,
              },
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
                quantity: numeric(row.manual_quantity),
                unitPriceVnd: numeric(row.manual_unit_price_vnd),
                source: row.manual_source,
                inputCurrency: row.manual_input_currency,
                inputUnitPrice: numeric(row.manual_input_unit_price),
                inputTotalValue: numeric(row.manual_input_total_value),
                inputRateToVnd: numeric(row.manual_input_rate_to_vnd),
                inputRateDate: row.manual_input_rate_date,
                inputRateSource: row.manual_input_rate_source,
              },
        realizedPnl: numeric(row.realized_pnl ?? 0),
        investmentIncome: numeric(row.investment_income ?? 0),
        fees: numeric(row.fees_total ?? 0),
      }),
    )
    .sort((left, right) => left.holdingId.localeCompare(right.holdingId));
}

function resolverInputs(rows) {
  return rows.map((row) => ({
    holdingId: row.holdingId,
    input: {
      assetClass: row.assetClass,
      quantity: row.quantity,
      remainingCostBasis:
        row.remainingCostBasis == null ? null : Number(row.remainingCostBasis),
      instrument: row.instrument
        ? {
            id: row.instrumentId,
            assetClass: row.instrument.assetClass,
            symbol: row.instrument.symbol,
            name: row.instrument.name,
            exchange: row.instrument.exchange,
            currency: row.instrument.currency,
            pricingMode: row.instrument.pricingMode,
            autoPriceSupported: row.instrument.autoPriceSupported,
            isActive: row.instrument.isActive,
            metadata: row.instrument.metadata,
          }
        : null,
      price: row.price
        ? {
            instrumentId: row.instrumentId,
            price: Number(row.price.price),
            currency: row.price.currency,
            priceType: row.price.priceType,
            priceDate: row.price.priceDate,
            fetchedAt: row.price.fetchedAt,
            provider: row.price.provider,
            metadata: row.price.metadata,
            updatedAt: row.price.updatedAt,
          }
        : null,
      fxRate: row.fx
        ? {
            baseCurrency: row.fx.baseCurrency,
            quoteCurrency: row.fx.quoteCurrency,
            rate: Number(row.fx.rate),
            rateDate: row.fx.rateDate,
            fetchedAt: row.fx.fetchedAt,
            provider: row.fx.provider,
            updatedAt: row.fx.updatedAt,
          }
        : null,
      manualValuation: row.manual
        ? {
            valueVnd: Number(row.manual.valueVnd),
            valuationDate: row.manual.valuationDate ?? "",
            unitPriceVnd:
              row.manual.unitPriceVnd == null
                ? null
                : Number(row.manual.unitPriceVnd),
            source: row.manual.source ?? "",
            inputCurrency: row.manual.inputCurrency,
            inputUnitPrice:
              row.manual.inputUnitPrice == null
                ? null
                : Number(row.manual.inputUnitPrice),
            inputTotalValue:
              row.manual.inputTotalValue == null
                ? null
                : Number(row.manual.inputTotalValue),
            inputRateToVnd:
              row.manual.inputRateToVnd == null
                ? null
                : Number(row.manual.inputRateToVnd),
            inputRateDate: row.manual.inputRateDate,
            inputRateSource: row.manual.inputRateSource,
          }
        : null,
    },
  }));
}

function valuationContract(rows, now) {
  return resolverInputs(rows).map(({ holdingId, input }) => ({
    holdingId,
    valuation: stable(resolveInvestmentValuation({ ...input, now })),
  }));
}

function portfolioContract(rows, now) {
  const valuations = new Map(
    valuationContract(rows, now).map((row) => [row.holdingId, row.valuation]),
  );
  const holdings = rows.map((row) => {
    const valuation = valuations.get(row.holdingId);
    return {
      id: row.holdingId,
      assetClass: row.assetClass,
      lifecycleStatus: row.lifecycleStatus,
      quantity: row.quantity,
      remainingTotalCostBasis:
        row.remainingCostBasis == null ? null : Number(row.remainingCostBasis),
      currentValue: valuation.currentValue,
      unrealizedResult: valuation.estimatedUnrealizedPnl,
      estimatedUnrealizedPnl: valuation.estimatedUnrealizedPnl,
      estimatedUnrealizedPnlPercent: valuation.estimatedUnrealizedPnlPercent,
    };
  });
  const first = rows[0];
  const portfolio = buildInvestmentPortfolio(holdings, {
    realizedPnl: first ? Number(first.realizedPnl) : 0,
    investmentIncome: first ? Number(first.investmentIncome) : 0,
    fees: first ? Number(first.fees) : 0,
  });
  return stable({
    activeHoldings: portfolio.activeHoldings.map((row) => row.id),
    closedHoldings: portfolio.closedHoldings.map((row) => row.id),
    totalCurrentValue: portfolio.totalCurrentValue,
    totalRemainingCostBasis: portfolio.totalRemainingCostBasis,
    unrealizedResult: portfolio.unrealizedResult,
    estimatedUnrealizedPnl: portfolio.estimatedUnrealizedPnl,
    estimatedUnrealizedPnlPercent: portfolio.estimatedUnrealizedPnlPercent,
    realizedSaleResult: portfolio.realizedSaleResult,
    investmentIncome: portfolio.investmentIncome,
    investmentFees: portfolio.investmentFees,
    valuationCoverage: portfolio.valuationCoverage,
    basisCoverage: portfolio.basisCoverage,
    incompleteBasisCount: portfolio.incompleteBasisCount,
    closedPositionCount: portfolio.closedPositionCount,
    allocationByAssetClass: portfolio.allocationByAssetClass,
  });
}

async function currentShape(url, requestHeaders) {
  const started = performance.now();
  const holdingsPromise = request(
    url,
    requestHeaders,
    pathFor("investment_holdings", SELECT.HOLDING),
  );
  const valuationsPromise = request(
    url,
    requestHeaders,
    pathFor(
      "investment_valuations",
      SELECT.VALUATION,
      [],
      "valuation_date.desc,created_at.desc",
    ),
  );
  const lotsPromise = request(
    url,
    requestHeaders,
    pathFor("investment_lots", SELECT.LOT, [], "acquired_at.asc"),
  );
  const operationsPromise = request(
    url,
    requestHeaders,
    pathFor(
      "investment_operations",
      SELECT.OPERATION,
      [],
      "effective_date.desc,created_at.desc",
    ),
  );
  const activityValuationsPromise = request(
    url,
    requestHeaders,
    pathFor(
      "investment_valuations",
      SELECT.ACTIVITY_VALUATION,
      [],
      "valuation_date.desc",
    ),
  );

  const [holdings, valuations, lots] = await Promise.all([
    holdingsPromise,
    valuationsPromise,
    lotsPromise,
  ]);
  const holdingRows = rowsOf(holdings.data);
  const instrumentIds = [
    ...new Set(
      holdingRows
        .map((row) => row.instrument_id)
        .filter((id) => typeof id === "string"),
    ),
  ];
  const ownerMembershipIds = [
    ...new Set(
      holdingRows
        .map((row) => row.owner_membership_id)
        .filter((id) => typeof id === "string"),
    ),
  ];
  const secondWave = await Promise.all([
    ownerMembershipIds.length
      ? request(
          url,
          requestHeaders,
          pathFor("household_members", SELECT.MEMBERSHIP, [
            ["id", `in.(${ownerMembershipIds.join(",")})`],
            ["is_active", "eq.true"],
          ]),
        )
      : noCall(),
    instrumentIds.length
      ? request(
          url,
          requestHeaders,
          pathFor("market_instruments", SELECT.INSTRUMENT, [
            ["id", `in.(${instrumentIds.join(",")})`],
          ]),
        )
      : noCall(),
    instrumentIds.length
      ? request(
          url,
          requestHeaders,
          pathFor("market_instrument_prices", SELECT.PRICE, [
            ["instrument_id", `in.(${instrumentIds.join(",")})`],
          ]),
        )
      : noCall(),
    request(
      url,
      requestHeaders,
      pathFor("market_currency_rates", SELECT.FX, [
        ["quote_currency", `eq.${REPORTING_CURRENCY}`],
      ]),
    ),
  ]);
  const [operations, activityValuations] = await Promise.all([
    operationsPromise,
    activityValuationsPromise,
  ]);
  const results = {
    holdings,
    valuations,
    lots,
    operations,
    activityValuations,
    memberships: secondWave[0],
    instruments: secondWave[1],
    prices: secondWave[2],
    fx: secondWave[3],
  };
  const allResults = [
    holdings,
    valuations,
    lots,
    operations,
    activityValuations,
    ...secondWave,
  ];
  return {
    durationMs: performance.now() - started,
    calls: allResults.filter((result) => !result.skipped).length,
    requests: allResults,
    results,
    raw: currentContract(results),
    responseBytes: allResults.reduce(
      (sum, result) => sum + (result.responseBytes ?? 0),
      0,
    ),
  };
}

async function prototypeShape(url, requestHeaders) {
  const result = await request(url, requestHeaders, rpcPath(RPC), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  return {
    durationMs: result.durationMs,
    calls: 1,
    requests: [result],
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
  const rawMatches = [];
  const valuationMatches = [];
  const portfolioMatches = [];
  const valuationNow = new Date();
  for (let index = 0; index < repeats; index += 1) {
    const currentSample = await currentShape(url, requestHeaders);
    const prototypeSample = await prototypeShape(url, requestHeaders);
    current.push(currentSample);
    prototype.push(prototypeSample);
    rawMatches.push(
      JSON.stringify(currentSample.raw) === JSON.stringify(prototypeSample.raw),
    );
    valuationMatches.push(
      JSON.stringify(valuationContract(currentSample.raw, valuationNow)) ===
        JSON.stringify(valuationContract(prototypeSample.raw, valuationNow)),
    );
    portfolioMatches.push(
      JSON.stringify(portfolioContract(currentSample.raw, valuationNow)) ===
        JSON.stringify(portfolioContract(prototypeSample.raw, valuationNow)),
    );
  }
  const shapeSummary = (samples) => ({
    duration: summarize(samples.map((sample) => sample.durationMs)),
    responseBytes: summarize(samples.map((sample) => sample.responseBytes)),
    calls: [...new Set(samples.map((sample) => sample.calls))],
    errors: samples.reduce(
      (count, sample) =>
        count + sample.requests.filter((result) => !result.ok).length,
      0,
    ),
  });
  const result = (matches) => ({
    samples: matches.length,
    matches: matches.filter(Boolean).length,
    mismatches: matches
      .map((matched, index) => (matched ? null : index + 1))
      .filter((index) => index != null),
  });
  return {
    current: shapeSummary(current),
    candidate: shapeSummary(prototype),
    rawInputEquivalence: result(rawMatches),
    valuationEquivalence: result(valuationMatches),
    portfolioEquivalence: result(portfolioMatches),
  };
}

async function tenancyProbe(url, publicKey, primarySession) {
  const identities = [{ name: "primary", session: primarySession }];
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
    const [memberships, activeHoldings, candidate] = await Promise.all([
      request(
        url,
        requestHeaders,
        pathFor("household_members", "household_id", [
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
      prototypeShape(url, requestHeaders),
    ]);
    const candidateRows = candidate.raw;
    rows.push({
      identity: identity.name,
      activeMemberships: rowsOf(memberships.data).length,
      activeHoldings: rowsOf(activeHoldings.data).length,
      candidateRows: candidateRows.length,
      rpcStatus: candidate.results[0].status,
      rpcErrorCode: candidate.results[0].errorCode,
      holdingIds: candidateRows.map((row) => row.holdingId),
      formerOwnerRows: candidateRows.filter(
        (row) => row.ownerMembershipId != null && !row.ownerMembershipIsActive,
      ).length,
    });
  }
  const primary = rows[0];
  const nonPrimary = rows.slice(1).map((row) => ({
    identity: row.identity,
    sharesPrimaryHolding:
      primary?.holdingIds.some((id) => row.holdingIds.includes(id)) ?? false,
    nonMemberHasCandidateRows:
      row.activeMemberships === 0 && row.candidateRows > 0,
  }));
  const anonymous = await request(
    url,
    { apikey: publicKey, Accept: "application/json" },
    rpcPath(RPC),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    },
  );
  return {
    identities: rows.map(({ holdingIds: _holdingIds, ...row }) => {
      void _holdingIds;
      return row;
    }),
    nonMemberComparisons: nonPrimary,
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
    process.env.VINHA_INVESTMENTS_LIST_BENCH_REPEATS ?? DEFAULT_REPEATS,
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
