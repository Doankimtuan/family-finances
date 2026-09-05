"use server";

import {
  getInvestmentInputCurrencyRate,
  type InvestmentInputCurrencyRate,
} from "@/modules/investments/application";
import type { InvestmentInputCurrency } from "@/modules/investments/application";

export async function getInvestmentInputCurrencyRateAction(
  currency: InvestmentInputCurrency,
): Promise<InvestmentInputCurrencyRate | null> {
  return getInvestmentInputCurrencyRate(currency);
}
