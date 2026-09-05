import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import {
  INVESTMENT_REPORTING_CURRENCY,
  INVESTMENT_OPERATION,
  MARKET_FX_TABLE,
  InvestmentInputCurrency,
  InvestmentInputRateSource,
  InvestmentInputRateStatus,
  type InvestmentInputCurrency as InvestmentInputCurrencyValue,
} from "../investment-constants";
import {
  identityInvestmentInputCurrencyRate,
  isInvestmentInputRateFresh,
  type InvestmentInputCurrencyRate,
} from "../investment-money";

type CurrencyRateRow = {
  base_currency: string;
  quote_currency: string;
  rate: string | number;
  rate_date: string;
  fetched_at: string;
  provider: string;
};

export async function getInvestmentInputCurrencyRate(
  currency: InvestmentInputCurrencyValue,
): Promise<InvestmentInputCurrencyRate | null> {
  if (currency === InvestmentInputCurrency.VND) {
    return identityInvestmentInputCurrencyRate();
  }

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(MARKET_FX_TABLE)
      .select(
        "base_currency, quote_currency, rate, rate_date, fetched_at, provider",
      )
      .eq("base_currency", currency)
      .eq("quote_currency", INVESTMENT_REPORTING_CURRENCY)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      logActionFailure({
        operation: INVESTMENT_OPERATION.INPUT_CURRENCY_RATE,
        error,
        context: { householdId: gate.householdId, currency },
      });
      return null;
    }
    if (!data) return null;
    const row = data as CurrencyRateRow;
    const rate: InvestmentInputCurrencyRate = {
      currency,
      rateToVnd: Number(row.rate),
      rateDate: row.rate_date,
      fetchedAt: row.fetched_at,
      provider: row.provider,
      source: InvestmentInputRateSource.AUTOMATIC,
      status: isInvestmentInputRateFresh(row.fetched_at)
        ? InvestmentInputRateStatus.CURRENT
        : InvestmentInputRateStatus.STALE,
    };
    return rate.rateToVnd > 0 && Number.isFinite(rate.rateToVnd) ? rate : null;
  } catch (error) {
    logActionFailure({
      operation: INVESTMENT_OPERATION.INPUT_CURRENCY_RATE,
      error,
      context: { householdId: gate.householdId, currency },
    });
    return null;
  }
}
