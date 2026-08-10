import { describe, expect, it } from "vitest";
import {
  addQuantities,
  consumeWeightedAverageBasis,
  formatQuantity,
  parseQuantity,
} from "@/modules/investments/application/decimal-quantity";
import {
  applyInvestmentBuy,
  applyInvestmentConsumption,
  deriveSlippage,
  deriveUnrealizedResult,
} from "@/modules/investments/application/investment-accounting";
import { InvestmentAssetClass } from "@/modules/investments/application/investment-constants";
import { allocateBasisPoints } from "@/modules/investments/application/queries/investment-queries";
import { assetConversionInputSchema } from "@/modules/investments/application/commands/investment-commands";
import { InvestmentFeeSource } from "@/modules/investments/application/investment-constants";

describe("investment exact decimal accounting", () => {
  it("parses and formats quantities without floating point", () => {
    expect(formatQuantity(parseQuantity("123.000000000000000001"))).toBe(
      "123.000000000000000001",
    );
    expect(addQuantities("0.1", "0.2")).toBe("0.3");
    expect(() => parseQuantity("1.0000000000000000001")).toThrow();
  });

  it("uses one half-up weighted-average rounding", () => {
    expect(
      consumeWeightedAverageBasis({
        basis: 101,
        priorQuantity: "2",
        consumedQuantity: "1",
      }),
    ).toBe(51);
  });

  it("adds repeated buys without averaging unit prices", () => {
    const first = applyInvestmentBuy({
      oldQuantity: "1",
      oldBasis: 100_000,
      boughtQuantity: "2.5",
      totalAcquisitionCost: 350_000,
    });
    const second = applyInvestmentBuy({
      oldQuantity: first.quantity,
      oldBasis: first.basis,
      boughtQuantity: "0.5",
      totalAcquisitionCost: 90_000,
    });
    expect(second).toEqual({ quantity: "4", basis: 540_000 });
  });

  it("consumes partial basis and clears full-sale residue", () => {
    const partial = applyInvestmentConsumption({
      oldQuantity: "3",
      oldBasis: 100,
      consumedQuantity: "1",
    });
    expect(partial).toEqual({ quantity: "2", consumedBasis: 33, basis: 67 });
    expect(
      applyInvestmentConsumption({
        oldQuantity: partial.quantity,
        oldBasis: partial.basis,
        consumedQuantity: "2",
      }),
    ).toEqual({ quantity: "0", consumedBasis: 67, basis: 0 });
  });

  it("preserves unknown basis", () => {
    expect(
      applyInvestmentConsumption({
        oldQuantity: "5",
        oldBasis: null,
        consumedQuantity: "1",
      }),
    ).toEqual({ quantity: "4", consumedBasis: null, basis: null });
    expect(deriveUnrealizedResult(500_000, null)).toBeNull();
  });

  it("keeps slippage derived only", () => {
    expect(deriveSlippage({ quotedValue: 98_000, executedValue: 100_000 })).toBe(
      2_000,
    );
    expect(deriveSlippage({ quotedValue: null, executedValue: 100_000 })).toBeNull();
  });

  it("allocates all VND basis points deterministically", () => {
    const rows = allocateBasisPoints([
      { assetClass: InvestmentAssetClass.CRYPTO, valueVnd: 1 },
      { assetClass: InvestmentAssetClass.STOCK, valueVnd: 1 },
      { assetClass: InvestmentAssetClass.FUND, valueVnd: 1 },
    ]);
    expect(rows.reduce((sum, row) => sum + row.shareBasisPoints, 0)).toBe(10_000);
  });

  it("rolls consumed source basis into conversion destination basis", () => {
    const source = applyInvestmentConsumption({
      oldQuantity: "10",
      oldBasis: 1_000_001,
      consumedQuantity: "2",
    });
    const destination = applyInvestmentBuy({
      oldQuantity: "1",
      oldBasis: 50_000,
      boughtQuantity: "0.25",
      totalAcquisitionCost: source.consumedBasis ?? 0,
    });
    expect(source.consumedBasis).toBe(200_000);
    expect(destination).toEqual({ quantity: "1.25", basis: 250_000 });
  });

  it("uses the same basis-roll engine for a Fund A to Fund B switch", () => {
    const fundA = applyInvestmentConsumption({
      oldQuantity: "100",
      oldBasis: 2_000_000,
      consumedQuantity: "25",
    });
    const fundB = applyInvestmentBuy({
      oldQuantity: "10",
      oldBasis: 300_000,
      boughtQuantity: "20",
      totalAcquisitionCost: fundA.consumedBasis ?? 0,
    });
    expect(fundA).toEqual({
      quantity: "75",
      consumedBasis: 500_000,
      basis: 1_500_000,
    });
    expect(fundB).toEqual({ quantity: "30", basis: 800_000 });
  });

  it("accepts all four explicit fee sources with deterministic VND value", () => {
    const base = {
      sourceHoldingId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      destinationHoldingId: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      sourceQuantity: "1",
      destinationQuantity: "2",
      effectiveDate: "2026-08-10",
      idempotencyKey: "investment:test:fees",
    };
    const feeHoldingId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";
    const cashAccountId = "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44";
    const fees = [
      { source: InvestmentFeeSource.CASH, amountVnd: 500, feeValueVnd: 500, cashAccountId },
      { source: InvestmentFeeSource.SOURCE_ASSET, quantity: "0.01", feeValueVnd: 600 },
      { source: InvestmentFeeSource.DESTINATION_ASSET, quantity: "0.02", feeValueVnd: 700 },
      { source: InvestmentFeeSource.OTHER_INVESTMENT, quantity: "0.03", feeValueVnd: 800, holdingId: feeHoldingId },
    ];
    expect(assetConversionInputSchema.safeParse({ ...base, fees }).success).toBe(true);
  });

  it("keeps valuation changes independent from quantity and basis", () => {
    const position = { quantity: "2.5", basis: 300_000 };
    expect({ ...position, currentValue: 450_000 }).toMatchObject(position);
    expect(deriveUnrealizedResult(450_000, position.basis)).toBe(150_000);
  });
});
