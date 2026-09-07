"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  InvestmentAssetClass,
  MarketPricingMode,
  MarketPriceType,
  MarketValuationQuality,
  INVESTMENT_REPORTING_CURRENCY,
} from "@/modules/investments/application/investment-constants";
import type { InvestmentHolding } from "@/modules/investments/application/investment-types";
import { formatDate, formatNumber } from "@/shared/i18n/formatters";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";

const CRYPTO_DECIMAL_DIGITS = 8;
const STANDARD_DECIMAL_DIGITS = 2;

/** Rendering depth: badge stack (detail), wrapping line (hero), or compact row. */
export const InvestmentValuationMetaVariant = {
  BADGE: "badge",
  INLINE: "inline",
  ROW: "row",
} as const;

export type InvestmentValuationMetaVariant =
  (typeof InvestmentValuationMetaVariant)[keyof typeof InvestmentValuationMetaVariant];

function dateLabel(value: string, locale: string) {
  return formatDate(new Date(`${value}T00:00:00`), locale, {
    day: "2-digit",
    month: "2-digit",
  });
}

function isToday(value: string) {
  return value === new Date().toISOString().slice(0, 10);
}

type ValuationCopy = ReturnType<
  typeof useTranslations<"money.investments.valuation">
>;

function resolveRowValuationLine({
  quality,
  date,
  isNavMode,
  isPriceToday,
  t,
}: {
  quality: MarketValuationQuality;
  date: string | null;
  isNavMode: boolean;
  isPriceToday: boolean;
  t: ValuationCopy;
}) {
  if (quality === MarketValuationQuality.AUTO_CURRENT) {
    if (isNavMode && date) return t("rowNav", { date });
    if (isPriceToday) return t("rowAutomaticToday");
    if (date) return t("rowAutomatic", { date });
    return t("automatic");
  }
  if (quality === MarketValuationQuality.AUTO_STALE) {
    return date ? t("rowStale", { date }) : t("automatic");
  }
  if (quality === MarketValuationQuality.MANUAL) {
    return date ? t("rowManual", { date }) : t("rowManualUndated");
  }
  return t("unknown");
}

function quoteLabel(
  holding: InvestmentHolding,
  locale: string,
  fundUnit: string,
  navLabel: string,
) {
  const valuation = holding.valuation;
  if (valuation?.price == null || !valuation.priceCurrency) return null;
  const digits =
    holding.assetClass === InvestmentAssetClass.CRYPTO
      ? CRYPTO_DECIMAL_DIGITS
      : STANDARD_DECIMAL_DIGITS;
  const price = formatNumber(valuation.price, locale, {
    maximumFractionDigits: digits,
  });
  const isNav =
    holding.instrument?.pricingMode === MarketPricingMode.NAV_PER_UNIT ||
    valuation.priceType === MarketPriceType.NAV;
  if (isNav)
    return `${navLabel} ${price} ${valuation.priceCurrency} / ${fundUnit}`;
  const symbol = holding.instrument?.symbol ?? holding.symbol;
  return symbol
    ? `${symbol} · ${price} ${valuation.priceCurrency}`
    : `${price} ${valuation.priceCurrency}`;
}

export function InvestmentValuationMeta({
  holding,
  detail = false,
  variant = InvestmentValuationMetaVariant.BADGE,
  onHero = false,
}: {
  holding: InvestmentHolding;
  detail?: boolean;
  variant?: InvestmentValuationMetaVariant;
  /** Inline variant on the hero surface: quiet hero-muted text. */
  onHero?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("money.investments.valuation");
  const tOverview = useTranslations("money.investments.overview");
  const quality = holding.valuation?.quality ?? MarketValuationQuality.UNKNOWN;
  const priceDate = holding.valuation?.priceDate;
  const isNavMode =
    holding.instrument?.pricingMode === MarketPricingMode.NAV_PER_UNIT;
  const fundUnit = tOverview("fundUnit");
  const quote = quoteLabel(holding, locale, fundUnit, t("nav"));

  let statusLabel = t("unknown");
  let statusTone: StatusBadgeTone = StatusBadgeTone.NEUTRAL;
  let dateText: string | null = null;

  if (quality === MarketValuationQuality.AUTO_CURRENT) {
    statusLabel = t("automatic");
    statusTone = StatusBadgeTone.SUCCESS;
    if (priceDate) {
      dateText = isNavMode
        ? t("navOn", { date: dateLabel(priceDate, locale) })
        : isToday(priceDate)
          ? t("updatedToday")
          : t("updatedOn", { date: dateLabel(priceDate, locale) });
    }
  } else if (quality === MarketValuationQuality.AUTO_STALE) {
    statusLabel = t("automatic");
    statusTone = StatusBadgeTone.WARNING;
    dateText = priceDate
      ? t("stale", { date: dateLabel(priceDate, locale) })
      : null;
  } else if (quality === MarketValuationQuality.MANUAL) {
    statusLabel = t("manual");
    statusTone = StatusBadgeTone.INFO;
    dateText = priceDate
      ? t("manualUpdatedOn", { date: dateLabel(priceDate, locale) })
      : t("manualUpdated");
  }

  if (variant === InvestmentValuationMetaVariant.ROW) {
    const line = resolveRowValuationLine({
      quality,
      date: priceDate ? dateLabel(priceDate, locale) : null,
      isNavMode,
      isPriceToday: priceDate != null && isToday(priceDate),
      t,
    });
    return (
      <Text
        size="xs"
        tone={
          quality === MarketValuationQuality.AUTO_STALE ? "secondary" : "muted"
        }
        className="whitespace-nowrap"
        data-testid="investment-valuation-meta"
      >
        {line}
      </Text>
    );
  }

  if (variant === InvestmentValuationMetaVariant.INLINE) {
    // Manual date copy already carries the "manual" context on its own.
    const line =
      dateText == null
        ? statusLabel
        : quality === MarketValuationQuality.MANUAL
          ? dateText
          : `${statusLabel} · ${dateText}`;
    return (
      <Text
        size="xs"
        tone={
          onHero
            ? undefined
            : quality === MarketValuationQuality.AUTO_STALE
              ? "secondary"
              : "muted"
        }
        className={
          onHero
            ? "text-pretty break-words text-hero-muted"
            : "text-pretty break-words"
        }
        data-testid="investment-valuation-meta"
      >
        <FinancialValue>{line}</FinancialValue>
      </Text>
    );
  }

  return (
    <div
      className="flex min-w-0 flex-col gap-(--space-1)"
      data-testid="investment-valuation-meta"
    >
      <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
      {quote ? (
        <Text size="xs" tone="secondary" className="truncate">
          <FinancialValue>{quote}</FinancialValue>
        </Text>
      ) : null}
      {dateText ? (
        <Text
          size="xs"
          tone={
            quality === MarketValuationQuality.AUTO_STALE
              ? "danger"
              : "secondary"
          }
        >
          {dateText}
        </Text>
      ) : null}
      {detail && holding.valuation?.priceCurrency ? (
        <>
          <Text size="xs" tone="secondary">
            {t("sourceQuote")}: {holding.valuation.priceCurrency}
          </Text>
          {holding.valuation.priceCurrency !== INVESTMENT_REPORTING_CURRENCY &&
          holding.valuation.fxRateToVnd != null ? (
            <Text size="xs" tone="secondary">
              {t("inputRate", {
                rate: formatNumber(holding.valuation.fxRateToVnd, locale, {
                  maximumFractionDigits: 8,
                }),
                currency: holding.valuation.priceCurrency,
              })}
            </Text>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
