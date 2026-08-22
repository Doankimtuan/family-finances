import {
  InvestmentAssetClass,
  MarketDataProvider,
  MARKET_PRICE_SYNC_BATCH_SIZE,
  MarketPriceType,
  MarketPricingMode,
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

const FMARKET_FILTER_URL = "https://api.fmarket.vn/res/products/filter";
const FMARKET_PAGE_SIZE = 100;
const FMARKET_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0",
};

function payload(page: number, ids: readonly string[] = []) {
  return {
    types: ["NEW_FUND", "TRADING_FUND"],
    issuerIds: [],
    sortOrder: "DESC",
    sortField: "navTo6Months",
    page,
    pageSize: FMARKET_PAGE_SIZE,
    isIpo: false,
    fundAssetTypes: [],
    bondRemainPeriods: [],
    searchField: "",
    isBuyByReward: false,
    thirdAppIds: [],
    ids,
  };
}

function normalizeFmarket(raw: unknown): MarketCatalogCandidate | null {
  if (!isRecord(raw)) return null;
  const providerId = readNumber(raw, "id");
  const symbol = readString(raw, "shortName", "code");
  const name = readString(raw, "name");
  if (providerId == null || !symbol || !name) return null;
  return {
    assetClass: InvestmentAssetClass.FUND,
    symbol: symbol.toUpperCase(),
    name,
    exchange: null,
    currency: "VND",
    pricingMode: MarketPricingMode.NAV_PER_UNIT,
    autoPriceSupported: true,
    provider: MarketDataProvider.FMARKET,
    providerInstrumentId: String(providerId),
    isActive: readBoolean(raw, "isActive", "is_active") ?? true,
    metadata: providerMetadata({
      fundType: readString(raw, "dataFundAssetType.name"),
      ownerName: readString(raw, "owner.name"),
      providerCode: readString(raw, "code"),
      vsdFeeId: readString(raw, "vsdFeeId"),
    }),
  };
}

async function listInstruments(): Promise<readonly unknown[]> {
  const rows: unknown[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const response = await fetchProviderJson(FMARKET_FILTER_URL, {
      method: "POST",
      headers: FMARKET_HEADERS,
      body: JSON.stringify(payload(page)),
    });
    if (!isRecord(response)) break;
    const data = response.data;
    const pageRows = readRows(data, "rows");
    rows.push(...pageRows);
    const total = isRecord(data) ? readNumber(data, "total") : null;
    if (pageRows.length === 0 || total == null || rows.length >= total) break;
  }
  return rows;
}

async function searchInstruments(query: string): Promise<readonly unknown[]> {
  const normalizedQuery = query.trim().toLowerCase();
  const rows = await listInstruments();
  return rows.filter((row) => {
    if (!isRecord(row)) return false;
    const symbol = readString(row, "shortName", "code")?.toLowerCase();
    const name = readString(row, "name")?.toLowerCase();
    return symbol?.includes(normalizedQuery) || name?.includes(normalizedQuery);
  });
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
    try {
      const response = await fetchProviderJson(FMARKET_FILTER_URL, {
        method: "POST",
        headers: FMARKET_HEADERS,
        body: JSON.stringify(
          payload(
            1,
            chunk.map((target) => target.providerInstrumentId),
          ),
        ),
      });
      const rows = isRecord(response) ? readRows(response.data, "rows") : [];
      for (const target of chunk) {
        const row = rows.find(
          (candidate) =>
            isRecord(candidate) &&
            String(readNumber(candidate, "id")) === target.providerInstrumentId,
        );
        const extra = isRecord(row) && isRecord(row.extra) ? row.extra : null;
        const price = isRecord(row)
          ? (readNumber(extra ?? {}, "currentNAV") ?? readNumber(row, "nav"))
          : null;
        const priceDate = providerDate(
          isRecord(extra) ? extra.lastNAVDate : null,
        );
        if (price == null || price < 0 || priceDate == null) {
          failures.push({
            instrumentId: target.instrumentId,
            error: "Provider returned no valid NAV",
          });
          continue;
        }
        prices.push({
          instrumentId: target.instrumentId,
          price,
          currency: target.currency,
          priceType: MarketPriceType.NAV,
          priceDate,
          fetchedAt,
          provider: MarketDataProvider.FMARKET,
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

export const fmarketAdapter: MarketCatalogAdapter = {
  provider: MarketDataProvider.FMARKET,
  searchInstruments: async (query, assetClass) =>
    assetClass == null || assetClass === InvestmentAssetClass.FUND
      ? searchInstruments(query)
      : [],
  listInstruments: async (assetClass) =>
    assetClass == null || assetClass === InvestmentAssetClass.FUND
      ? listInstruments()
      : [],
  normalizeProviderResult: (raw, assetClass) =>
    assetClass == null || assetClass === InvestmentAssetClass.FUND
      ? normalizeFmarket(raw)
      : null,
  fetchPrices,
};
