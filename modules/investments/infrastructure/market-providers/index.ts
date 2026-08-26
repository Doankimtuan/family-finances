import type { MarketCatalogAdapter } from "../../application/investment-types";
import { coingeckoAdapter } from "./coingecko";
import { fmarketAdapter } from "./fmarket";
import { vangTodayAdapter } from "./vang-today";
import { vnstockAdapter } from "./vnstock";

export const marketCatalogAdapters: readonly MarketCatalogAdapter[] = [
  coingeckoAdapter,
  vnstockAdapter,
  fmarketAdapter,
  vangTodayAdapter,
];

export { coingeckoAdapter, fmarketAdapter, vangTodayAdapter, vnstockAdapter };
