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

export type PurchasePreview = {
  investedPrincipal: number | null;
  feeValue: number | null;
  cashLeavingAccount: number | null;
};

export type DisposalPreview = {
  soldQuantity: string;
  executionPricePerUnit: number | null;
  grossProceeds: number | null;
  feeAmount: number;
  feeValue: number;
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

function multiplyQuantityByDecimalValue(
  quantity: string,
  unitPrice: number | null | undefined,
): number | null {
  if (unitPrice == null || !Number.isFinite(unitPrice) || unitPrice < 0) {
    return null;
  }
  const numericQuantity = Number(quantity);
  if (!Number.isFinite(numericQuantity)) return null;
  const result = Math.round(numericQuantity * unitPrice);
  return Number.isSafeInteger(result) ? result : null;
}

export function multiplyQuantityByUnitPrice(
  quantity: string,
  unitPrice: number | null | undefined,
): number | null {
  const price = safeMoney(unitPrice);
  if (price == null) {
    return multiplyQuantityByDecimalValue(quantity, unitPrice);
  }
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

export function buildPurchasePreview(input: {
  quantity: string;
  executionPricePerUnit: number | null;
  totalValue: number | null;
  cashFeeAmount?: number | null;
  feeValue?: number | null;
  manualTotalValue?: boolean;
}): PurchasePreview {
  const investedPrincipal = input.manualTotalValue
    ? input.totalValue
    : multiplyQuantityByUnitPrice(input.quantity, input.executionPricePerUnit);
  const cashFeeAmount = input.cashFeeAmount ?? 0;
  return {
    investedPrincipal,
    feeValue:
      input.feeValue ?? (input.cashFeeAmount == null ? 0 : cashFeeAmount),
    cashLeavingAccount:
      investedPrincipal == null ? null : investedPrincipal + cashFeeAmount,
  };
}

export function buildDisposalPreview(input: {
  availableQuantity: string;
  soldQuantity: string;
  executionPricePerUnit: number | null;
  remainingCostBasis: number | null;
  cashFeeAmount?: number | null;
  feeValue?: number | null;
  /** @deprecated Use cashFeeAmount; retained for current callers. */
  feeAmount?: number | null;
  manualTotalValue?: boolean;
  accountingMethod?: AccountingMethod;
  lots?: Parameters<typeof disposeCostBasis>[0]["lots"];
}): DisposalPreview {
  const feeAmount = input.cashFeeAmount ?? input.feeAmount ?? 0;
  const feeValue = input.feeValue ?? feeAmount;
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
        accountingMethod:
          input.accountingMethod ?? AccountingMethod.WEIGHTED_AVERAGE,
      },
      quantity: input.soldQuantity,
      lots: input.lots,
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
          feeAmount: feeValue,
        });
  return {
    soldQuantity: input.soldQuantity,
    executionPricePerUnit: input.executionPricePerUnit,
    grossProceeds,
    feeAmount,
    feeValue,
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
