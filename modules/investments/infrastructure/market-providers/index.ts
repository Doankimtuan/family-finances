import type { MarketCatalogAdapter } from "../../application/investment-types";
import { coingeckoAdapter } from "./coingecko";
import { fmarketAdapter } from "./fmarket";
import { vnstockAdapter } from "./vnstock";

export const marketCatalogAdapters: readonly MarketCatalogAdapter[] = [
  coingeckoAdapter,
  vnstockAdapter,
  fmarketAdapter,
];

export { coingeckoAdapter, fmarketAdapter, vnstockAdapter };
