import { beforeEach, describe, expect, it, vi } from "vitest";

const requestCache = vi.hoisted(() => {
  let generation = 0;
  return {
    beginRequest: () => {
      generation += 1;
    },
    wrap<Args extends unknown[], Result>(fn: (...args: Args) => Result) {
      const store = new Map<string, Result>();
      let seenGeneration = -1;
      return (...args: Args): Result => {
        if (seenGeneration !== generation) {
          store.clear();
          seenGeneration = generation;
        }
        const key = JSON.stringify(args);
        if (!store.has(key)) {
          store.set(key, fn(...args));
        }
        return store.get(key) as Result;
      };
    },
  };
});

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: requestCache.wrap,
  };
});

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/list-active-membership-ids", () => ({
  listActiveMembershipIds: vi.fn(async () => new Set<string>()),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { listActiveMembershipIds } from "@/modules/tenancy/application/list-active-membership-ids";
import { AccountingMethod } from "@/modules/investments/domain";
import {
  InvestmentAssetClass,
  InvestmentHistoryStatus,
  InvestmentIncomeKind,
  InvestmentLifecycleStatus,
  InvestmentOperationType,
  InvestmentValuationSource,
  InvestmentVisibilityContext,
  INVESTMENT_REPORTING_CURRENCY,
  MarketDataProvider,
  MarketFxProvider,
  MarketPricingMode,
  MarketPriceType,
} from "@/modules/investments/application/investment-constants";
import { listInvestmentPortfolio } from "@/modules/investments/application/queries/investment-queries";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";

const HOUSEHOLD_ID = "household-1";
const MEMBERSHIP_ID = "membership-1";
const ACTIVE_HOLDING_ID = "holding-active";
const CLOSED_HOLDING_ID = "holding-closed";
const VALUATION_ID = "valuation-1";
const SELL_OPERATION_ID = "operation-sell";
const INCOME_OPERATION_ID = "operation-income";
const HOLDINGS_TABLE = "investment_holdings";
const OPERATIONS_TABLE = "investment_operations";
const VALUATIONS_TABLE = "investment_valuations";
const LOTS_TABLE = "investment_lots";
const MARKET_INSTRUMENTS_TABLE = "market_instruments";
const MARKET_PRICES_TABLE = "market_instrument_prices";
const MARKET_FX_TABLE = "market_currency_rates";
const INSTRUMENT_ID = "instrument-1";
const OWNER_MEMBERSHIP_ID = "membership-owner-1";
const PRICE_DATE = "2026-08-15";

const ACTIVE_HOLDING_ROW = {
  id: ACTIVE_HOLDING_ID,
  household_id: HOUSEHOLD_ID,
  name: "FPT",
  symbol: "FPT",
  instrument_id: null,
  asset_class: InvestmentAssetClass.STOCK,
  provider_custodian: "SSI",
  visibility_context: InvestmentVisibilityContext.HOUSEHOLD,
  lifecycle_status: InvestmentLifecycleStatus.ACTIVE,
  history_status: InvestmentHistoryStatus.OPENING_POSITION,
  quantity: "10",
  remaining_total_cost_basis: 1_000_000,
  notes: null,
  financial_scope: FINANCIAL_SCOPE.HOUSEHOLD,
  owner_membership_id: null,
  accounting_method: AccountingMethod.WEIGHTED_AVERAGE,
};

const CLOSED_HOLDING_ROW = {
  ...ACTIVE_HOLDING_ROW,
  id: CLOSED_HOLDING_ID,
  name: "Closed",
  symbol: "OLD",
  quantity: "0",
  remaining_total_cost_basis: 0,
  lifecycle_status: InvestmentLifecycleStatus.EXITED,
};

const LINKED_HOLDING_ROW = {
  ...ACTIVE_HOLDING_ROW,
  instrument_id: INSTRUMENT_ID,
  owner_membership_id: OWNER_MEMBERSHIP_ID,
};

const MARKET_INSTRUMENT_ROW = {
  id: INSTRUMENT_ID,
  asset_class: InvestmentAssetClass.STOCK,
  symbol: "FPT",
  name: "FPT Corporation",
  exchange: "HOSE",
  currency: INVESTMENT_REPORTING_CURRENCY,
  pricing_mode: MarketPricingMode.UNIT_PRICE,
  auto_price_supported: true,
  is_active: true,
  metadata: {},
};

