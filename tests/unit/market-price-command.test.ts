import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  const prices = new Map<string, unknown>();
  const runs: Array<Record<string, unknown>> = [];
  const acquireResults: boolean[] = [];
  const fetchPrices = vi.fn(async () => ({
    prices: [
      {
        instrumentId: "instrument-1",
        price: 100,
        currency: "USD",
        priceType: "LAST",
        priceDate: "2026-08-22",
        fetchedAt: "2026-08-22T10:00:00.000Z",
        provider: "COINGECKO",
        metadata: {},
      },
    ],
    failures: [{ instrumentId: "instrument-2", error: "Provider unavailable" }],
  }));
  return { prices, runs, acquireResults, fetchPrices };
});

vi.mock("@/modules/platform/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    rpc: vi.fn(async (name: string) => {
      if (name === "try_acquire_market_price_sync_lock") {
        return { data: state.acquireResults.shift() ?? true, error: null };
      }
      return { data: null, error: null };
    }),
    from: (table: string) => {
      const builder = {
        insert: (row: Record<string, unknown>) => {
          state.runs.push(row);
          return builder;
        },
        select: () => builder,
        single: async () => ({
          data: { id: `run-${state.runs.length}` },
          error: null,
        }),
        update: (row: Record<string, unknown>) => {
          state.runs.push(row);
          return builder;
        },
        eq: () => builder,
        upsert: async (rows: unknown) => {
          const values = Array.isArray(rows) ? rows : [rows];
          if (table === "market_instrument_prices") {
            for (const value of values as Array<{ instrument_id: string }>) {
              state.prices.set(value.instrument_id, value);
            }
          }
          return { error: null };
        },
      };
      return builder;
    },
  }),
}));

vi.mock(
  "@/modules/investments/application/queries/list-active-market-price-targets",
  () => ({
    listActiveMarketPriceTargets: vi.fn(async () => [
      {
        instrumentId: "instrument-1",
        providerInstrumentId: "bitcoin",
        symbol: "BTC",
        assetClass: "crypto",
        pricingMode: "UNIT_PRICE",
        currency: "USD",
        provider: "COINGECKO",
      },
      {
        instrumentId: "instrument-2",
        providerInstrumentId: "ethereum",
        symbol: "ETH",
        assetClass: "crypto",
        pricingMode: "UNIT_PRICE",
        currency: "USD",
        provider: "COINGECKO",
      },
    ]),
  }),
);

vi.mock("@/modules/investments/infrastructure/market-providers", () => ({
  marketCatalogAdapters: [
    {
      provider: "COINGECKO",
      fetchPrices: state.fetchPrices,
    },
  ],
}));

vi.mock("@/modules/investments/application/commands/sync-market-fx", () => ({
  syncMarketFxRates: vi.fn(async () => true),
}));

import { syncMarketPrices } from "@/modules/investments/application/commands/sync-market-prices";

beforeEach(() => {
  state.prices.clear();
  state.runs.length = 0;
  state.acquireResults.length = 0;
  state.fetchPrices.mockClear();
});

describe("MARKET 03 sync command", () => {
  it("persists successful prices and records partial provider failure", async () => {
    const result = await syncMarketPrices({});
    expect(result).toMatchObject({
      status: "partial",
      requestedCount: 2,
      successCount: 1,
      failedCount: 1,
    });
    expect(state.prices.size).toBe(1);
    expect(state.prices.has("instrument-2")).toBe(false);
    expect(state.runs.some((run) => run.status === "partial")).toBe(true);
  });

  it("updates the same current row on a second run", async () => {
    await syncMarketPrices({});
    await syncMarketPrices({});
    expect(state.prices.size).toBe(1);
    expect(state.fetchPrices).toHaveBeenCalledTimes(2);
  });

  it("skips a concurrent run when the lease is held", async () => {
    state.acquireResults.push(true, false);
    const [first, second] = await Promise.all([
      syncMarketPrices({}),
      syncMarketPrices({}),
    ]);
    expect([first.skipped, second.skipped].sort()).toEqual([false, true]);
    expect(state.fetchPrices).toHaveBeenCalledTimes(1);
  });
});
