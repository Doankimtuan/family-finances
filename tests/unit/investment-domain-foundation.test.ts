import { describe, expect, it } from "vitest";
import {
  AccountingMethod,
  InvestmentArchetype,
  InvestmentDataQuality,
  InvestmentEventType,
  calculateValuation,
  deriveRealizedPnl,
  disposeCostBasis,
  getCashSemantics,
  getInvestmentStrategy,
} from "@/modules/investments/domain";

describe("investment domain foundation", () => {
  it("selects different policies by archetype instead of a universal cost basis", () => {
    expect(
      getInvestmentStrategy(InvestmentArchetype.SECURITY)
        .defaultAccountingMethod,
    ).toBe(AccountingMethod.WEIGHTED_AVERAGE);
    expect(
      getInvestmentStrategy(InvestmentArchetype.FUND).defaultAccountingMethod,
    ).toBe(AccountingMethod.FIFO);
    expect(
      getInvestmentStrategy(InvestmentArchetype.CRYPTO)
        .allowedAccountingMethods,
    ).toEqual([AccountingMethod.WEIGHTED_AVERAGE]);
    expect(
      getInvestmentStrategy(InvestmentArchetype.GOLD).allowedAccountingMethods,
    ).toContain(AccountingMethod.FIFO);
    expect(
      getInvestmentStrategy(InvestmentArchetype.FUND).allowedOperations,
    ).toContain(InvestmentEventType.REDEEM);
  });

  it("calculates a security trade from quantity and executed price", () => {
    const valuation = calculateValuation({
      archetype: InvestmentArchetype.SECURITY,
      quantity: "10",
      marketPrice: 12_000,
    });
    expect(valuation.currentValue).toBe(120_000);
  });

  it("disposes fund lots FIFO", () => {
    const result = disposeCostBasis({
      position: {
        quantity: "200",
        remainingCostBasis: 3_000_000,
        accountingMethod: AccountingMethod.FIFO,
      },
      quantity: "150",
      lots: [
        {
          id: "lot-1",
          positionId: "p",
          sourceEventId: "e1",
          acquiredAt: "2026-01-01",
          originalQuantity: "100",
          remainingQuantity: "100",
          unitCost: 10_000,
          totalCost: 1_000_000,
        },
        {
          id: "lot-2",
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
    expect(result.disposedCostBasis).toBe(2_000_000);
    expect(result.consumedLots).toEqual([
      { lotId: "lot-1", quantity: "100", cost: 1_000_000 },
      { lotId: "lot-2", quantity: "50", cost: 1_000_000 },
    ]);
    expect(result.remainingQuantity).toBe("50");
    expect(result.remainingCostBasis).toBe(1_000_000);
  });

  it("uses weighted average for crypto partial disposal", () => {
    const result = disposeCostBasis({
      position: {
        quantity: "2",
        remainingCostBasis: 3_000_000,
        accountingMethod: AccountingMethod.WEIGHTED_AVERAGE,
      },
      quantity: "0.5",
    });
    expect(result.disposedCostBasis).toBe(750_000);
    expect(result.remainingQuantity).toBe("1.5");
    expect(result.remainingCostBasis).toBe(2_250_000);
  });

  it("values gold using provider buy-back price, not ask price", () => {
    const valuation = calculateValuation({
      archetype: InvestmentArchetype.GOLD,
      quantity: "2",
      buyBackPrice: 6_500_000,
      askPrice: 6_800_000,
    });
    expect(valuation.currentValue).toBe(13_000_000);
    expect(valuation.spread).toBe(300_000);
  });

  it("keeps principal conversion out of ordinary income and expense", () => {
    const buy = getCashSemantics(
      InvestmentEventType.BUY,
      InvestmentArchetype.CRYPTO,
    );
    const distribution = getCashSemantics(
      InvestmentEventType.DISTRIBUTION,
      InvestmentArchetype.FUND,
    );
    expect(buy.isOrdinaryExpense).toBe(false);
    expect(buy.isOrdinaryIncome).toBe(false);
    expect(buy.quoteAssetMayBeDestination).toBe(false);
    expect(distribution.isOrdinaryIncome).toBe(false);
    expect(
      deriveRealizedPnl({
        grossProceeds: 1_500_000,
        disposedCostBasis: 1_000_000,
        feeAmount: 10_000,
        taxAmount: 5_000,
      }),
    ).toBe(485_000);
  });

  it("retains imported aggregate data quality as an explicit state", () => {
    expect(InvestmentDataQuality.IMPORTED_AGGREGATE).toBe("IMPORTED_AGGREGATE");
  });
});
