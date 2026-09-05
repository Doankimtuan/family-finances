import { createSupabaseAdminClient } from "@/modules/platform/supabase/admin";
import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import {
  INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES,
  INVESTMENT_REPORTING_CURRENCY,
  MARKET_FX_BASE_CURRENCY,
  MARKET_FX_OPERATION,
  MARKET_FX_QUOTE_CURRENCY,
  MARKET_FX_TABLE,
} from "../investment-constants";
import type { MarketFxPair } from "../investment-types";
import {
  coingeckoFxAdapter,
  frankfurterAdapter,
} from "../../infrastructure/fx";

const USD_TO_VND_PAIR: MarketFxPair = {
  baseCurrency: MARKET_FX_BASE_CURRENCY,
  quoteCurrency: MARKET_FX_QUOTE_CURRENCY,
};

const STABLECOIN_TO_VND_PAIRS: readonly MarketFxPair[] =
  INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES.map((currency) => ({
    baseCurrency: currency,
    quoteCurrency: INVESTMENT_REPORTING_CURRENCY,
  }));

export async function syncMarketFxRates(
  currencies: readonly string[],
): Promise<boolean> {
  const requested = new Set(currencies);
  if (
    ![...requested].some(
      (currency) => currency !== INVESTMENT_REPORTING_CURRENCY,
    )
  )
    return true;

  const pairs = [
    ...(requested.has(MARKET_FX_BASE_CURRENCY) ? [USD_TO_VND_PAIR] : []),
    ...STABLECOIN_TO_VND_PAIRS.filter((pair) =>
      requested.has(pair.baseCurrency),
    ),
  ];
  if (pairs.length === 0) return true;

  const [fiatResult, stablecoinResult] = await Promise.all([
    pairs.some((pair) => pair.baseCurrency === MARKET_FX_BASE_CURRENCY)
      ? frankfurterAdapter.fetchRates([USD_TO_VND_PAIR])
      : Promise.resolve({ rates: [], failures: [] }),
    pairs.some((pair) =>
      INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES.includes(
        pair.baseCurrency as (typeof INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES)[number],
      ),
    )
      ? coingeckoFxAdapter.fetchRates(STABLECOIN_TO_VND_PAIRS)
      : Promise.resolve({ rates: [], failures: [] }),
  ]);
  const rates = [...fiatResult.rates, ...stablecoinResult.rates];
  if (rates.length === 0) return false;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from(MARKET_FX_TABLE).upsert(
    rates.map((rate) => ({
      base_currency: rate.baseCurrency,
      quote_currency: rate.quoteCurrency,
      rate: rate.rate,
      rate_date: rate.rateDate,
      fetched_at: rate.fetchedAt,
      provider: rate.provider,
      updated_at: rate.updatedAt,
    })),
    { onConflict: "base_currency,quote_currency" },
  );
  if (error) {
    logActionFailure({
      operation: MARKET_FX_OPERATION.SYNC,
      error,
      context: {
        pair: pairs
          .map((pair) => `${pair.baseCurrency}/${pair.quoteCurrency}`)
          .join(","),
      },
    });
    return false;
  }
  return true;
}
