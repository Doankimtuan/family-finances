import {
  parseQuantity,
  subtractQuantities,
} from "../application/decimal-quantity";
import {
  InvestmentEventType,
  InvestmentPosition,
  InvestmentDomainError,
  MIN_FINANCIAL_AMOUNT,
  QUANTITY_PRECISION_DIVISOR,
  ZERO_QUANTITY_BIGINT,
  applyAcquisition,
  calculateValuation,
  deriveRealizedPnl,
  deriveUnrealizedPnl,
  disposeCostBasis,
} from "./investment-domain";

export const GoldUnit = {
  LUONG: "LUONG",
  CHI: "CHI",
  GRAM: "GRAM",
} as const;
export type GoldUnit = (typeof GoldUnit)[keyof typeof GoldUnit];
export const GOLD_UNIT_VALUES = Object.values(GoldUnit);

export const TradePreviewStatus = {
  READY: "READY",
  PENDING_ALLOCATION: "PENDING_ALLOCATION",
} as const;
export type TradePreviewStatus =
  (typeof TradePreviewStatus)[keyof typeof TradePreviewStatus];
export const TRADE_PREVIEW_STATUS_VALUES = Object.values(TradePreviewStatus);

export const InvestmentEventCategory = {
  INVESTMENT_PURCHASE: "INVESTMENT_PURCHASE",
  INVESTMENT_DISPOSAL: "INVESTMENT_DISPOSAL",
  INVESTMENT_INCOME: "INVESTMENT_INCOME",
  INVESTMENT_VALUATION: "INVESTMENT_VALUATION",
  INVESTMENT_ADJUSTMENT: "INVESTMENT_ADJUSTMENT",
} as const;
export type InvestmentEventCategory =
  (typeof InvestmentEventCategory)[keyof typeof InvestmentEventCategory];
export const INVESTMENT_EVENT_CATEGORY_VALUES = Object.values(
  InvestmentEventCategory,
);

export const AcquisitionOperation = {
  BUY: InvestmentEventType.BUY,
  SUBSCRIBE: InvestmentEventType.SUBSCRIBE,
  ALLOCATE: InvestmentEventType.ALLOCATE,
} as const;
export type AcquisitionOperation =
  (typeof AcquisitionOperation)[keyof typeof AcquisitionOperation];
export const ACQUISITION_OPERATION_VALUES = Object.values(AcquisitionOperation);

export const DisposalOperation = {
  SELL: InvestmentEventType.SELL,
  REDEEM: InvestmentEventType.REDEEM,
} as const;
export type DisposalOperation =
  (typeof DisposalOperation)[keyof typeof DisposalOperation];
export const DISPOSAL_OPERATION_VALUES = Object.values(DisposalOperation);

export const ZERO_CASH_DELTA = 0;

export type InvestmentFee = { amount: number; currency: string };
export type GoldQuantity = { amount: string; unit: GoldUnit };
export type TradePreview = {
  operation: InvestmentEventType;
  status: TradePreviewStatus;
  grossValue: number | null;
  acquisitionCost: number | null;
  disposedCostBasis: number | null;
  fees: InvestmentFee[];
  tax: number;
  netCashFlow: number | null;
  realizedPnl: number | null;
  resultingQuantity: string;
  resultingCostBasis: number | null;
  resultingAverageCost: number | null;
  consumedLots: Array<{ lotId: string; quantity: string; cost: number }>;
  feeAsset: string | null;
  quantityUnit?: GoldUnit;
};
export type ValuationPreview = {
  operation: InvestmentEventType;
  quantity: string;
  costBasis: number | null;
  currentValue: number | null;
  unrealizedPnl: number | null;
  cashDelta: typeof ZERO_CASH_DELTA;
};

type PositionBasis = Pick<
  InvestmentPosition,
  "quantity" | "remainingCostBasis"
>;
type DisposalPosition = Pick<
  InvestmentPosition,
  "quantity" | "remainingCostBasis" | "accountingMethod"
>;
type Lot = NonNullable<Parameters<typeof disposeCostBasis>[0]["lots"]>[number];

const q = (v: string) => Number(parseQuantity(v)) / QUANTITY_PRECISION_DIVISOR;
const positive = (v: string, errorCode: InvestmentDomainError) => {
  if (parseQuantity(v) <= ZERO_QUANTITY_BIGINT) throw new Error(errorCode);
};
const money = (v: number, errorCode: InvestmentDomainError) => {
  if (!Number.isFinite(v) || v < MIN_FINANCIAL_AMOUNT)
    throw new Error(errorCode);
};
const feesTotal = (fees: InvestmentFee[]) =>
  fees.reduce((sum, fee) => {
    money(fee.amount, InvestmentDomainError.INVALID_FEE);
    if (!fee.currency.trim())
      throw new Error(InvestmentDomainError.INVALID_FEE_CURRENCY);
    return sum + fee.amount;
  }, MIN_FINANCIAL_AMOUNT);
