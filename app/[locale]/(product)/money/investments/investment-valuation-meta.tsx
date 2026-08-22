"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  InvestmentAssetClass,
  MarketPricingMode,
  MarketPriceType,
  MarketValuationQuality,
} from "@/modules/investments/application/investment-constants";
import type { InvestmentHolding } from "@/modules/investments/application/investment-types";
import { formatDate, formatNumber } from "@/shared/i18n/formatters";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";

const CRYPTO_DECIMAL_DIGITS = 8;
const STANDARD_DECIMAL_DIGITS = 2;

function dateLabel(value: string, locale: string) {
  return formatDate(new Date(`${value}T00:00:00`), locale, {
    day: "2-digit",
    month: "2-digit",
  });
}

function isToday(value: string) {
  return value === new Date().toISOString().slice(0, 10);
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
}: {
  holding: InvestmentHolding;
  detail?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("money.investments.valuation");
  const tOverview = useTranslations("money.investments.overview");
  const quality = holding.valuation?.quality ?? MarketValuationQuality.UNKNOWN;
  const priceDate = holding.valuation?.priceDate;
  const fundUnit = tOverview("fundUnit");
  const quote = quoteLabel(holding, locale, fundUnit, t("nav"));

  let statusLabel = t("unknown");
  let statusTone: StatusBadgeTone = StatusBadgeTone.NEUTRAL;
  let dateText: string | null = null;

  if (quality === MarketValuationQuality.AUTO_CURRENT) {
    statusLabel = t("automatic");
    statusTone = StatusBadgeTone.SUCCESS;
    if (!priceDate) {
      dateText = null;
    } else if (
      holding.instrument?.pricingMode === MarketPricingMode.NAV_PER_UNIT
    ) {
      dateText = t("navOn", { date: dateLabel(priceDate, locale) });
    } else if (isToday(priceDate)) {
      dateText = t("updatedToday");
    } else {
      dateText = t("updatedOn", { date: dateLabel(priceDate, locale) });
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
        <Text size="xs" tone="secondary">
          {t("sourceQuote")}: {holding.valuation.priceCurrency}
        </Text>
      ) : null}
    </div>
  );
}