const MARKET_PRICE_ROW = {
  instrument_id: INSTRUMENT_ID,
  price: 120_000,
  currency: INVESTMENT_REPORTING_CURRENCY,
  price_type: MarketPriceType.LAST,
  price_date: PRICE_DATE,
  fetched_at: "2026-08-15T00:00:00.000Z",
  provider: MarketDataProvider.VNSTOCK,
  metadata: {},
  updated_at: "2026-08-15T00:00:00.000Z",
};

const MARKET_FX_ROW = {
  base_currency: "USD",
  quote_currency: INVESTMENT_REPORTING_CURRENCY,
  rate: 25_000,
  rate_date: PRICE_DATE,
  fetched_at: "2026-08-15T00:00:00.000Z",
  provider: MarketFxProvider.FRANKFURTER,
  updated_at: "2026-08-15T00:00:00.000Z",
};

const VALUATION_ROW = {
  id: VALUATION_ID,
  holding_id: ACTIVE_HOLDING_ID,
  value_vnd: 1_200_000,
  valuation_date: "2026-08-15",
  created_at: "2026-08-15T00:00:00.000Z",
  quantity: "10",
  unit_price_vnd: 120_000,
  source: InvestmentValuationSource.MANUAL,
  input_currency: null,
  input_unit_price: null,
  input_total_value: null,
  input_rate_to_vnd: null,
  input_rate_date: null,
  input_rate_source: null,
};

const SELL_OPERATION_ROW = {
  id: SELL_OPERATION_ID,
  operation_type: InvestmentOperationType.SELL,
  source_holding_id: CLOSED_HOLDING_ID,
  destination_holding_id: null,
  source_quantity: "10",
  destination_quantity: null,
  executed_value_vnd: 1_050_000,
  quoted_value_vnd: null,
  source_basis_consumed: 1_000_000,
  destination_basis_added: null,
  realized_result_vnd: 50_000,
  income_kind: null,
  transaction_id: null,
  correlation_id: "corr-sell",
  effective_date: "2026-07-01",
  unit_price_vnd: 105_000,
  input_currency: null,
  input_amount: null,
  input_unit_price: null,
  input_total_value: null,
  input_executed_value: null,
  input_quoted_value: null,
  input_cost_basis: null,
  input_current_valuation: null,
  input_rate_to_vnd: null,
  input_rate_date: null,
  input_rate_source: null,
  investment_fees: [{ fee_value_vnd: 2_000 }],
};

const INCOME_OPERATION_ROW = {
  id: INCOME_OPERATION_ID,
  operation_type: InvestmentOperationType.INVESTMENT_INCOME,
  source_holding_id: ACTIVE_HOLDING_ID,
  destination_holding_id: null,
  source_quantity: null,
  destination_quantity: null,
  executed_value_vnd: 20_000,
  quoted_value_vnd: null,
  source_basis_consumed: null,
  destination_basis_added: null,
  realized_result_vnd: null,
  income_kind: InvestmentIncomeKind.DIVIDEND,
  transaction_id: null,
  correlation_id: "corr-income",
  effective_date: "2026-08-01",
  unit_price_vnd: null,
  input_currency: null,
  input_amount: null,
  input_unit_price: null,
  input_total_value: null,
  input_executed_value: null,
  input_quoted_value: null,
  input_cost_basis: null,
  input_current_valuation: null,
  input_rate_to_vnd: null,
  input_rate_date: null,
  input_rate_source: null,
  investment_fees: [{ fee_value_vnd: 1_000 }],
};

type QueryResult = { data: unknown; error: unknown };

