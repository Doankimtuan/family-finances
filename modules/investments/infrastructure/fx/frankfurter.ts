import {
  MarketFxProvider,
  MARKET_FX_PROVIDER_URL,
} from "../../application/investment-constants";
import type {
  MarketFxAdapter,
  MarketFxPair,
} from "../../application/investment-types";
import {
  fetchProviderJson,
  isRecord,
  providerDate,
  readNumber,
  readString,
} from "../market-providers/http";

async function fetchRates(pairs: readonly MarketFxPair[]) {
  const rates = [];
  const failures = [];
  for (const pair of pairs) {
    try {
      const response = await fetchProviderJson(
        `${MARKET_FX_PROVIDER_URL}/${pair.baseCurrency}/${pair.quoteCurrency}`,
      );
      const row = isRecord(response) ? response : {};
      const rate = readNumber(row, "rate");
      const rateDate = providerDate(readString(row, "date"));
      if (rate == null || rate <= 0 || rateDate == null) {
        failures.push(`${pair.baseCurrency}/${pair.quoteCurrency}`);
        continue;
      }
      const fetchedAt = new Date().toISOString();
      rates.push({
        baseCurrency: pair.baseCurrency,
        quoteCurrency: pair.quoteCurrency,
        rate,
        rateDate,
        fetchedAt,
        provider: MarketFxProvider.FRANKFURTER,
        updatedAt: fetchedAt,
      });
    } catch (error) {
      failures.push(
        `${pair.baseCurrency}/${pair.quoteCurrency}: ${error instanceof Error ? error.message : "Provider request failed"}`,
      );
    }
  }
  return { rates, failures };
}

export const frankfurterAdapter: MarketFxAdapter = {
  provider: MarketFxProvider.FRANKFURTER,
  fetchRates,
};
