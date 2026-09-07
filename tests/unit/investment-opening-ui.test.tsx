import type { ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en/money.json";
import { OpeningAssetClassPicker } from "@/app/[locale]/(product)/money/investments/opening-asset-class-picker";
import { OpeningReviewSection } from "@/app/[locale]/(product)/money/investments/opening-review-section";
import { InvestmentAssetClass } from "@/modules/investments/application/investment-constants";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";

function renderOpening(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ money: enMessages }}>
      <FinancialPrivacyProvider>{ui}</FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

describe("Investment opening wizard chrome", () => {
  it("renders stacked asset-class tiles with stable test ids", () => {
    const onSelect = vi.fn();
    renderOpening(
      <OpeningAssetClassPicker
        selected={InvestmentAssetClass.STOCK}
        onSelect={onSelect}
      />,
    );

    const stock = screen.getByTestId("investment-type-stock");
    const crypto = screen.getByTestId("investment-type-crypto");
    const bond = screen.getByTestId("investment-type-bond");

    expect(stock).toHaveAttribute("aria-pressed", "true");
    expect(crypto).toHaveAttribute("aria-pressed", "false");
    expect(bond).toBeInTheDocument();
    expect(screen.getByTestId("investment-type-fund")).toBeInTheDocument();
    expect(screen.getByTestId("investment-type-gold")).toBeInTheDocument();

    fireEvent.click(crypto);
    expect(onSelect).toHaveBeenCalledWith(InvestmentAssetClass.CRYPTO);
  });

  it("keeps the review preview test id and shows the formatted hero amount", () => {
    renderOpening(
      <OpeningReviewSection
        title="Review before confirming"
        subtitle="Check the information you are about to record."
        holdingName="Household BTC"
        trackedAsset="Tracked asset: BTC — Bitcoin"
        heroLabel="Estimated market value"
        heroAmount="₫25,000,000"
        heroMeta="Crypto · 0.1"
        facts={[
          { label: "Quantity", value: "0.1" },
          { label: "Custodian / provider", value: "Binance" },
        ]}
        sideTitle="Existing asset owned prior"
        sideSubtitle="Does not create cash movement or fake purchases."
        sideFacts={[{ label: "Estimated P&L", value: "+₫1,000,000" }]}
      />,
    );

    const preview = screen.getByTestId("investment-opening-preview");
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveTextContent("Household BTC");
    expect(preview).toHaveTextContent("₫25,000,000");
    expect(preview).toHaveTextContent("0.1");
    expect(preview).toHaveTextContent("Binance");
    expect(preview).toHaveTextContent("+₫1,000,000");
  });
});