function thenableQuery(result: Promise<QueryResult>) {
  const query: Record<string, unknown> = {};
  const self = () => query;
  for (const method of ["select", "eq", "neq", "in", "or", "gt", "order"]) {
    query[method] = vi.fn(self);
  }
  query.then = (
    resolve: (value: QueryResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => result.then(resolve, reject);
  return query;
}

function createPortfolioClient(input: {
  holdings?: unknown[];
  lots?: unknown[];
  valuations?: unknown[];
  operations?: unknown[];
  instruments?: unknown[];
  prices?: unknown[];
  fxRates?: unknown[];
  delayHoldings?: Promise<void>;
  delayOperations?: Promise<void>;
  delayInstruments?: Promise<void>;
  delayPrices?: Promise<void>;
  delayFx?: Promise<void>;
  holdingsError?: object | null;
  operationsError?: object | null;
  instrumentsError?: object | null;
  pricesError?: object | null;
  fxError?: object | null;
  onTable?: (table: string) => void;
}) {
  const holdingsData = input.holdings ?? [
    ACTIVE_HOLDING_ROW,
    CLOSED_HOLDING_ROW,
  ];
  const valuationsData = input.valuations ?? [VALUATION_ROW];
  const lotsData = input.lots ?? [];
  const operationsData = input.operations ?? [
    SELL_OPERATION_ROW,
    INCOME_OPERATION_ROW,
  ];
  const instrumentsData = input.instruments ?? [MARKET_INSTRUMENT_ROW];
  const pricesData = input.prices ?? [MARKET_PRICE_ROW];
  const fxData = input.fxRates ?? [MARKET_FX_ROW];

  return {
    from: vi.fn((table: string) => {
      input.onTable?.(table);
      if (table === HOLDINGS_TABLE) {
        return thenableQuery(
          (input.delayHoldings ?? Promise.resolve()).then(() => ({
            data: input.holdingsError ? null : holdingsData,
            error: input.holdingsError ?? null,
          })),
        );
      }
      if (table === OPERATIONS_TABLE) {
        return thenableQuery(
          (input.delayOperations ?? Promise.resolve()).then(() => ({
            data: input.operationsError ? null : operationsData,
            error: input.operationsError ?? null,
          })),
        );
      }
      if (table === VALUATIONS_TABLE) {
        return thenableQuery(
          Promise.resolve({ data: valuationsData, error: null }),
        );
      }
      if (table === LOTS_TABLE) {
        return thenableQuery(Promise.resolve({ data: lotsData, error: null }));
      }
      if (table === MARKET_INSTRUMENTS_TABLE) {
        return thenableQuery(
          (input.delayInstruments ?? Promise.resolve()).then(() => ({
            data: input.instrumentsError ? null : instrumentsData,
            error: input.instrumentsError ?? null,
          })),
        );
      }
      if (table === MARKET_PRICES_TABLE) {
        return thenableQuery(
          (input.delayPrices ?? Promise.resolve()).then(() => ({
            data: input.pricesError ? null : pricesData,
            error: input.pricesError ?? null,
          })),
        );
      }
      if (table === MARKET_FX_TABLE) {
        return thenableQuery(
          (input.delayFx ?? Promise.resolve()).then(() => ({
            data: input.fxError ? null : fxData,
            error: input.fxError ?? null,
          })),
        );
      }
      return thenableQuery(Promise.resolve({ data: [], error: null }));
    }),
  };
}

function linkedPortfolioClient(
  input: Omit<Parameters<typeof createPortfolioClient>[0], "holdings"> = {},
) {
  return createPortfolioClient({
    holdings: [LINKED_HOLDING_ROW],
    ...input,
  });
}

describe("listInvestmentPortfolio orchestration", () => {
  beforeEach(() => {
    requestCache.beginRequest();
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-1",
      householdId: HOUSEHOLD_ID,
      membershipId: MEMBERSHIP_ID,
    });
    vi.mocked(listActiveMembershipIds).mockResolvedValue(new Set<string>());
  });

  it("starts holdings and activities before either read resolves", async () => {
    let releaseHoldings!: () => void;
    let releaseOperations!: () => void;
    const delayHoldings = new Promise<void>((resolve) => {
      releaseHoldings = resolve;
    });
    const delayOperations = new Promise<void>((resolve) => {
      releaseOperations = resolve;
    });
    const started = {
      holdings: false,
      operations: false,
    };
    const client = createPortfolioClient({
      delayHoldings,
      delayOperations,
      onTable: (table) => {
        if (table === HOLDINGS_TABLE) started.holdings = true;
        if (table === OPERATIONS_TABLE) started.operations = true;
      },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const pending = listInvestmentPortfolio();
    await vi.waitFor(() => {
      expect(started.holdings).toBe(true);
      expect(started.operations).toBe(true);
    });
    expect(started.holdings && started.operations).toBe(true);

    releaseHoldings();
    releaseOperations();
    await expect(pending).resolves.not.toBeNull();
  });

  it("keeps portfolio totals, ordering, and valuation identical for the same reads", async () => {
    const tables: string[] = [];
    const client = createPortfolioClient({
      onTable: (table) => {
        tables.push(table);
      },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const portfolio = await listInvestmentPortfolio();
    expect(portfolio).not.toBeNull();
    if (!portfolio) return;

    expect(portfolio.holdings.map((holding) => holding.id)).toEqual([
      ACTIVE_HOLDING_ID,
      CLOSED_HOLDING_ID,
    ]);
    expect(portfolio.activeHoldings.map((holding) => holding.id)).toEqual([
      ACTIVE_HOLDING_ID,
    ]);
    expect(portfolio.closedHoldings.map((holding) => holding.id)).toEqual([
      CLOSED_HOLDING_ID,
    ]);
    expect(portfolio.closedPositionCount).toBe(1);
    expect(portfolio.incompleteBasisCount).toBe(0);
    expect(portfolio.totalCurrentValue).toBe(1_200_000);
    expect(portfolio.totalRemainingCostBasis).toBe(1_000_000);
    expect(portfolio.unrealizedResult).toBe(200_000);
    expect(portfolio.estimatedUnrealizedPnl).toBe(200_000);
    expect(portfolio.estimatedUnrealizedPnlPercent).toBe(0.2);
    expect(portfolio.realizedSaleResult).toBe(50_000);
    expect(portfolio.investmentIncome).toBe(20_000);
    expect(portfolio.investmentFees).toBe(3_000);
    expect(portfolio.valuationCoverage).toEqual({ included: 1, total: 1 });
    expect(portfolio.basisCoverage).toEqual({ included: 1, total: 2 });
    expect(portfolio.allocationByAssetClass).toEqual([
      {
        assetClass: InvestmentAssetClass.STOCK,
        valueVnd: 1_200_000,
        shareBasisPoints: 10_000,
      },
    ]);

    const active = portfolio.activeHoldings[0];
    expect(active.currentValue).toBe(1_200_000);
    expect(active.currentValuationDate).toBe(VALUATION_ROW.valuation_date);
    expect(active.currentValuationSource).toBe(
      InvestmentValuationSource.MANUAL,
    );
    expect(active.estimatedUnrealizedPnl).toBe(200_000);

    expect(tables.filter((table) => table === VALUATIONS_TABLE)).toHaveLength(
      2,
    );
    expect(
      client.from.mock.calls.some(([table]) => table === OPERATIONS_TABLE),
    ).toBe(true);
    expect(tables).not.toContain(MARKET_INSTRUMENTS_TABLE);
    expect(tables).not.toContain(MARKET_PRICES_TABLE);
    expect(tables).not.toContain(MARKET_FX_TABLE);
  });

  it("returns null when holdings fail and does not emit a partial portfolio", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = createPortfolioClient({
      holdingsError: { message: "holdings failed" },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    await expect(listInvestmentPortfolio()).resolves.toBeNull();
    expect(client.from).toHaveBeenCalledWith(OPERATIONS_TABLE);
    errorSpy.mockRestore();
  });

  it("returns null when activities fail and does not emit a partial portfolio", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = createPortfolioClient({
      operationsError: { message: "operations failed" },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    await expect(listInvestmentPortfolio()).resolves.toBeNull();
    expect(client.from).toHaveBeenCalledWith(HOLDINGS_TABLE);
    errorSpy.mockRestore();
  });

  it("starts market and FX before membership resolves", async () => {
    let releaseMembers!: () => void;
    const delayMembers = new Promise<void>((resolve) => {
      releaseMembers = resolve;
    });
    const started = {
      members: false,
      instruments: false,
      prices: false,
      fx: false,
    };
    vi.mocked(listActiveMembershipIds).mockImplementation(() => {
      started.members = true;
      return delayMembers.then(() => new Set([OWNER_MEMBERSHIP_ID]));
    });
    const client = linkedPortfolioClient({
      onTable: (table) => {
        if (table === MARKET_INSTRUMENTS_TABLE) started.instruments = true;
        if (table === MARKET_PRICES_TABLE) started.prices = true;
        if (table === MARKET_FX_TABLE) started.fx = true;
      },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const pending = listInvestmentPortfolio();
    await vi.waitFor(() => {
      expect(started.members).toBe(true);
      expect(started.instruments).toBe(true);
      expect(started.prices).toBe(true);
      expect(started.fx).toBe(true);
    });
    expect(started.instruments && started.prices && started.fx).toBe(true);

    releaseMembers();
    await expect(pending).resolves.not.toBeNull();
  });

  it("does not start market or FX until holdings provide instrument ids", async () => {
    let releaseHoldings!: () => void;
    const delayHoldings = new Promise<void>((resolve) => {
      releaseHoldings = resolve;
    });
    const started = {
      holdings: false,
      instruments: false,
      prices: false,
      fx: false,
      members: false,
    };
    vi.mocked(listActiveMembershipIds).mockImplementation(async () => {
      started.members = true;
      return new Set([OWNER_MEMBERSHIP_ID]);
    });
    const client = linkedPortfolioClient({
      delayHoldings,
      onTable: (table) => {
        if (table === HOLDINGS_TABLE) started.holdings = true;
        if (table === MARKET_INSTRUMENTS_TABLE) started.instruments = true;
        if (table === MARKET_PRICES_TABLE) started.prices = true;
        if (table === MARKET_FX_TABLE) started.fx = true;
      },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const pending = listInvestmentPortfolio();
    await vi.waitFor(() => {
      expect(started.holdings).toBe(true);
    });
    expect(started.instruments).toBe(false);
    expect(started.prices).toBe(false);
    expect(started.fx).toBe(false);
    expect(started.members).toBe(false);

    releaseHoldings();
    await vi.waitFor(() => {
      expect(started.instruments).toBe(true);
      expect(started.prices).toBe(true);
      expect(started.fx).toBe(true);
      expect(started.members).toBe(true);
    });
    await expect(pending).resolves.not.toBeNull();
  });

  it("starts instruments, prices, and FX before any of those reads resolve", async () => {
    let releaseInstruments!: () => void;
    let releasePrices!: () => void;
    let releaseFx!: () => void;
    const delayInstruments = new Promise<void>((resolve) => {
      releaseInstruments = resolve;
    });
    const delayPrices = new Promise<void>((resolve) => {
      releasePrices = resolve;
    });
    const delayFx = new Promise<void>((resolve) => {
      releaseFx = resolve;
    });
    const started = {
      instruments: false,
      prices: false,
      fx: false,
    };
    const client = linkedPortfolioClient({
      delayInstruments,
      delayPrices,
      delayFx,
      onTable: (table) => {
        if (table === MARKET_INSTRUMENTS_TABLE) started.instruments = true;
        if (table === MARKET_PRICES_TABLE) started.prices = true;
        if (table === MARKET_FX_TABLE) started.fx = true;
      },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const pending = listInvestmentPortfolio();
    await vi.waitFor(() => {
      expect(started.instruments).toBe(true);
      expect(started.prices).toBe(true);
      expect(started.fx).toBe(true);
    });

    releaseInstruments();
    releasePrices();
    releaseFx();
    await expect(pending).resolves.not.toBeNull();
  });

  it("returns null when market instruments fail and does not emit a partial portfolio", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = linkedPortfolioClient({
      instrumentsError: { message: "instruments failed" },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    await expect(listInvestmentPortfolio()).resolves.toBeNull();
    expect(client.from).toHaveBeenCalledWith(MARKET_PRICES_TABLE);
    expect(client.from).toHaveBeenCalledWith(MARKET_FX_TABLE);
    expect(client.from).toHaveBeenCalledWith(OPERATIONS_TABLE);
    errorSpy.mockRestore();
  });

  it("loads each market table once per portfolio read", async () => {
    const tables: string[] = [];
    const client = linkedPortfolioClient({
      onTable: (table) => {
        tables.push(table);
      },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    await expect(listInvestmentPortfolio()).resolves.not.toBeNull();
    expect(
      tables.filter((table) => table === MARKET_INSTRUMENTS_TABLE),
    ).toHaveLength(1);
    expect(
      tables.filter((table) => table === MARKET_PRICES_TABLE),
    ).toHaveLength(1);
    expect(tables.filter((table) => table === MARKET_FX_TABLE)).toHaveLength(1);
    expect(listActiveMembershipIds).toHaveBeenCalledTimes(1);
    expect(tables.filter((table) => table === HOLDINGS_TABLE)).toHaveLength(1);
    expect(tables.filter((table) => table === OPERATIONS_TABLE)).toHaveLength(
      1,
    );
    expect(tables.filter((table) => table === VALUATIONS_TABLE)).toHaveLength(
      2,
    );
  });
});
