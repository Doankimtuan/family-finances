import { describe, expect, it } from "vitest";
import {
  InvestmentAssetClass,
  InvestmentValuationSource,
  MarketDataProvider,
  MarketFxProvider,
  MarketPricingMode,
  MarketPriceType,
  MarketValuationFreshness,
  MarketValuationQuality,
  MarketValuationSource,
} from "@/modules/investments/application/investment-constants";
import { resolveInvestmentValuation } from "@/modules/investments/application/market-valuation";
import type {
  MarketCurrencyRate,
  MarketInstrument,
  MarketInstrumentPrice,
} from "@/modules/investments/application/investment-types";

const instrument = (
  overrides: Partial<MarketInstrument> = {},
): MarketInstrument => ({
  id: "instrument-1",
  assetClass: InvestmentAssetClass.STOCK,
  symbol: "FPT",
  name: "FPT",
  exchange: "HOSE",
  currency: "VND",
  pricingMode: MarketPricingMode.UNIT_PRICE,
  autoPriceSupported: true,
  isActive: true,
  metadata: {},
  ...overrides,
});

const price = (
  overrides: Partial<MarketInstrumentPrice> = {},
): MarketInstrumentPrice => ({
  instrumentId: "instrument-1",
  price: 125_000,
  currency: "VND",
  priceType: MarketPriceType.LAST,
  priceDate: "2026-08-21",
  fetchedAt: "2026-08-21T10:00:00.000Z",
  provider: MarketDataProvider.VNSTOCK,
  metadata: {},
  updatedAt: "2026-08-21T10:00:00.000Z",
  ...overrides,
});

const fx = (
  overrides: Partial<MarketCurrencyRate> = {},
): MarketCurrencyRate => ({
  baseCurrency: "USD",
  quoteCurrency: "VND",
  rate: 25_000,
  rateDate: "2026-08-21",
  fetchedAt: "2026-08-21T10:00:00.000Z",
  provider: MarketFxProvider.FRANKFURTER,
  updatedAt: "2026-08-21T10:00:00.000Z",
  ...overrides,
});

const resolve = (
  overrides: Parameters<typeof resolveInvestmentValuation>[0] = {},
) =>
  resolveInvestmentValuation({
    assetClass: InvestmentAssetClass.STOCK,
    quantity: "10",
    remainingCostBasis: 1_000_000,
    instrument: instrument(),
    price: price(),
    fxRate: null,
    manualValuation: null,
    now: new Date("2026-08-22T10:00:00.000Z"),
    ...overrides,
  });

