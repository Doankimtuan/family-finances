import {
  INVESTMENT_INPUT_CURRENCY_COINGECKO_IDS,
  INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES,
  INVESTMENT_REPORTING_CURRENCY,
  MarketFxProvider,
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
} from "../market-providers/http";

const COINGECKO_API_BASE_URL = "https://api.coingecko.com/api/v3";

async function fetchRates(pairs: readonly MarketFxPair[]) {
  const supportedPairs = pairs.filter(
    (pair) =>
      pair.quoteCurrency === INVESTMENT_REPORTING_CURRENCY &&
      INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES.includes(
        pair.baseCurrency as (typeof INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES)[number],
      ),
  );
  if (supportedPairs.length === 0) return { rates: [], failures: [] };

  const url = new URL(`${COINGECKO_API_BASE_URL}/simple/price`);
  url.searchParams.set(
    "ids",
    supportedPairs
      .map(
        (pair) =>
          INVESTMENT_INPUT_CURRENCY_COINGECKO_IDS[
            pair.baseCurrency as keyof typeof INVESTMENT_INPUT_CURRENCY_COINGECKO_IDS
          ],
      )
      .join(","),
  );
  url.searchParams.set(
    "vs_currencies",
    INVESTMENT_REPORTING_CURRENCY.toLowerCase(),
  );
  url.searchParams.set("include_last_updated_at", "true");

  try {
    const response = await fetchProviderJson(url.toString());
    const fetchedAt = new Date().toISOString();
    const rates = [];
    const failures = [];
    for (const pair of supportedPairs) {
      const providerId =
        INVESTMENT_INPUT_CURRENCY_COINGECKO_IDS[
          pair.baseCurrency as keyof typeof INVESTMENT_INPUT_CURRENCY_COINGECKO_IDS
        ];
      const row = isRecord(response) ? response[providerId] : null;
      const rate = isRecord(row)
        ? readNumber(row, INVESTMENT_REPORTING_CURRENCY.toLowerCase())
        : null;
      if (rate == null || rate <= 0) {
        failures.push(`${pair.baseCurrency}/${pair.quoteCurrency}`);
        continue;
      }
      rates.push({
        baseCurrency: pair.baseCurrency,
        quoteCurrency: pair.quoteCurrency,
        rate,
        rateDate:
          providerDate(isRecord(row) ? row.last_updated_at : null) ??
          fetchedAt.slice(0, 10),
        fetchedAt,
        provider: MarketFxProvider.COINGECKO,
        updatedAt: fetchedAt,
      });
    }
    return { rates, failures };
  } catch (error) {
    const reason = error instanceof Error ? `: ${error.message}` : "";
    return {
      rates: [],
      failures: supportedPairs.map(
        (pair) => `${pair.baseCurrency}/${pair.quoteCurrency}${reason}`,
      ),
    };
  }
}

export const coingeckoFxAdapter: MarketFxAdapter = {
  provider: MarketFxProvider.COINGECKO,
  fetchRates,
};
