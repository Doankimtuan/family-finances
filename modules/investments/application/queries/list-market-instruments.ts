import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  INVESTMENT_ASSET_CLASS_VALUES,
  MARKET_CATALOG_QUERY_ERROR_CODE,
  MARKET_CATALOG_QUERY_LIMIT,
  MARKET_CATALOG_SYNC_OPERATION,
  type InvestmentAssetClass,
} from "../investment-constants";
import type {
  MarketCatalogSearchInput,
  MarketInstrument,
} from "../investment-types";

const SEARCH_QUERY_MAX_LENGTH = 80;
const MARKET_INSTRUMENTS_TABLE = "market_instruments";
const MARKET_INSTRUMENT_SELECT =
  "id, asset_class, symbol, name, exchange, currency, pricing_mode, auto_price_supported, is_active, metadata";

const marketCatalogSearchSchema = z.object({
  query: z.string().trim().max(SEARCH_QUERY_MAX_LENGTH).optional(),
  assetClass: z.enum(INVESTMENT_ASSET_CLASS_VALUES).optional(),
  activeOnly: z.boolean().default(true),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MARKET_CATALOG_QUERY_LIMIT.MAX)
    .default(MARKET_CATALOG_QUERY_LIMIT.DEFAULT),
});

type MarketInstrumentRow = {
  id: string;
  asset_class: InvestmentAssetClass;
  symbol: string;
  name: string;
  exchange: string | null;
  currency: string;
  pricing_mode: MarketInstrument["pricingMode"];
  auto_price_supported: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
};

function escapeLikeQuery(query: string): string {
  return query
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}

function mapInstrument(row: MarketInstrumentRow): MarketInstrument {
  return {
    id: row.id,
    assetClass: row.asset_class,
    symbol: row.symbol,
    name: row.name,
    exchange: row.exchange,
    currency: row.currency,
    pricingMode: row.pricing_mode,
    autoPriceSupported: row.auto_price_supported,
    isActive: row.is_active,
    metadata: row.metadata,
  };
}

function sortInstruments(
  rows: MarketInstrument[],
  query: string,
): MarketInstrument[] {
  const normalizedQuery = query.toLowerCase();
  return rows.sort((left, right) => {
    const leftSymbol = left.symbol.toLowerCase();
    const rightSymbol = right.symbol.toLowerCase();
    const leftExact = leftSymbol === normalizedQuery ? 0 : 1;
    const rightExact = rightSymbol === normalizedQuery ? 0 : 1;
    if (leftExact !== rightExact) return leftExact - rightExact;
    const leftPrefix = leftSymbol.startsWith(normalizedQuery) ? 0 : 1;
    const rightPrefix = rightSymbol.startsWith(normalizedQuery) ? 0 : 1;
    if (leftPrefix !== rightPrefix) return leftPrefix - rightPrefix;
    return (
      leftSymbol.localeCompare(rightSymbol) ||
      left.name.localeCompare(right.name) ||
      left.id.localeCompare(right.id)
    );
  });
}

export type MarketCatalogSearchResult = Result<
  { instruments: MarketInstrument[] },
  (typeof MARKET_CATALOG_QUERY_ERROR_CODE)[keyof typeof MARKET_CATALOG_QUERY_ERROR_CODE]
>;

export async function listMarketInstruments(
  raw: MarketCatalogSearchInput = {},
): Promise<MarketCatalogSearchResult> {
  const parsed = marketCatalogSearchSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: MARKET_CATALOG_QUERY_ERROR_CODE.INVALID };
  const input = parsed.data;
  try {
    const supabase = await createSupabaseServerClient();
    const escapedQuery = input.query ? escapeLikeQuery(input.query) : "";
    const createQuery = (column?: "symbol" | "name") => {
      const query = supabase
        .from(MARKET_INSTRUMENTS_TABLE)
        .select(MARKET_INSTRUMENT_SELECT);
      if (input.assetClass) query.eq("asset_class", input.assetClass);
      if (input.activeOnly) query.eq("is_active", true);
      if (column) query.ilike(column, `%${escapedQuery}%`);
      return query.limit(input.limit);
    };
    const queries = input.query
      ? [createQuery("symbol"), createQuery("name")]
      : [createQuery()];
    const responses = await Promise.all(queries);
    const error = responses.find((response) => response.error)?.error;
    if (error) {
      logActionFailure({
        operation: MARKET_CATALOG_SYNC_OPERATION.SEARCH,
        error,
        context: { assetClass: input.assetClass, query: input.query ?? "" },
      });
      return { ok: false, code: MARKET_CATALOG_QUERY_ERROR_CODE.READ_FAILED };
    }
    const rows = new Map<string, MarketInstrument>();
    for (const response of responses) {
      for (const row of (response.data ?? []) as MarketInstrumentRow[]) {
        rows.set(row.id, mapInstrument(row));
      }
    }
    const instruments = sortInstruments(
      [...rows.values()],
      input.query ?? "",
    ).slice(0, input.limit);
    return { ok: true, instruments };
  } catch (error) {
    logActionFailure({
      operation: MARKET_CATALOG_SYNC_OPERATION.SEARCH,
      error,
      context: { assetClass: input.assetClass, query: input.query ?? "" },
    });
    return { ok: false, code: MARKET_CATALOG_QUERY_ERROR_CODE.READ_FAILED };
  }
}
