import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en/money.json";
import viMessages from "@/messages/vi/money.json";
import {
  InvestmentAssetClass,
  InvestmentHistoryStatus,
  InvestmentLifecycleStatus,
  MarketDataProvider,
  MarketPriceType,
  MarketPricingMode,
  MarketValuationFreshness,
  MarketValuationQuality,
  MarketValuationSource,
} from "@/modules/investments/application/investment-constants";
import type {
  InvestmentHolding,
  MarketInstrument,
} from "@/modules/investments/application/investment-types";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import {
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";
import { InvestmentValuationMeta } from "@/app/[locale]/(product)/money/investments/investment-valuation-meta";

const instrument: MarketInstrument = {
  id: "instrument-1",
  assetClass: InvestmentAssetClass.STOCK,
  symbol: "FPT",
  name: "FPT Corporation",
  exchange: "HOSE",
  currency: "VND",
  pricingMode: MarketPricingMode.UNIT_PRICE,
  autoPriceSupported: true,
  isActive: true,
  metadata: {},
};

const holding = (quality: MarketValuationQuality): InvestmentHolding => ({
  id: "holding-1",
  householdId: "household-1",
  name: "FPT dài hạn",
  symbol: null,
  instrumentId: instrument.id,
  instrument,
  assetClass: InvestmentAssetClass.STOCK,
  providerCustodian: "SSI",
  visibilityContext: "household",
  lifecycleStatus: InvestmentLifecycleStatus.ACTIVE,
  historyStatus: InvestmentHistoryStatus.FULL,
  quantity: "10",
  remainingTotalCostBasis: 1_000_000,
  currentValue: quality === MarketValuationQuality.UNKNOWN ? null : 1_200_000,
  currentValuationDate:
    quality === MarketValuationQuality.UNKNOWN ? null : "2026-08-22",
  currentValuationSource:
    quality === MarketValuationQuality.MANUAL ? "manual" : "provider",
  unrealizedResult: quality === MarketValuationQuality.UNKNOWN ? null : 200_000,
  valuation: {
    currentValue: quality === MarketValuationQuality.UNKNOWN ? null : 1_200_000,
    estimatedUnrealizedPnl:
      quality === MarketValuationQuality.UNKNOWN ? null : 200_000,
    estimatedUnrealizedPnlPercent:
      quality === MarketValuationQuality.UNKNOWN ? null : 0.2,
    price: quality === MarketValuationQuality.UNKNOWN ? null : 120_000,
    priceCurrency: quality === MarketValuationQuality.UNKNOWN ? null : "VND",
    unitPriceVnd: quality === MarketValuationQuality.UNKNOWN ? null : 120_000,
    fxRateToVnd: null,
    priceType:
      quality === MarketValuationQuality.MANUAL
        ? MarketPriceType.MANUAL
        : MarketPriceType.LAST,
    priceDate: quality === MarketValuationQuality.UNKNOWN ? null : "2026-08-22",
    fetchedAt:
      quality === MarketValuationQuality.MANUAL
        ? null
        : "2026-08-22T00:00:00.000Z",
    provider:
      quality === MarketValuationQuality.MANUAL
        ? MarketDataProvider.MANUAL
        : MarketDataProvider.VNSTOCK,
    source:
      quality === MarketValuationQuality.MANUAL
        ? MarketValuationSource.MANUAL
        : MarketValuationSource.AUTOMATIC,
    freshness:
      quality === MarketValuationQuality.AUTO_STALE
        ? MarketValuationFreshness.STALE
        : MarketValuationFreshness.CURRENT,
    quality,
  },
  notes: null,
  ownership: {
    financialScope: "household",
    isOwnedByMe: true,
    canMutate: true,
    ownerStatus: "active",
  },
});

function renderMeta(value: InvestmentHolding, locale: "en" | "vi" = "vi") {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={{ money: locale === "vi" ? viMessages : enMessages }}
    >
      <FinancialPrivacyProvider>
        <InvestmentValuationMeta holding={value} detail />
      </FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

describe("Investment Market Valuation UI 02", () => {
  it("renders current automatic price metadata with the linked quote", () => {
    renderMeta(holding(MarketValuationQuality.AUTO_CURRENT));

    expect(screen.getByText("Giá tự động")).toBeInTheDocument();
    expect(screen.getByText("FPT · 120.000 VND")).toBeInTheDocument();
    expect(screen.getByText("Cập nhật hôm nay")).toBeInTheDocument();
    expect(screen.getByText("Đồng tiền báo giá: VND")).toBeInTheDocument();
  });

  it("keeps stale valuation metadata visible and restrained", () => {
    renderMeta(holding(MarketValuationQuality.AUTO_STALE));

    expect(screen.getByText("Giá tự động")).toBeInTheDocument();
    expect(screen.getByText(/Giá cập nhật gần nhất/)).toBeInTheDocument();
    expect(screen.getByText("FPT · 120.000 VND")).toBeInTheDocument();
  });

  it("distinguishes manual and unknown valuation", () => {
    renderMeta(holding(MarketValuationQuality.MANUAL));
    expect(screen.getByText("Giá cập nhật thủ công")).toBeInTheDocument();

    renderMeta(holding(MarketValuationQuality.UNKNOWN));
    expect(screen.getByText("Chưa có giá")).toBeInTheDocument();
  });

  it("masks quote price while keeping instrument and freshness visible", () => {
    window.localStorage.setItem(
      FINANCIAL_PRIVACY_STORAGE_KEY,
      FINANCIAL_PRIVACY_STORAGE_TRUE,
    );
    renderMeta(holding(MarketValuationQuality.AUTO_CURRENT));

    expect(screen.getByText("••••••")).toBeInTheDocument();
    expect(screen.queryByText("FPT · 120.000 VND")).not.toBeInTheDocument();
    expect(screen.getByText("Cập nhật hôm nay")).toBeInTheDocument();
    expect(screen.getByText("Đồng tiền báo giá: VND")).toBeInTheDocument();
  });
});
