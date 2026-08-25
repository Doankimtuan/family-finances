import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  InvestmentAssetClass,
  MarketDataProvider,
  MarketPricingMode,
  MarketPriceType,
} from "@/modules/investments/application/investment-constants";
import type { MarketPriceFetchTarget } from "@/modules/investments/application/investment-types";
import {
  coingeckoAdapter,
  fmarketAdapter,
  vnstockAdapter,
} from "@/modules/investments/infrastructure/market-providers";

const MIGRATION = readFileSync(
  "supabase/migrations/20260825125516_v1_baseline.sql",
  "utf8",
);

const target = (
  provider: MarketDataProvider,
  overrides: Partial<MarketPriceFetchTarget> = {},
): MarketPriceFetchTarget => ({
  instrumentId: "instrument-1",
  providerInstrumentId: "provider-1",
  symbol: "P1",
  assetClass: InvestmentAssetClass.FUND,
  pricingMode: MarketPricingMode.NAV_PER_UNIT,
  currency: "VND",
  provider,
  ...overrides,
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("MARKET 03 price adapters", () => {
  it("normalizes a CoinGecko latest price with provider date", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          bitcoin: { usd: 78_000, last_updated_at: 1_787_353_260 },
        }),
      ),
    );
    const result = await coingeckoAdapter.fetchPrices([
      target(MarketDataProvider.COINGECKO, {
        providerInstrumentId: "bitcoin",
        symbol: "BTC",
        assetClass: InvestmentAssetClass.CRYPTO,
        pricingMode: MarketPricingMode.UNIT_PRICE,
        currency: "USD",
      }),
    ]);
    expect(result.failures).toHaveLength(0);
    expect(result.prices[0]).toMatchObject({
      price: 78_000,
      currency: "USD",
      priceType: MarketPriceType.LAST,
      provider: MarketDataProvider.COINGECKO,
    });
    expect(result.prices[0].priceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("batches VNSTOCK symbols and maps the current match price", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json([{ SB: "FPT", CP: 125_000, t: "2026-08-22 08:00" }]),
      ),
    );
    const result = await vnstockAdapter.fetchPrices([
      target(MarketDataProvider.VNSTOCK, {
        providerInstrumentId: "FPT",
        symbol: "FPT",
        assetClass: InvestmentAssetClass.STOCK,
        pricingMode: MarketPricingMode.UNIT_PRICE,
      }),
    ]);
    expect(result).toMatchObject({
      prices: [
        {
          price: 125_000,
          priceType: MarketPriceType.LAST,
          provider: MarketDataProvider.VNSTOCK,
          priceDate: "2026-08-22",
        },
      ],
      failures: [],
    });
  });

  it("uses the FMARKET NAV and preserves the provider NAV date", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          data: {
            rows: [
              {
                id: 45,
                nav: 15_000,
                extra: {
                  currentNAV: 15_658.98,
                  lastNAVDate: 1_787_158_800_000,
                },
              },
            ],
          },
        }),
      ),
    );
    const result = await fmarketAdapter.fetchPrices([
      target(MarketDataProvider.FMARKET, {
        providerInstrumentId: "45",
        symbol: "PVBF",
      }),
    ]);
    expect(result.failures).toHaveLength(0);
    expect(result.prices[0]).toMatchObject({
      price: 15_658.98,
      priceType: MarketPriceType.NAV,
      provider: MarketDataProvider.FMARKET,
    });
    expect(result.prices[0].priceDate).not.toBe(
      result.prices[0].fetchedAt.slice(0, 10),
    );
  });

  it("reports missing provider rows without inventing a price", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({})),
    );
    const result = await coingeckoAdapter.fetchPrices([
      target(MarketDataProvider.COINGECKO, {
        providerInstrumentId: "missing-coin",
      }),
    ]);
    expect(result.prices).toHaveLength(0);
    expect(result.failures).toEqual([
      {
        instrumentId: "instrument-1",
        error: "Provider returned no valid price",
      },
    ]);
  });
});

describe("MARKET 03 migration", () => {
  it("keeps current-price storage and operational state service-only", () => {
    expect(MIGRATION).toMatch(/create table "public"\."market_sync_locks"/);
    expect(MIGRATION).toMatch(/list_active_market_price_targets/);
    expect(MIGRATION).toMatch(/market_instrument_prices/);
    expect(MIGRATION).toMatch(/distinct on \(instrument\.id\)/);
    expect(MIGRATION).toMatch(/holding\.lifecycle_status = 'active'/);
    expect(MIGRATION).toMatch(/instrument\.auto_price_supported = true/);
    expect(MIGRATION).toMatch(/source\.is_enabled = true/);
    expect(MIGRATION).toMatch(/source\.priority asc/);
    expect(MIGRATION).toMatch(/on conflict \(lock_key\) do update/);
    expect(MIGRATION).toMatch(
      /revoke all on all tables in schema public from anon, authenticated/,
    );
    expect(MIGRATION).toMatch(
      /grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"\."market_sync_locks" to "service_role"/,
    );
    expect(MIGRATION).not.toMatch(/market_instrument_price_history/);
    expect(MIGRATION).not.toMatch(/market_instrument_price_snapshots/);
  });

  it("keeps production market cron disabled while retaining the ritual job", () => {
    expect(MIGRATION).toContain("month_ritual_autolock_daily");
    expect(MIGRATION).not.toMatch(/market_price_sync_(crypto|vnstock|fmarket)/);
  });
});
