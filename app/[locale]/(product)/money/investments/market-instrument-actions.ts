"use server";

import {
  listMarketInstruments,
  type MarketCatalogSearchResult,
} from "@/modules/investments/application/queries/list-market-instruments";
import type { MarketCatalogSearchInput } from "@/modules/investments/application/investment-types";

export async function listMarketInstrumentsAction(
  input: MarketCatalogSearchInput,
): Promise<MarketCatalogSearchResult> {
  return listMarketInstruments({ ...input, activeOnly: true });
}
