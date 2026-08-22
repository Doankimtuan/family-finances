import {
  InvestmentAssetClass,
  MarketDataProvider,
  MarketPricingMode,
  MARKET_CATALOG_CRYPTO_LIMIT,
  MARKET_PRICE_SYNC_BATCH_SIZE,
  MarketPriceType,
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
  providerMetadata,
  readBoolean,
  readNumber,
  readString,
  readRows,
  providerDate,
} from "./http";

const COINGECKO_API_BASE_URL = "https://api.coingecko.com/api/v3";
const COINGECKO_PAGE_SIZE = 250;

function isCrypto(assetClass?: InvestmentAssetClass): boolean {
  return assetClass == null || assetClass === InvestmentAssetClass.CRYPTO;
}

function normalizeCoin(raw: unknown): MarketCatalogCandidate | null {
  if (!isRecord(raw)) return null;
  const providerInstrumentId = readString(raw, "id");
  const symbol = readString(raw, "symbol");
  const name = readString(raw, "name");
  if (!providerInstrumentId || !symbol || !name) return null;
  const active = readBoolean(raw, "is_active") ?? true;
  const marketCapRank = readNumber(raw, "market_cap_rank");
  return {
    assetClass: InvestmentAssetClass.CRYPTO,
    symbol: symbol.toUpperCase(),
    name,
    exchange: null,
    currency: "USD",
    pricingMode: MarketPricingMode.UNIT_PRICE,
    autoPriceSupported: true,
    provider: MarketDataProvider.COINGECKO,
    providerInstrumentId,
    isActive: active,
    metadata: providerMetadata({ marketCapRank }),
  };
}

async function listInstruments(): Promise<readonly unknown[]> {
  const pages = Math.ceil(MARKET_CATALOG_CRYPTO_LIMIT / COINGECKO_PAGE_SIZE);
  const results: unknown[] = [];
  for (let page = 1; page <= pages; page += 1) {
    const url = new URL(`${COINGECKO_API_BASE_URL}/coins/markets`);
    url.searchParams.set("vs_currency", "usd");
    url.searchParams.set("order", "market_cap_desc");
    url.searchParams.set("per_page", String(COINGECKO_PAGE_SIZE));
    url.searchParams.set("page", String(page));
    url.searchParams.set("sparkline", "false");
    results.push(...readRows(await fetchProviderJson(url.toString())));
  }
  return results.slice(0, MARKET_CATALOG_CRYPTO_LIMIT);
}

async function searchInstruments(query: string): Promise<readonly unknown[]> {
  const url = new URL(`${COINGECKO_API_BASE_URL}/search`);
  url.searchParams.set("query", query);
  const response = await fetchProviderJson(url.toString());
  if (!isRecord(response)) return [];
  return readRows(response, "coins");
}

async function fetchPrices(
  targets: readonly MarketPriceFetchTarget[],
): Promise<MarketPriceFetchResult> {
  const fetchedAt = new Date().toISOString();
  const prices = [];
  const failures = [];
  for (
    let offset = 0;
    offset < targets.length;
    offset += MARKET_PRICE_SYNC_BATCH_SIZE
  ) {
    const chunk = targets.slice(offset, offset + MARKET_PRICE_SYNC_BATCH_SIZE);
    const url = new URL(`${COINGECKO_API_BASE_URL}/simple/price`);
    url.searchParams.set(
      "ids",
      chunk.map((target) => target.providerInstrumentId).join(","),
    );
    url.searchParams.set("vs_currencies", "usd");
    url.searchParams.set("include_last_updated_at", "true");
    try {
      const response = await fetchProviderJson(url.toString());
      for (const target of chunk) {
        const row = isRecord(response)
          ? response[target.providerInstrumentId]
          : null;
        const price = isRecord(row) ? readNumber(row, "usd") : null;
        if (price == null || price < 0) {
          failures.push({
            instrumentId: target.instrumentId,
            error: "Provider returned no valid price",
          });
          continue;
        }
        prices.push({
          instrumentId: target.instrumentId,
          price,
          currency: target.currency,
          priceType: MarketPriceType.LAST,
          priceDate:
            providerDate(isRecord(row) ? row.last_updated_at : null) ??
            fetchedAt.slice(0, 10),
          fetchedAt,
          provider: MarketDataProvider.COINGECKO,
          metadata: {},
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Provider request failed";
      failures.push(
        ...chunk.map((target) => ({
          instrumentId: target.instrumentId,
          error: message,
        })),
      );
    }
  }
  return { prices, failures };
}

export const coingeckoAdapter: MarketCatalogAdapter = {
  provider: MarketDataProvider.COINGECKO,
  searchInstruments: async (query, assetClass) =>
    isCrypto(assetClass) ? searchInstruments(query) : [],
  listInstruments: async (assetClass) =>
    isCrypto(assetClass) ? listInstruments() : [],
  normalizeProviderResult: (raw, assetClass) =>
    isCrypto(assetClass) ? normalizeCoin(raw) : null,
  fetchPrices,
};
