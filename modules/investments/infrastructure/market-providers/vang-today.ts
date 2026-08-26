import {
  InvestmentAssetClass,
  MarketDataProvider,
  MarketPricingMode,
  MarketPriceType,
  VANG_TODAY_MAX_PRICE_AGE_HOURS,
} from "../../application/investment-constants";
import type {
  MarketCatalogAdapter,
  MarketCatalogCandidate,
  MarketPriceFetchResult,
  MarketPriceFetchTarget,
} from "../../application/investment-types";
import {
  fetchProviderJson,
  isRecord,
  providerDate,
  readNumber,
  readString,
} from "./http";

const VANG_TODAY_PRICES_URL = "https://www.vang.today/api/prices";
const VND_CURRENCY = "VND";
const MILLISECONDS_PER_HOUR = 60 * 60 * 1_000;

function priceRows(value: unknown): readonly unknown[] {
  if (!isRecord(value) || !isRecord(value.prices)) return [];
  return Object.entries(value.prices).flatMap(([typeCode, row]) => {
    if (!isRecord(row)) return [];
    return [{ ...row, type_code: typeCode, timestamp: value.timestamp }];
  });
}

function isFresh(timestamp: number | null, now = Date.now()): boolean {
  if (timestamp == null) return false;
  const age = now - timestamp * 1_000;
  return (
    age >= 0 && age <= VANG_TODAY_MAX_PRICE_AGE_HOURS * MILLISECONDS_PER_HOUR
  );
}

function normalizeGold(raw: unknown): MarketCatalogCandidate | null {
  if (!isRecord(raw)) return null;
  const typeCode = readString(raw, "type_code");
  const name = readString(raw, "name");
  const currency = readString(raw, "currency");
  const buy = readNumber(raw, "buy");
  if (
    !typeCode ||
    !name ||
    currency !== VND_CURRENCY ||
    buy == null ||
    buy <= 0
  ) {
    return null;
  }
  return {
    assetClass: InvestmentAssetClass.GOLD,
    symbol: typeCode,
    name,
    exchange: null,
    currency,
    pricingMode: MarketPricingMode.BUYBACK_PRICE,
    autoPriceSupported: true,
    provider: MarketDataProvider.VANG_TODAY,
    providerInstrumentId: typeCode,
    isActive: true,
    metadata: {},
  };
}

async function listInstruments(): Promise<readonly unknown[]> {
  return priceRows(await fetchProviderJson(VANG_TODAY_PRICES_URL)).filter(
    (row): row is Record<string, unknown> =>
      isRecord(row) && readString(row, "currency") === VND_CURRENCY,
  );
}

async function searchInstruments(query: string): Promise<readonly unknown[]> {
  const normalizedQuery = query.trim().toLowerCase();
  return (await listInstruments()).filter((row) => {
    if (!isRecord(row)) return false;
    return [readString(row, "type_code"), readString(row, "name")].some(
      (value) => value?.toLowerCase().includes(normalizedQuery),
    );
  });
}

async function fetchPrices(
  targets: readonly MarketPriceFetchTarget[],
): Promise<MarketPriceFetchResult> {
  const fetchedAt = new Date().toISOString();
  const response = await fetchProviderJson(VANG_TODAY_PRICES_URL);
  const timestamp = isRecord(response)
    ? readNumber(response, "timestamp")
    : null;
  const rows = new Map(
    priceRows(response)
      .filter(isRecord)
      .map((row) => [readString(row, "type_code"), row] as const),
  );
  if (!isFresh(timestamp)) {
    return {
      prices: [],
      failures: targets.map((target) => ({
        instrumentId: target.instrumentId,
        error: "Provider returned stale gold prices",
      })),
    };
  }

  const priceDate = providerDate(timestamp) ?? fetchedAt.slice(0, 10);
  const prices = [];
  const failures = [];
  for (const target of targets) {
    const row = rows.get(target.providerInstrumentId);
    const price = row ? readNumber(row, "buy") : null;
    if (
      !row ||
      readString(row, "currency") !== VND_CURRENCY ||
      price == null ||
      price <= 0
    ) {
      failures.push({
        instrumentId: target.instrumentId,
        error: "Provider returned no valid gold buyback price",
      });
      continue;
    }
    prices.push({
      instrumentId: target.instrumentId,
      price,
      currency: VND_CURRENCY,
      priceType: MarketPriceType.BUYBACK,
      priceDate,
      fetchedAt,
      provider: MarketDataProvider.VANG_TODAY,
      metadata: {},
    });
  }
  return { prices, failures };
}

export const vangTodayAdapter: MarketCatalogAdapter = {
  provider: MarketDataProvider.VANG_TODAY,
  searchInstruments,
  listInstruments,
  normalizeProviderResult: normalizeGold,
  fetchPrices,
};