describe("MARKET 04 valuation resolver", () => {
  it("values BTC in VND from its native USD price and current FX rate", () => {
    const result = resolve({
      assetClass: InvestmentAssetClass.CRYPTO,
      quantity: "0.5",
      remainingCostBasis: 800_000_000,
      instrument: instrument({
        assetClass: InvestmentAssetClass.CRYPTO,
        symbol: "BTC",
        currency: "USD",
      }),
      price: price({
        currency: "USD",
        price: 60_000,
        provider: MarketDataProvider.COINGECKO,
        priceDate: "2026-08-22",
        fetchedAt: "2026-08-22T10:00:00.000Z",
      }),
      fxRate: fx(),
    });
    expect(result.currentValue).toBe(750_000_000);
    expect(result.unitPriceVnd).toBe(1_500_000_000);
    expect(result.estimatedUnrealizedPnl).toBe(-50_000_000);
    expect(result.estimatedUnrealizedPnlPercent).toBe(-0.0625);
    expect(result.quality).toBe(MarketValuationQuality.AUTO_CURRENT);
  });

  it("values stocks and funds by quantity, using NAV for funds", () => {
    const stock = resolve({});
    const fund = resolve({
      assetClass: InvestmentAssetClass.FUND,
      quantity: "100",
      instrument: instrument({
        assetClass: InvestmentAssetClass.FUND,
        pricingMode: MarketPricingMode.NAV_PER_UNIT,
      }),
      price: price({
        price: 15_000,
        priceType: MarketPriceType.NAV,
      }),
    });
    expect(stock.currentValue).toBe(1_250_000);
    expect(fund.currentValue).toBe(1_500_000);
    expect(fund.priceType).toBe(MarketPriceType.NAV);
  });

  it("uses one shared instrument price for multiple holdings", () => {
    const sharedPrice = price({ instrumentId: "shared" });
    const sharedInstrument = instrument({ id: "shared" });
    const first = resolve({
      instrument: sharedInstrument,
      price: sharedPrice,
      quantity: "2",
    });
    const second = resolve({
      instrument: sharedInstrument,
      price: sharedPrice,
      quantity: "3",
    });
    expect(first.currentValue).toBe(250_000);
    expect(second.currentValue).toBe(375_000);
  });

  it("uses total-value prices without multiplying bond quantity", () => {
    const result = resolve({
      assetClass: InvestmentAssetClass.BOND,
      quantity: "10",
      instrument: instrument({
        assetClass: InvestmentAssetClass.BOND,
        pricingMode: MarketPricingMode.TOTAL_VALUE,
      }),
      price: price({
        price: 12_000_000,
        priceType: MarketPriceType.TOTAL_VALUE,
      }),
    });
    expect(result.currentValue).toBe(12_000_000);
  });

  it("keeps stale crypto and NAV values usable", () => {
    const crypto = resolve({
      assetClass: InvestmentAssetClass.CRYPTO,
      instrument: instrument({
        assetClass: InvestmentAssetClass.CRYPTO,
        currency: "USD",
      }),
      price: price({
        currency: "USD",
        fetchedAt: "2026-08-20T10:00:00.000Z",
      }),
      fxRate: fx(),
    });
    const fund = resolve({
      assetClass: InvestmentAssetClass.FUND,
      instrument: instrument({
        assetClass: InvestmentAssetClass.FUND,
        pricingMode: MarketPricingMode.NAV_PER_UNIT,
      }),
      price: price({ priceDate: "2026-08-19" }),
    });
    expect(crypto.currentValue).not.toBeNull();
    expect(crypto.freshness).toBe(MarketValuationFreshness.STALE);
    expect(crypto.quality).toBe(MarketValuationQuality.AUTO_STALE);
    expect(fund.currentValue).not.toBeNull();
    expect(fund.quality).toBe(MarketValuationQuality.AUTO_STALE);
  });

  it("does not stale a Friday stock price over the weekend", () => {
    const result = resolve({
      price: price({ priceDate: "2026-08-21" }),
      now: new Date("2026-08-23T10:00:00.000Z"),
    });
    expect(result.quality).toBe(MarketValuationQuality.AUTO_CURRENT);
  });

  it("falls back to manual valuation when price or FX is unavailable", () => {
    const result = resolve({
      instrument: instrument({ currency: "USD" }),
      price: price({ currency: "USD" }),
      fxRate: null,
      manualValuation: {
        valueVnd: 1_100_000,
        valuationDate: "2026-08-20",
        unitPriceVnd: 110_000,
        source: InvestmentValuationSource.MANUAL,
      },
    });
    expect(result.currentValue).toBe(1_100_000);
    expect(result.source).toBe(MarketValuationSource.MANUAL);
    expect(result.quality).toBe(MarketValuationQuality.MANUAL);
    expect(result.priceType).toBe(MarketPriceType.MANUAL);
  });

  it("preserves manual and unknown states without inventing value", () => {
    const manual = resolve({
      instrument: null,
      price: null,
      manualValuation: {
        valueVnd: 500_000,
        valuationDate: "2026-08-20",
        unitPriceVnd: 50_000,
        source: InvestmentValuationSource.STATEMENT,
      },
    });
    const unknown = resolve({ instrument: null, price: null });
    expect(manual.currentValue).toBe(500_000);
    expect(manual.quality).toBe(MarketValuationQuality.MANUAL);
    expect(unknown.currentValue).toBeNull();
    expect(unknown.estimatedUnrealizedPnl).toBeNull();
    expect(unknown.quality).toBe(MarketValuationQuality.UNKNOWN);
  });

  it("omits P&L percentage for zero or unknown basis", () => {
    expect(
      resolve({ remainingCostBasis: 0 }).estimatedUnrealizedPnlPercent,
    ).toBeNull();
    expect(
      resolve({ remainingCostBasis: null }).estimatedUnrealizedPnl,
    ).toBeNull();
  });
});
