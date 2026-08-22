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

const VNSTOCK_LIST_URL =
  "https://kbbuddywts.kbsec.com.vn/iis-server/investment/stock/search/data";
const VNSTOCK_HEADERS = {
  Accept: "application/json",
  Origin: "https://vnstocks.com",
  Referer: "https://vnstocks.com/",
  "User-Agent": "Mozilla/5.0",
};

type VnstockKind = "stock" | "fund" | "bond" | "corpbond";

function kindOf(raw: Record<string, unknown>): VnstockKind | null {
  const value = readString(raw, "type")?.toLowerCase();
  return value === "stock" ||
    value === "fund" ||
    value === "bond" ||
    value === "corpbond"
    ? value
    : null;
}

function assetClassOf(kind: VnstockKind): InvestmentAssetClass {
  if (kind === "stock") return InvestmentAssetClass.STOCK;
  if (kind === "fund") return InvestmentAssetClass.FUND;
  return InvestmentAssetClass.BOND;
}

function normalizeVnstock(raw: unknown): MarketCatalogCandidate | null {
  if (!isRecord(raw)) return null;
  const kind = kindOf(raw);
  const symbol = readString(raw, "symbol");
  if (!kind || !symbol) return null;
  const assetClass = assetClassOf(kind);
  const name = readString(raw, "name", "nameEn") ?? symbol;
  const isActive = readBoolean(raw, "isActive", "is_active") ?? true;
  const isBond = assetClass === InvestmentAssetClass.BOND;
  return {
    assetClass,
    symbol: symbol.toUpperCase(),
    name,
    exchange: readString(raw, "exchange"),
    currency: "VND",
    pricingMode: isBond
      ? MarketPricingMode.TOTAL_VALUE
      : MarketPricingMode.UNIT_PRICE,
    autoPriceSupported: !isBond,
    provider: MarketDataProvider.VNSTOCK,
    providerInstrumentId: symbol.toUpperCase(),
    isActive,
    metadata: providerMetadata({
      providerInstrumentType: kind,
      englishName: readString(raw, "nameEn"),
      providerIndex: raw.index,
    }),
  };
}

async function listInstruments(): Promise<readonly unknown[]> {
  return readRows(
    await fetchProviderJson(VNSTOCK_LIST_URL, { headers: VNSTOCK_HEADERS }),
  );
}

async function searchInstruments(query: string): Promise<readonly unknown[]> {
  const normalizedQuery = query.trim().toLowerCase();
  const rows = await listInstruments();
  return rows.filter((row) => {
    if (!isRecord(row)) return false;
    const values = [
      readString(row, "symbol"),
      readString(row, "name", "nameEn"),
    ];
    return values.some((value) =>
      value?.toLowerCase().includes(normalizedQuery),
    );
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
      const response = await fetchProviderJson(
        "https://kbbuddywts.kbsec.com.vn/iis-server/investment/stock/iss",
        {
          method: "POST",
          headers: { ...VNSTOCK_HEADERS, "Content-Type": "application/json" },
          body: JSON.stringify({
            code: chunk.map((target) => target.providerInstrumentId).join(","),
          }),
        },
      );
      const rows = readRows(response);
      for (const target of chunk) {
        const row = rows.find((candidate) => {
          if (!isRecord(candidate)) return false;
          return (
            readString(candidate, "SB", "symbol")?.toUpperCase() ===
            target.providerInstrumentId.toUpperCase()
          );
        });
        const price = isRecord(row)
          ? readNumber(row, "CP", "close_price")
          : null;
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
          priceType:
            target.pricingMode === MarketPricingMode.NAV_PER_UNIT
              ? MarketPriceType.NAV
              : MarketPriceType.LAST,
          priceDate:
            providerDate(
              isRecord(row) ? (row.t ?? row.TD ?? row.time) : null,
            ) ?? fetchedAt.slice(0, 10),
          fetchedAt,
          provider: MarketDataProvider.VNSTOCK,
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

export const vnstockAdapter: MarketCatalogAdapter = {
  provider: MarketDataProvider.VNSTOCK,
  searchInstruments: async (query, assetClass) =>
    (await searchInstruments(query)).filter((raw) => {
      const candidate = normalizeVnstock(raw);
      return (
        candidate != null &&
        (assetClass == null || candidate.assetClass === assetClass)
      );
    }),
  listInstruments: async (assetClass) =>
    (await listInstruments()).filter((raw) => {
      const candidate = normalizeVnstock(raw);
      return (
        candidate != null &&
        (assetClass == null || candidate.assetClass === assetClass)
      );
    }),
  normalizeProviderResult: (raw, assetClass) => {
    const candidate = normalizeVnstock(raw);
    return candidate != null &&
      (assetClass == null || candidate.assetClass === assetClass)
      ? candidate
      : null;
  },
  fetchPrices,
};
