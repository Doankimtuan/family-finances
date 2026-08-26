import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  InvestmentAssetClass,
  MarketDataProvider,
  MarketPricingMode,
} from "@/modules/investments/application/investment-constants";
import {
  coingeckoAdapter,
  fmarketAdapter,
  vangTodayAdapter,
  vnstockAdapter,
} from "@/modules/investments/infrastructure/market-providers";

const MARKET_SYNC_MIGRATION = readFileSync(
  "supabase/migrations/20260825125516_v1_baseline.sql",
  "utf8",
);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("MARKET 02 provider normalization", () => {
  it("uses the CoinGecko id and does not duplicate canonical fields in metadata", () => {
    const instrument = coingeckoAdapter.normalizeProviderResult({
      id: "wrapped-bitcoin",
      symbol: "wbtc",
      name: "Wrapped Bitcoin",
      market_cap_rank: 20,
    });
    expect(instrument).toMatchObject({
      assetClass: InvestmentAssetClass.CRYPTO,
      symbol: "WBTC",
      currency: "USD",
      pricingMode: MarketPricingMode.UNIT_PRICE,
      provider: MarketDataProvider.COINGECKO,
      providerInstrumentId: "wrapped-bitcoin",
    });
    expect(instrument?.metadata).toEqual({ marketCapRank: 20 });
    expect(instrument?.metadata).not.toHaveProperty("symbol");
    expect(instrument?.metadata).not.toHaveProperty("name");
  });

  it("maps Vnstock stock, ETF-like fund, and bond records to canonical semantics", () => {
    const stock = vnstockAdapter.normalizeProviderResult({
      symbol: "FPT",
      name: "FPT Corporation",
      exchange: "HOSE",
      type: "stock",
    });
    const etf = vnstockAdapter.normalizeProviderResult({
      symbol: "E1VFVN30",
      name: "Quỹ ETF DCVFMVN30",
      exchange: "HOSE",
      type: "fund",
    });
    const bond = vnstockAdapter.normalizeProviderResult({
      symbol: "BID126008",
      type: "bond",
      exchange: "HNX",
    });
    expect(stock).toMatchObject({
      assetClass: InvestmentAssetClass.STOCK,
      pricingMode: MarketPricingMode.UNIT_PRICE,
      autoPriceSupported: true,
      providerInstrumentId: "FPT",
    });
    expect(etf).toMatchObject({
      assetClass: InvestmentAssetClass.FUND,
      pricingMode: MarketPricingMode.UNIT_PRICE,
    });
    expect(bond).toMatchObject({
      assetClass: InvestmentAssetClass.BOND,
      pricingMode: MarketPricingMode.TOTAL_VALUE,
      autoPriceSupported: false,
      name: "BID126008",
    });
  });

  it("uses the FMarket numeric product id for fund source identity", () => {
    const instrument = fmarketAdapter.normalizeProviderResult({
      id: 45,
      shortName: "PVBF",
      name: "PVCom Fund",
      code: "PVBF",
      nav: 15_658.98,
    });
    expect(instrument).toMatchObject({
      assetClass: InvestmentAssetClass.FUND,
      pricingMode: MarketPricingMode.NAV_PER_UNIT,
      currency: "VND",
      providerInstrumentId: "45",
    });
    expect(instrument?.metadata).not.toHaveProperty("nav");
  });

  it("maps Vang.today domestic gold to buyback pricing", () => {
    const instrument = vangTodayAdapter.normalizeProviderResult({
      type_code: "SJL1L10",
      name: "SJC 9999",
      buy: 147_600_000,
      currency: "VND",
    });
    expect(instrument).toMatchObject({
      assetClass: InvestmentAssetClass.GOLD,
      pricingMode: MarketPricingMode.BUYBACK_PRICE,
      autoPriceSupported: true,
      provider: MarketDataProvider.VANG_TODAY,
      providerInstrumentId: "SJL1L10",
      currency: "VND",
    });
  });

  it("bounds CoinGecko catalog listing to 500 instruments", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        Array.from({ length: 250 }, (_, index) => ({
          id: `coin-${index}`,
          symbol: `c${index}`,
          name: `Coin ${index}`,
        })),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const rows = await coingeckoAdapter.listInstruments(
      InvestmentAssetClass.CRYPTO,
    );
    expect(rows).toHaveLength(500);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("MARKET 02 migration security", () => {
  it("keeps sync runs operational and service-role-only", () => {
    expect(MARKET_SYNC_MIGRATION).toMatch(
      /create table "public"\."market_sync_runs"/,
    );
    expect(MARKET_SYNC_MIGRATION).toMatch(/enable row level security/);
    expect(MARKET_SYNC_MIGRATION).toMatch(
      /revoke all on all tables in schema public from anon, authenticated/,
    );
    expect(MARKET_SYNC_MIGRATION).toMatch(
      /grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"\."market_sync_runs" to "service_role"/,
    );
    expect(MARKET_SYNC_MIGRATION).toMatch(/market_instrument_prices/);
  });
});