const avg = (quantity: string, basis: number | null) =>
  basis == null || parseQuantity(quantity) === ZERO_QUANTITY_BIGINT
    ? null
    : basis / q(quantity);

export function previewAcquisition(input: {
  operation: AcquisitionOperation;
  position: PositionBasis;
  quantity: string;
  unitPrice: number;
  fees?: InvestmentFee[];
  tax?: number;
  feeAsset?: string | null;
}): TradePreview {
  positive(input.quantity, InvestmentDomainError.INVALID_ACQUISITION_QUANTITY);
  money(input.unitPrice, InvestmentDomainError.INVALID_UNIT_PRICE);
  const fees = input.fees ?? [];
  const tax = input.tax ?? MIN_FINANCIAL_AMOUNT;
  money(tax, InvestmentDomainError.INVALID_TAX);
  const grossValue = Math.round(q(input.quantity) * input.unitPrice);
  const acquisitionCost = grossValue + feesTotal(fees) + tax;
  const next = applyAcquisition({
    position: input.position,
    quantity: input.quantity,
    totalCost: acquisitionCost,
  });
  return {
    operation: input.operation,
    status: TradePreviewStatus.READY,
    grossValue,
    acquisitionCost,
    disposedCostBasis: null,
    fees,
    tax,
    netCashFlow: -acquisitionCost,
    realizedPnl: null,
    resultingQuantity: next.quantity,
    resultingCostBasis: next.remainingCostBasis,
    resultingAverageCost: next.averageCost,
    consumedLots: [],
    feeAsset: input.feeAsset ?? null,
  };
}

export function previewDisposal(input: {
  operation: DisposalOperation;
  position: DisposalPosition;
  quantity: string;
  unitPrice: number;
  lots?: Lot[];
  fees?: InvestmentFee[];
  tax?: number;
  feeAsset?: string | null;
}): TradePreview {
  positive(input.quantity, InvestmentDomainError.INVALID_DISPOSAL_QUANTITY);
  money(input.unitPrice, InvestmentDomainError.INVALID_UNIT_PRICE);
  const fees = input.fees ?? [];
  const tax = input.tax ?? MIN_FINANCIAL_AMOUNT;
  money(tax, InvestmentDomainError.INVALID_TAX);
  const basis = disposeCostBasis({
    position: input.position,
    quantity: input.quantity,
    lots: input.lots,
  });
  const grossValue = Math.round(q(input.quantity) * input.unitPrice);
  const netCashFlow = grossValue - feesTotal(fees) - tax;
  return {
    operation: input.operation,
    status: TradePreviewStatus.READY,
    grossValue,
    acquisitionCost: null,
    disposedCostBasis: basis.disposedCostBasis,
    fees,
    tax,
    netCashFlow,
    realizedPnl: deriveRealizedPnl({
      grossProceeds: grossValue,
      disposedCostBasis: basis.disposedCostBasis,
      feeAmount: feesTotal(fees),
      taxAmount: tax,
    }),
    resultingQuantity: basis.remainingQuantity,
    resultingCostBasis: basis.remainingCostBasis,
    resultingAverageCost: avg(
      basis.remainingQuantity,
      basis.remainingCostBasis,
    ),
    consumedLots: basis.consumedLots,
    feeAsset: input.feeAsset ?? null,
  };
}

export const previewSecurityBuy = (
  input: Omit<Parameters<typeof previewAcquisition>[0], "operation">,
) => previewAcquisition({ ...input, operation: InvestmentEventType.BUY });
export const previewSecuritySell = (
  input: Omit<Parameters<typeof previewDisposal>[0], "operation">,
) => previewDisposal({ ...input, operation: InvestmentEventType.SELL });
export const previewFundRedemption = (
  input: Omit<Parameters<typeof previewDisposal>[0], "operation">,
) => previewDisposal({ ...input, operation: InvestmentEventType.REDEEM });

