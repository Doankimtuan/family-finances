import {
  AccountingMethod,
  disposeCostBasis,
  deriveRealizedPnl,
} from "../domain";
import {
  formatQuantity,
  parseQuantity,
  subtractQuantities,
} from "./decimal-quantity";
import { INVESTMENT_QUANTITY_SCALE } from "./investment-constants";

const QUANTITY_SCALE = BigInt(10) ** BigInt(INVESTMENT_QUANTITY_SCALE);

export type UnitPricePreview = {
  unitPrice: number | null;
  totalValue: number | null;
  pnl: number | null;
  pnlPercent: number | null;
};

export type DisposalPreview = {
  soldQuantity: string;
  executionPricePerUnit: number | null;
  grossProceeds: number | null;
  feeAmount: number;
  netProceeds: number | null;
  disposedCostBasis: number | null;
  realizedPnl: number | null;
  remainingQuantity: string | null;
  remainingCostBasis: number | null;
  isFullDisposal: boolean;
};

function safeMoney(value: number | null | undefined) {
  return value != null && Number.isSafeInteger(value) && value >= 0
    ? BigInt(value)
    : null;
}

export function multiplyQuantityByUnitPrice(
  quantity: string,
  unitPrice: number | null | undefined,
): number | null {
  const price = safeMoney(unitPrice);
  if (price == null) return null;
  try {
    const result =
      (parseQuantity(quantity) * price + QUANTITY_SCALE / BigInt(2)) /
      QUANTITY_SCALE;
    const value = Number(result);
    return Number.isSafeInteger(value) ? value : null;
  } catch {
    return null;
  }
}

function percentage(pnl: number | null, basis: number | null) {
  return pnl != null && basis != null && basis > 0 ? pnl / basis : null;
}

export function buildUnitPricePreview(input: {
  quantity: string;
  unitPrice: number | null;
  costBasis: number | null;
  manualTotalValue?: boolean;
}): UnitPricePreview {
  const totalValue = input.manualTotalValue
    ? input.unitPrice
    : multiplyQuantityByUnitPrice(input.quantity, input.unitPrice);
  const pnl =
    totalValue != null && input.costBasis != null
      ? totalValue - input.costBasis
      : null;
  return {
    unitPrice: input.unitPrice,
    totalValue,
    pnl,
    pnlPercent: percentage(pnl, input.costBasis),
  };
}

export function buildDisposalPreview(input: {
  availableQuantity: string;
  soldQuantity: string;
  executionPricePerUnit: number | null;
  remainingCostBasis: number | null;
  feeAmount?: number | null;
  manualTotalValue?: boolean;
}): DisposalPreview {
  const feeAmount = input.feeAmount ?? 0;
  const grossProceeds = input.manualTotalValue
    ? input.executionPricePerUnit
    : multiplyQuantityByUnitPrice(
        input.soldQuantity,
        input.executionPricePerUnit,
      );
  let remainingQuantity: string | null = null;
  let disposedCostBasis: number | null = null;
  let remainingCostBasis: number | null = null;
  try {
    remainingQuantity = subtractQuantities(
      input.availableQuantity,
      input.soldQuantity,
    );
    const disposal = disposeCostBasis({
      position: {
        quantity: input.availableQuantity,
        remainingCostBasis: input.remainingCostBasis,
        accountingMethod: AccountingMethod.WEIGHTED_AVERAGE,
      },
      quantity: input.soldQuantity,
    });
    disposedCostBasis = disposal.disposedCostBasis;
    remainingCostBasis = disposal.remainingCostBasis;
  } catch {
    remainingQuantity = null;
  }
  const netProceeds = grossProceeds == null ? null : grossProceeds - feeAmount;
  const realizedPnl =
    grossProceeds == null
      ? null
      : deriveRealizedPnl({
          grossProceeds,
          disposedCostBasis,
          feeAmount,
        });
  return {
    soldQuantity: input.soldQuantity,
    executionPricePerUnit: input.executionPricePerUnit,
    grossProceeds,
    feeAmount,
    netProceeds,
    disposedCostBasis,
    realizedPnl,
    remainingQuantity,
    remainingCostBasis,
    isFullDisposal:
      remainingQuantity != null &&
      parseQuantity(remainingQuantity) === BigInt(0),
  };
}

export function normalizeAvailableQuantity(quantity: string) {
  try {
    return formatQuantity(parseQuantity(quantity));
  } catch {
    return quantity;
  }
}
