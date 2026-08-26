import {
  InvestmentAssetClass,
  INVESTMENT_REPORTING_CURRENCY,
  MarketDataProvider,
  MarketPricingMode,
  MarketPriceType,
  MarketValuationFreshness,
  MarketValuationQuality,
  MarketValuationSource,
  MARKET_FX_STALE_AFTER_HOURS,
} from "./investment-constants";
import { deriveUnrealizedResult } from "./investment-accounting";
import type {
  InvestmentValuationResolution,
  MarketCurrencyRate,
  MarketInstrument,
  MarketInstrumentPrice,
} from "./investment-types";

export type ManualValuationForResolution = {
  valueVnd: number;
  valuationDate: string;
  unitPriceVnd: number | null;
  source: string;
};

export type ResolveInvestmentValuationInput = {
  assetClass: InvestmentAssetClass;
  quantity: string;
  remainingCostBasis: number | null;
  instrument: MarketInstrument | null;
  price: MarketInstrumentPrice | null;
  fxRate: MarketCurrencyRate | null;
  manualValuation: ManualValuationForResolution | null;
  now?: Date;
};

const HOURS_PER_DAY = 24;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1_000;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1_000;
const WEEKEND_START = 0;
const WEEKEND_END = 6;
const MAX_EXPECTED_PUBLICATION_GAP = 1;

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function validNumber(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

function isFreshWithinHours(
  timestamp: string,
  now: Date,
  hours: number,
): boolean {
  const fetchedAt = new Date(timestamp).getTime();
  return (
    Number.isFinite(fetchedAt) &&
    now.getTime() - fetchedAt <= hours * MILLISECONDS_PER_HOUR
  );
}

function expectedPublicationDaysSince(
  priceDate: string,
  today: string,
): number {
  const start = new Date(`${priceDate}T00:00:00.000Z`);
  const end = new Date(`${today}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  let days = 0;
  for (
    let cursor = new Date(start.getTime() + MILLISECONDS_PER_DAY);
    cursor <= end;
    cursor = new Date(cursor.getTime() + MILLISECONDS_PER_DAY)
  ) {
    const weekday = cursor.getUTCDay();
    if (weekday > WEEKEND_START && weekday < WEEKEND_END) days += 1;
  }
  return days;
}

function isMarketPriceStale(
  input: ResolveInvestmentValuationInput,
  now: Date,
): boolean {
  if (!input.price) return false;
  if (input.assetClass === InvestmentAssetClass.CRYPTO) {
    return !isFreshWithinHours(input.price.fetchedAt, now, HOURS_PER_DAY);
  }
  if (input.assetClass === InvestmentAssetClass.GOLD) {
    return !isFreshWithinHours(input.price.fetchedAt, now, HOURS_PER_DAY);
  }
  if (
    input.assetClass === InvestmentAssetClass.STOCK ||
    input.assetClass === InvestmentAssetClass.FUND
  ) {
    return (
      expectedPublicationDaysSince(input.price.priceDate, dateOnly(now)) >
      MAX_EXPECTED_PUBLICATION_GAP
    );
  }
  return false;
}

function isFxStale(rate: MarketCurrencyRate | null, now: Date): boolean {
  return rate == null
    ? false
    : !isFreshWithinHours(rate.fetchedAt, now, MARKET_FX_STALE_AFTER_HOURS);
}

function resolveFxRate(
  price: MarketInstrumentPrice,
  rate: MarketCurrencyRate | null,
): number | null {
  if (price.currency === INVESTMENT_REPORTING_CURRENCY) return 1;
  if (
    rate?.baseCurrency !== price.currency ||
    rate.quoteCurrency !== INVESTMENT_REPORTING_CURRENCY ||
    !validNumber(rate.rate) ||
    rate.rate <= 0
  ) {
    return null;
  }
  return rate.rate;
}

function calculatePnl(
  currentValue: number | null,
  remainingCostBasis: number | null,
): Pick<
  InvestmentValuationResolution,
  "estimatedUnrealizedPnl" | "estimatedUnrealizedPnlPercent"
> {
  const pnl = deriveUnrealizedResult(currentValue, remainingCostBasis);
  return {
    estimatedUnrealizedPnl: pnl,
    estimatedUnrealizedPnlPercent:
      pnl != null && remainingCostBasis != null && remainingCostBasis !== 0
        ? pnl / remainingCostBasis
        : null,
  };
}

function manualResolution(
  input: ResolveInvestmentValuationInput,
): InvestmentValuationResolution {
  const manual = input.manualValuation;
  const currentValue = manual?.valueVnd ?? null;
  return {
    currentValue,
    ...calculatePnl(currentValue, input.remainingCostBasis),
    price: manual?.unitPriceVnd ?? manual?.valueVnd ?? null,
    priceCurrency: manual ? INVESTMENT_REPORTING_CURRENCY : null,
    unitPriceVnd: manual?.unitPriceVnd ?? null,
    fxRateToVnd: null,
    priceType: manual ? MarketPriceType.MANUAL : null,
    priceDate: manual?.valuationDate ?? null,
    fetchedAt: null,
    provider: manual ? MarketDataProvider.MANUAL : null,
    source: MarketValuationSource.MANUAL,
    freshness: MarketValuationFreshness.UNKNOWN,
    quality: manual
      ? MarketValuationQuality.MANUAL
      : MarketValuationQuality.UNKNOWN,
  };
}

export function resolveInvestmentValuation(
  input: ResolveInvestmentValuationInput,
): InvestmentValuationResolution {
  const now = input.now ?? new Date();
  const instrument = input.instrument;
  const price = input.price;
  if (
    !instrument ||
    !instrument.isActive ||
    !instrument.autoPriceSupported ||
    instrument.pricingMode === MarketPricingMode.MANUAL ||
    !price ||
    price.instrumentId !== instrument.id ||
    !validNumber(price.price) ||
    price.price < 0
  ) {
    return manualResolution(input);
  }

  const fxRateToVnd = resolveFxRate(price, input.fxRate);
  if (fxRateToVnd == null) return manualResolution(input);

  const isTotalValue = instrument.pricingMode === MarketPricingMode.TOTAL_VALUE;
  const quantity = Number(input.quantity);
  if (!isTotalValue && !Number.isFinite(quantity))
    return manualResolution(input);
  const currentValue = isTotalValue
    ? Math.round(price.price * fxRateToVnd)
    : Math.round(quantity * price.price * fxRateToVnd);
  const marketStale = isMarketPriceStale(input, now);
  const fxStale =
    price.currency !== INVESTMENT_REPORTING_CURRENCY &&
    isFxStale(input.fxRate, now);
  const stale = marketStale || fxStale;
  return {
    currentValue,
    ...calculatePnl(currentValue, input.remainingCostBasis),
    price: price.price,
    priceCurrency: price.currency,
    unitPriceVnd: isTotalValue ? null : price.price * fxRateToVnd,
    fxRateToVnd,
    priceType: price.priceType,
    priceDate: price.priceDate,
    fetchedAt: price.fetchedAt,
    provider: price.provider,
    source: MarketValuationSource.AUTOMATIC,
    freshness: stale
      ? MarketValuationFreshness.STALE
      : MarketValuationFreshness.CURRENT,
    quality: stale
      ? MarketValuationQuality.AUTO_STALE
      : MarketValuationQuality.AUTO_CURRENT,
  };
}
