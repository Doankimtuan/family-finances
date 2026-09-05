import {
  INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES,
  INVESTMENT_INPUT_RATE_SOURCE_VALUES,
  INVESTMENT_MONEY_PRICE_DECIMAL_PLACES,
  INVESTMENT_REPORTING_CURRENCY,
  InvestmentInputCurrency,
  InvestmentInputRateSource,
  InvestmentInputRateStatus,
  MARKET_FX_STALE_AFTER_HOURS,
  type InvestmentInputRateStatus as InvestmentInputRateStatusValue,
  type InvestmentInputCurrency as InvestmentInputCurrencyValue,
  type InvestmentInputRateSource as InvestmentInputRateSourceValue,
} from "./investment-constants";

export type InvestmentInputCurrencyRate = {
  currency: InvestmentInputCurrencyValue;
  rateToVnd: number;
  rateDate: string | null;
  fetchedAt: string | null;
  provider: string;
  source: InvestmentInputRateSourceValue;
  status: InvestmentInputRateStatusValue;
};

const PRICE_SCALE = 10 ** INVESTMENT_MONEY_PRICE_DECIMAL_PLACES;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1_000;

export function isInvestmentInputCurrency(
  value: string,
): value is InvestmentInputCurrencyValue {
  return (
    value === InvestmentInputCurrency.VND ||
    INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES.includes(
      value as (typeof INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES)[number],
    )
  );
}

export function isInvestmentInputRateSource(
  value: string,
): value is InvestmentInputRateSourceValue {
  return INVESTMENT_INPUT_RATE_SOURCE_VALUES.includes(
    value as InvestmentInputRateSourceValue,
  );
}

export function isInvestmentInputRateFresh(
  fetchedAt: string | null,
  now = new Date(),
): boolean {
  if (!fetchedAt) return false;
  const timestamp = new Date(fetchedAt).getTime();
  return (
    Number.isFinite(timestamp) &&
    now.getTime() - timestamp <=
      MARKET_FX_STALE_AFTER_HOURS * MILLISECONDS_PER_HOUR
  );
}

export function identityInvestmentInputCurrencyRate(): InvestmentInputCurrencyRate {
  return {
    currency: InvestmentInputCurrency.VND,
    rateToVnd: 1,
    rateDate: null,
    fetchedAt: null,
    provider: InvestmentInputRateSource.IDENTITY,
    source: InvestmentInputRateSource.IDENTITY,
    status: InvestmentInputRateStatus.CURRENT,
  };
}

export function convertInvestmentInputValueToVnd(
  value: number | null | undefined,
  rateToVnd: number,
): number | null {
  if (
    value == null ||
    !Number.isFinite(value) ||
    value < 0 ||
    !Number.isFinite(rateToVnd) ||
    rateToVnd <= 0
  ) {
    return null;
  }
  const converted = Math.round(value * rateToVnd);
  return Number.isSafeInteger(converted) ? converted : null;
}

export function convertInvestmentInputUnitPriceToVnd(
  value: number | null | undefined,
  rateToVnd: number,
): number | null {
  if (
    value == null ||
    !Number.isFinite(value) ||
    value < 0 ||
    !Number.isFinite(rateToVnd) ||
    rateToVnd <= 0
  ) {
    return null;
  }
  const converted = Math.round(value * rateToVnd * PRICE_SCALE) / PRICE_SCALE;
  return Number.isFinite(converted) ? converted : null;
}

export function multiplyInvestmentInputQuantityByUnitPrice(
  quantity: string,
  unitPrice: number | null | undefined,
): number | null {
  const numericQuantity = Number(quantity);
  if (
    !Number.isFinite(numericQuantity) ||
    numericQuantity < 0 ||
    unitPrice == null ||
    !Number.isFinite(unitPrice) ||
    unitPrice < 0
  ) {
    return null;
  }
  const scaled = Math.round(numericQuantity * unitPrice * PRICE_SCALE);
  const result = scaled / PRICE_SCALE;
  return Number.isFinite(result) ? result : null;
}

export function inputCurrencyUsesMarketRate(
  currency: InvestmentInputCurrencyValue,
): boolean {
  return currency !== INVESTMENT_REPORTING_CURRENCY;
}
