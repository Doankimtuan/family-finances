import { createSupabaseAdminClient } from "@/modules/platform/supabase/admin";
import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import {
  INVESTMENT_REPORTING_CURRENCY,
  MARKET_FX_BASE_CURRENCY,
  MARKET_FX_OPERATION,
  MARKET_FX_PAIR_LABEL,
  MARKET_FX_QUOTE_CURRENCY,
  MARKET_FX_TABLE,
} from "../investment-constants";
import type { MarketFxPair } from "../investment-types";
import { frankfurterAdapter } from "../../infrastructure/fx";

const USD_TO_VND_PAIR: MarketFxPair = {
  baseCurrency: MARKET_FX_BASE_CURRENCY,
  quoteCurrency: MARKET_FX_QUOTE_CURRENCY,
};

export async function syncMarketFxRates(
  currencies: readonly string[],
): Promise<boolean> {
  if (
    currencies.some((currency) => currency !== INVESTMENT_REPORTING_CURRENCY)
  ) {
    const result = await frankfurterAdapter.fetchRates([USD_TO_VND_PAIR]);
    const rate = result.rates[0];
    if (!rate) return false;
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from(MARKET_FX_TABLE).upsert(
      {
        base_currency: rate.baseCurrency,
        quote_currency: rate.quoteCurrency,
        rate: rate.rate,
        rate_date: rate.rateDate,
        fetched_at: rate.fetchedAt,
        provider: rate.provider,
        updated_at: rate.updatedAt,
      },
      { onConflict: "base_currency,quote_currency" },
    );
    if (error) {
      logActionFailure({
        operation: MARKET_FX_OPERATION.SYNC,
        error,
        context: { pair: MARKET_FX_PAIR_LABEL },
      });
      return false;
    }
    return true;
  }
  return true;
}