export function previewFundSubscription(input: {
  position: PositionBasis;
  requestedAmount: number;
  allocatedUnits?: string | null;
  navPerUnit?: number | null;
  fees?: InvestmentFee[];
  tax?: number;
}): TradePreview {
  money(
    input.requestedAmount,
    InvestmentDomainError.INVALID_SUBSCRIPTION_AMOUNT,
  );
  if (input.allocatedUnits == null || input.navPerUnit == null)
    return {
      operation: InvestmentEventType.SUBSCRIBE,
      status: TradePreviewStatus.PENDING_ALLOCATION,
      grossValue: input.requestedAmount,
      acquisitionCost: null,
      disposedCostBasis: null,
      fees: input.fees ?? [],
      tax: input.tax ?? MIN_FINANCIAL_AMOUNT,
      netCashFlow: -input.requestedAmount,
      realizedPnl: null,
      resultingQuantity: input.position.quantity,
      resultingCostBasis: input.position.remainingCostBasis,
      resultingAverageCost: avg(
        input.position.quantity,
        input.position.remainingCostBasis,
      ),
      consumedLots: [],
      feeAsset: null,
    };
  return previewAcquisition({
    operation: InvestmentEventType.ALLOCATE,
    position: input.position,
    quantity: input.allocatedUnits,
    unitPrice: input.navPerUnit,
    fees: input.fees,
    tax: input.tax,
  });
}

export function previewCryptoBuy(
  input: Omit<Parameters<typeof previewAcquisition>[0], "operation"> & {
    feeAsset: string;
    baseAsset: string;
    feeQuantityInBase?: string | null;
  },
) {
  const result = previewAcquisition({
    ...input,
    operation: InvestmentEventType.BUY,
    feeAsset: input.feeAsset,
  });
  if (input.feeQuantityInBase == null || input.feeAsset !== input.baseAsset)
    return result;
  positive(
    input.feeQuantityInBase,
    InvestmentDomainError.INVALID_BASE_FEE_QUANTITY,
  );
  return {
    ...result,
    resultingQuantity: subtractQuantities(
      result.resultingQuantity,
      input.feeQuantityInBase,
    ),
  };
}
export const previewCryptoSell = (
  input: Omit<Parameters<typeof previewDisposal>[0], "operation"> & {
    feeAsset: string;
  },
) =>
  previewDisposal({
    ...input,
    operation: InvestmentEventType.SELL,
    feeAsset: input.feeAsset,
  });

export function previewGoldBuy(input: {
  position: PositionBasis;
  quantity: GoldQuantity;
  unitPrice: number;
  fees?: InvestmentFee[];
  tax?: number;
}) {
  return {
    ...previewAcquisition({
      operation: InvestmentEventType.BUY,
      position: input.position,
      quantity: input.quantity.amount,
      unitPrice: input.unitPrice,
      fees: input.fees,
      tax: input.tax,
    }),
    quantityUnit: input.quantity.unit,
  };
}
export function previewGoldSell(input: {
  position: DisposalPosition;
  quantity: GoldQuantity;
  unitPrice: number;
  lots?: Lot[];
  fees?: InvestmentFee[];
  tax?: number;
}) {
  return {
    ...previewDisposal({
      operation: InvestmentEventType.SELL,
      position: input.position,
      quantity: input.quantity.amount,
      unitPrice: input.unitPrice,
      lots: input.lots,
      fees: input.fees,
      tax: input.tax,
    }),
    quantityUnit: input.quantity.unit,
  };
}

export function previewValuationUpdate(input: {
  position: PositionBasis;
  valuation: Parameters<typeof calculateValuation>[0];
}): ValuationPreview {
  const value = calculateValuation(input.valuation);
  return {
    operation: InvestmentEventType.VALUATION_UPDATE,
    quantity: input.position.quantity,
    costBasis: input.position.remainingCostBasis,
    currentValue: value.currentValue,
    unrealizedPnl: deriveUnrealizedPnl(
      value.currentValue,
      input.position.remainingCostBasis,
    ),
    cashDelta: ZERO_CASH_DELTA,
  };
}

export function classifyInvestmentEvent(
  type: InvestmentEventType,
): InvestmentEventCategory {
  if (
    type === InvestmentEventType.BUY ||
    type === InvestmentEventType.SUBSCRIBE ||
    type === InvestmentEventType.ALLOCATE
  )
    return InvestmentEventCategory.INVESTMENT_PURCHASE;
  if (type === InvestmentEventType.SELL || type === InvestmentEventType.REDEEM)
    return InvestmentEventCategory.INVESTMENT_DISPOSAL;
  if (
    type === InvestmentEventType.DISTRIBUTION ||
    type === InvestmentEventType.DIVIDEND
  )
    return InvestmentEventCategory.INVESTMENT_INCOME;
  if (type === InvestmentEventType.VALUATION_UPDATE)
    return InvestmentEventCategory.INVESTMENT_VALUATION;
  return InvestmentEventCategory.INVESTMENT_ADJUSTMENT;
}

export const isHistoricalImport = (type: InvestmentEventType) =>
  type === InvestmentEventType.HISTORICAL_IMPORT;
