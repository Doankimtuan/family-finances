import { describe, expect, it } from "vitest";
import {
  AccountingMethod,
  InvestmentArchetype,
  InvestmentEventType,
  calculateValuation,
} from "@/modules/investments/domain/investment-domain";
import {
  classifyInvestmentEvent,
  previewCryptoBuy,
  previewFundRedemption,
  previewFundSubscription,
  previewGoldBuy,
  previewGoldSell,
  previewSecurityBuy,
  previewSecuritySell,
  previewValuationUpdate,
} from "@/modules/investments/domain/investment-lifecycle";

const security = { quantity: "0", remainingCostBasis: 0 };

describe("Prompt 09.1 investment lifecycle", () => {
  it("handles security initial buy, additional buy, partial sell, and full sell", () => {
    const first = previewSecurityBuy({
      position: security,
      quantity: "10",
      unitPrice: 100_000,
    });
    expect(first.resultingQuantity).toBe("10");
    expect(first.resultingCostBasis).toBe(1_000_000);
    const added = previewSecurityBuy({
      position: {
        quantity: first.resultingQuantity,
        remainingCostBasis: first.resultingCostBasis,
      },
      quantity: "5",
      unitPrice: 120_000,
    });
    expect(added.resultingQuantity).toBe("15");
    expect(added.resultingCostBasis).toBe(1_600_000);
    expect(added.resultingAverageCost).toBeCloseTo(106_666.67, 2);
    const partial = previewSecuritySell({
      position: {
        quantity: "10",
        remainingCostBasis: 1_000_000,
        accountingMethod: AccountingMethod.WEIGHTED_AVERAGE,
      },
      quantity: "4",
      unitPrice: 150_000,
    });
    expect(partial.disposedCostBasis).toBe(400_000);
    expect(partial.realizedPnl).toBe(200_000);
    expect(partial.resultingQuantity).toBe("6");
    expect(partial.resultingCostBasis).toBe(600_000);
    const full = previewSecuritySell({
      position: {
        quantity: "10",
        remainingCostBasis: 1_000_000,
        accountingMethod: AccountingMethod.WEIGHTED_AVERAGE,
      },
      quantity: "10",
      unitPrice: 150_000,
    });
    expect(full.resultingQuantity).toBe("0");
    expect(full.resultingCostBasis).toBe(0);
    expect(full.resultingAverageCost).toBeNull();
    expect(() =>
      previewSecuritySell({
        position: {
          quantity: "1",
          remainingCostBasis: 100,
          accountingMethod: AccountingMethod.WEIGHTED_AVERAGE,
        },
        quantity: "2",
        unitPrice: 100,
      }),
    ).toThrow();
  });

  it("includes acquisition fees in basis and disposal fees in realized result", () => {
    const buy = previewSecurityBuy({
      position: security,
      quantity: "1",
      unitPrice: 1_000_000,
      fees: [{ amount: 10_000, currency: "VND" }],
      tax: 2_000,
    });
    expect(buy.acquisitionCost).toBe(1_012_000);
    expect(buy.netCashFlow).toBe(-1_012_000);
    const sell = previewSecuritySell({
      position: {
        quantity: "1",
        remainingCostBasis: 1_012_000,
        accountingMethod: AccountingMethod.WEIGHTED_AVERAGE,
      },
      quantity: "1",
      unitPrice: 1_200_000,
      fees: [{ amount: 10_000, currency: "VND" }],
      tax: 5_000,
    });
    expect(sell.realizedPnl).toBe(173_000);
  });

  it("supports fund pending allocation and FIFO redemption", () => {
    const pending = previewFundSubscription({
      position: { quantity: "0", remainingCostBasis: 0 },
      requestedAmount: 10_000_000,
    });
    expect(pending.status).toBe("PENDING_ALLOCATION");
    expect(pending.resultingQuantity).toBe("0");
    const redeemed = previewFundRedemption({
      position: {
        quantity: "200",
        remainingCostBasis: 3_000_000,
        accountingMethod: AccountingMethod.FIFO,
      },
      quantity: "150",
      unitPrice: 25_000,
      lots: [
        {
          id: "a",
          positionId: "p",
          sourceEventId: "e1",
          acquiredAt: "2026-01-01",
          originalQuantity: "100",
          remainingQuantity: "100",
          unitCost: 10_000,
          totalCost: 1_000_000,
        },
        {
          id: "b",
          positionId: "p",
          sourceEventId: "e2",
          acquiredAt: "2026-02-01",
          originalQuantity: "100",
          remainingQuantity: "100",
          unitCost: 20_000,
          totalCost: 2_000_000,
        },
      ],
    });
    expect(redeemed.disposedCostBasis).toBe(2_000_000);
    expect(redeemed.resultingQuantity).toBe("50");
    expect(redeemed.resultingCostBasis).toBe(1_000_000);
  });

  it("preserves crypto fee asset and prevents valuation from changing basis or cash", () => {
    const buy = previewCryptoBuy({
      position: security,
      quantity: "1",
      unitPrice: 1_000,
      feeAsset: "BNB",
      baseAsset: "BTC",
    });
    expect(buy.feeAsset).toBe("BNB");
    const valuation = previewValuationUpdate({
      position: { quantity: "1", remainingCostBasis: 1_000 },
      valuation: {
        archetype: InvestmentArchetype.CRYPTO,
        quantity: "1",
        marketPrice: 1_500,
      },
    });
    expect(valuation.currentValue).toBe(1_500);
    expect(valuation.costBasis).toBe(1_000);
    expect(valuation.quantity).toBe("1");
    expect(valuation.cashDelta).toBe(0);
  });

  it("uses structured gold units and buy-back valuation", () => {
    const buy = previewGoldBuy({
      position: security,
      quantity: { amount: "2", unit: "CHI" },
      unitPrice: 6_000_000,
    });
    expect(buy.quantityUnit).toBe("CHI");
    expect(buy.resultingCostBasis).toBe(12_000_000);
    const sell = previewGoldSell({
      position: {
        quantity: "2",
        remainingCostBasis: 12_000_000,
        accountingMethod: AccountingMethod.WEIGHTED_AVERAGE,
      },
      quantity: { amount: "1", unit: "CHI" },
      unitPrice: 6_500_000,
    });
    expect(sell.realizedPnl).toBe(500_000);
    expect(sell.resultingCostBasis).toBe(6_000_000);
    const value = calculateValuation({
      archetype: InvestmentArchetype.GOLD,
      quantity: "2",
      buyBackPrice: 6_500_000,
      askPrice: 6_800_000,
    });
    expect(value.currentValue).toBe(13_000_000);
    expect(value.spread).toBe(300_000);
  });

  it("classifies principal, income, and valuation separately", () => {
    expect(classifyInvestmentEvent(InvestmentEventType.BUY)).toBe(
      "INVESTMENT_PURCHASE",
    );
    expect(classifyInvestmentEvent(InvestmentEventType.SELL)).toBe(
      "INVESTMENT_DISPOSAL",
    );
    expect(classifyInvestmentEvent(InvestmentEventType.DIVIDEND)).toBe(
      "INVESTMENT_INCOME",
    );
    expect(classifyInvestmentEvent(InvestmentEventType.VALUATION_UPDATE)).toBe(
      "INVESTMENT_VALUATION",
    );
  });
});
