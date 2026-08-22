import { describe, expect, it } from "vitest";
import { InvestmentAssetClass } from "@/modules/investments/application/investment-constants";
import { investmentUxConfig } from "@/modules/investments/application/investment-ux";
import {
  buildDisposalPreview,
  buildPurchasePreview,
  buildUnitPricePreview,
  normalizeAvailableQuantity,
} from "@/modules/investments/application/investment-operation-view-model";

describe("investment operation view model", () => {
  it("derives fund valuation total and unrealized P&L from NAV per CCQ", () => {
    const result = buildUnitPricePreview({
      quantity: "12",
      unitPrice: 10_250,
      costBasis: 120_000,
    });
    expect(result.totalValue).toBe(123_000);
    expect(result.pnl).toBe(3_000);
    expect(result.pnlPercent).toBeCloseTo(0.025);
  });

  it("does not invent valuation P&L when basis is unknown", () => {
    const result = buildUnitPricePreview({
      quantity: "0.25",
      unitPrice: 70_000,
      costBasis: null,
    });
    expect(result.totalValue).toBe(17_500);
    expect(result.pnl).toBeNull();
    expect(result.pnlPercent).toBeNull();
  });

  it("derives sell gross, net, realized P&L, and remaining quantity", () => {
    const result = buildDisposalPreview({
      availableQuantity: "12",
      soldQuantity: "4",
      executionPricePerUnit: 150_000,
      remainingCostBasis: 1_200_000,
      feeAmount: 5_000,
    });
    expect(result.grossProceeds).toBe(600_000);
    expect(result.netProceeds).toBe(595_000);
    expect(result.disposedCostBasis).toBe(400_000);
    expect(result.realizedPnl).toBe(195_000);
    expect(result.remainingQuantity).toBe("8");
    expect(result.isFullDisposal).toBe(false);
  });

  it("keeps cash fees separate from reporting fees in sell preview", () => {
    const result = buildDisposalPreview({
      availableQuantity: "10",
      soldQuantity: "2",
      executionPricePerUnit: 100_000,
      remainingCostBasis: 150_000,
      cashFeeAmount: 2_000,
      feeValue: 5_000,
    });
    expect(result.netProceeds).toBe(198_000);
    expect(result.realizedPnl).toBe(165_000);
  });

  it("previews principal and cash outflow without using market price", () => {
    expect(
      buildPurchasePreview({
        quantity: "2",
        executionPricePerUnit: 100_000,
        totalValue: null,
        cashFeeAmount: 1_000,
        feeValue: 1_000,
      }),
    ).toEqual({
      investedPrincipal: 200_000,
      feeValue: 1_000,
      cashLeavingAccount: 201_000,
    });
  });

  it("supports exact fractional MAX quantity and full disposal", () => {
    expect(normalizeAvailableQuantity("0.123456780000000000")).toBe(
      "0.12345678",
    );
    const result = buildDisposalPreview({
      availableQuantity: "0.123456780000000000",
      soldQuantity: "0.12345678",
      executionPricePerUnit: 70_000,
      remainingCostBasis: 6_000,
    });
    expect(result.grossProceeds).toBe(8_642);
    expect(result.remainingQuantity).toBe("0");
    expect(result.isFullDisposal).toBe(true);
  });

  it("keeps crypto quote currency context in the UX strategy", () => {
    const crypto = investmentUxConfig(InvestmentAssetClass.CRYPTO);
    expect(crypto.valuationPriceLabelKey).toBe(
      "ux.assetClasses.crypto.valuationPriceLabel",
    );
    expect(crypto.disposalPriceLabelKey).toBe(
      "ux.assetClasses.crypto.disposalPriceLabel",
    );
    expect(crypto.priceCurrencyKey).toBe(
      "ux.assetClasses.crypto.priceCurrency",
    );
  });

  it("supports the manual-asset total-value exception", () => {
    const result = buildUnitPricePreview({
      quantity: "1",
      unitPrice: 2_000_000,
      costBasis: 1_500_000,
      manualTotalValue: true,
    });
    expect(result.totalValue).toBe(2_000_000);
    expect(result.pnl).toBe(500_000);
  });
});
