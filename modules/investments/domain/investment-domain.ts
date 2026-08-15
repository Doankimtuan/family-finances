import {
  addQuantities,
  consumeWeightedAverageBasis,
  parseQuantity,
  subtractQuantities,
} from "../application/decimal-quantity";
import { INVESTMENT_QUANTITY_SCALE } from "../application/investment-constants";

export const QUANTITY_PRECISION_DIVISOR = 10 ** INVESTMENT_QUANTITY_SCALE;
export const ZERO_QUANTITY_BIGINT = BigInt(0);
export const MIN_FINANCIAL_AMOUNT = 0;

export const InvestmentArchetype = {
  SECURITY: "SECURITY",
  FUND: "FUND",
  CRYPTO: "CRYPTO",
  GOLD: "GOLD",
  MANUAL_ASSET: "MANUAL_ASSET",
} as const;
export type InvestmentArchetype =
  (typeof InvestmentArchetype)[keyof typeof InvestmentArchetype];
export const INVESTMENT_ARCHETYPE_VALUES = Object.values(InvestmentArchetype);

export const AccountingMethod = {
  WEIGHTED_AVERAGE: "WEIGHTED_AVERAGE",
  FIFO: "FIFO",
} as const;
export type AccountingMethod =
  (typeof AccountingMethod)[keyof typeof AccountingMethod];
export const ACCOUNTING_METHOD_VALUES = Object.values(AccountingMethod);

export const InvestmentEventType = {
  BUY: "BUY",
  SELL: "SELL",
  SUBSCRIBE: "SUBSCRIBE",
  REDEEM: "REDEEM",
  ALLOCATE: "ALLOCATE",
  DIVIDEND: "DIVIDEND",
  HISTORICAL_IMPORT: "HISTORICAL_IMPORT",
  DISTRIBUTION: "DISTRIBUTION",
  VALUATION_UPDATE: "VALUATION_UPDATE",
  ADJUSTMENT: "ADJUSTMENT",
} as const;
export type InvestmentEventType =
  (typeof InvestmentEventType)[keyof typeof InvestmentEventType];
export const INVESTMENT_EVENT_TYPE_VALUES = Object.values(InvestmentEventType);

export const InvestmentDataQuality = {
  COMPLETE: "COMPLETE",
  IMPORTED_AGGREGATE: "IMPORTED_AGGREGATE",
  BASIS_UNKNOWN: "BASIS_UNKNOWN",
} as const;
export type InvestmentDataQuality =
  (typeof InvestmentDataQuality)[keyof typeof InvestmentDataQuality];
export const INVESTMENT_DATA_QUALITY_VALUES = Object.values(
  InvestmentDataQuality,
);

export const ValuationSource = {
  MANUAL: "MANUAL",
  PROVIDER: "PROVIDER",
  MARKET_FEED: "MARKET_FEED",
} as const;
export type ValuationSource =
  (typeof ValuationSource)[keyof typeof ValuationSource];
export const VALUATION_SOURCE_VALUES = Object.values(ValuationSource);

export const InvestmentAccountKind = {
  BROKERAGE: "BROKERAGE",
  FUND_PLATFORM: "FUND_PLATFORM",
  SPOT_WALLET: "SPOT_WALLET",
  PERSONAL_CUSTODY: "PERSONAL_CUSTODY",
  OTHER: "OTHER",
} as const;
export type InvestmentAccountKind =
  (typeof InvestmentAccountKind)[keyof typeof InvestmentAccountKind];
export const INVESTMENT_ACCOUNT_KIND_VALUES = Object.values(
  InvestmentAccountKind,
);

export const PositionStatus = {
  ACTIVE: "ACTIVE",
  EXITED: "EXITED",
  UNDER_REVIEW: "UNDER_REVIEW",
} as const;
export type PositionStatus =
  (typeof PositionStatus)[keyof typeof PositionStatus];
export const POSITION_STATUS_VALUES = Object.values(PositionStatus);

export const InvestmentDomainError = {
  INVALID_DISPOSAL_QUANTITY: "INVALID_DISPOSAL_QUANTITY",
  INSUFFICIENT_LOT_QUANTITY: "INSUFFICIENT_LOT_QUANTITY",
  INVALID_ACQUISITION_COST: "INVALID_ACQUISITION_COST",
  INVALID_ACQUISITION_QUANTITY: "INVALID_ACQUISITION_QUANTITY",
  INVALID_UNIT_PRICE: "INVALID_UNIT_PRICE",
  INVALID_TAX: "INVALID_TAX",
  INVALID_FEE: "INVALID_FEE",
  INVALID_FEE_CURRENCY: "INVALID_FEE_CURRENCY",
  INVALID_SUBSCRIPTION_AMOUNT: "INVALID_SUBSCRIPTION_AMOUNT",
  INVALID_BASE_FEE_QUANTITY: "INVALID_BASE_FEE_QUANTITY",
  INVALID_MARKET_PRICE: "INVALID_MARKET_PRICE",
  INVALID_NAV: "INVALID_NAV",
  INVALID_BUY_BACK_PRICE: "INVALID_BUY_BACK_PRICE",
  INVALID_ASK_PRICE: "INVALID_ASK_PRICE",
  INVALID_MANUAL_VALUE: "INVALID_MANUAL_VALUE",
  INVALID_MANUAL_UNIT_PRICE: "INVALID_MANUAL_UNIT_PRICE",
  INVALID_GROSS_PROCEEDS: "INVALID_GROSS_PROCEEDS",
  INVALID_FEE_AMOUNT: "INVALID_FEE_AMOUNT",
  INVALID_TAX_AMOUNT: "INVALID_TAX_AMOUNT",
} as const;
export type InvestmentDomainError =
  (typeof InvestmentDomainError)[keyof typeof InvestmentDomainError];
export const INVESTMENT_DOMAIN_ERROR_VALUES = Object.values(
  InvestmentDomainError,
);

export type Provider = {
  id: string;
  householdId: string;
  name: string;
  supportedArchetypes: InvestmentArchetype[];
  defaultAccountingMethod?: Partial<
    Record<InvestmentArchetype, AccountingMethod>
  >;
};

export type Instrument = {
  id: string;
  householdId: string;
  archetype: InvestmentArchetype;
  name: string;
  symbol?: string | null;
  quoteAsset?: string | null;
  metadata?: Record<string, unknown>;
};

export type InvestmentAccount = {
  id: string;
  householdId: string;
  providerId: string;
  name: string;
  kind: InvestmentAccountKind;
};

export type InvestmentPosition = {
  id: string;
  householdId: string;
  providerId: string | null;
  instrumentId: string | null;
  investmentAccountId: string | null;
  archetype: InvestmentArchetype;
  quantity: string;
  remainingCostBasis: number | null;
  accountingMethod: AccountingMethod;
  dataQuality: InvestmentDataQuality;
  valuationSource: ValuationSource | null;
  status: PositionStatus;
};

export type InvestmentLot = {
  id: string;
  positionId: string;
  sourceEventId: string | null;
  acquiredAt: string;
  originalQuantity: string;
  remainingQuantity: string;
  unitCost: number;
  totalCost: number;
};

export type ValuationInput = {
  archetype: InvestmentArchetype;
  quantity: string;
  marketPrice?: number | null;
  navPerUnit?: number | null;
  buyBackPrice?: number | null;
  askPrice?: number | null;
  manualTotalValue?: number | null;
  manualUnitPrice?: number | null;
};

export type ValuationResult = {
  currentValue: number | null;
  unitPrice: number | null;
  buyBackPrice: number | null;
  askPrice: number | null;
  spread: number | null;
};

export type PositionViewModel = {
  name: string;
  type: InvestmentArchetype;
  provider: string | null;
  quantity: string;
  costBasis: number | null;
  currentValue: number | null;
  realizedPnl: number | null;
  unrealizedPnl: number | null;
  dataQuality: InvestmentDataQuality;
  details: {
    marketPrice?: number | null;
    nav?: number | null;
    averageCost?: number | null;
    buyBackPrice?: number | null;
    askPrice?: number | null;
    spread?: number | null;
  };
};

export type CashSemantics = {
  operation: InvestmentEventType;
  isAssetConversion: boolean;
  isOrdinaryExpense: false;
  isOrdinaryIncome: false;
  sourceRequired: boolean;
  destinationRequired: boolean;
  quoteAssetMayBeDestination: boolean;
};

const q = (s: string) => Number(parseQuantity(s)) / QUANTITY_PRECISION_DIVISOR;
const amount = (s: string, p: number) => Math.round(q(s) * p);
const valid = (
  v: number | null | undefined,
  errorCode: InvestmentDomainError,
) => {
  if (v != null && (!Number.isFinite(v) || v < MIN_FINANCIAL_AMOUNT))
    throw new Error(errorCode);
};

export function disposeCostBasis(i: {
  position: Pick<
    InvestmentPosition,
    "quantity" | "remainingCostBasis" | "accountingMethod"
  >;
  quantity: string;
  lots?: InvestmentLot[];
}): {
  disposedCostBasis: number | null;
  consumedLots: Array<{ lotId: string; quantity: string; cost: number }>;
  remainingQuantity: string;
  remainingCostBasis: number | null;
} {
  if (parseQuantity(i.quantity) <= ZERO_QUANTITY_BIGINT)
    throw new Error(InvestmentDomainError.INVALID_DISPOSAL_QUANTITY);
  const remainingQuantity = subtractQuantities(i.position.quantity, i.quantity);
  if (i.position.accountingMethod !== AccountingMethod.FIFO) {
    const d = consumeWeightedAverageBasis({
      basis: i.position.remainingCostBasis,
      priorQuantity: i.position.quantity,
      consumedQuantity: i.quantity,
    });
    return {
      disposedCostBasis: d,
      consumedLots: [],
      remainingQuantity,
      remainingCostBasis:
        i.position.remainingCostBasis == null || d == null
          ? null
          : i.position.remainingCostBasis - d,
    };
  }
  let left = i.quantity,
    d = 0;
  const consumed: Array<{ lotId: string; quantity: string; cost: number }> = [];
  for (const l of [...(i.lots ?? [])].sort(
    (a, b) =>
      a.acquiredAt.localeCompare(b.acquiredAt) || a.id.localeCompare(b.id),
  )) {
    if (parseQuantity(left) === ZERO_QUANTITY_BIGINT) break;
    const x =
      parseQuantity(l.remainingQuantity) <= parseQuantity(left)
        ? l.remainingQuantity
        : left;
    const c = amount(x, l.unitCost);
    consumed.push({ lotId: l.id, quantity: x, cost: c });
    d += c;
    left = subtractQuantities(left, x);
  }
  if (parseQuantity(left) > ZERO_QUANTITY_BIGINT)
    throw new Error(InvestmentDomainError.INSUFFICIENT_LOT_QUANTITY);
  return {
    disposedCostBasis: d,
    consumedLots: consumed,
    remainingQuantity,
    remainingCostBasis:
      i.position.remainingCostBasis == null
        ? null
        : i.position.remainingCostBasis - d,
  };
}

export function applyAcquisition(i: {
  position: Pick<InvestmentPosition, "quantity" | "remainingCostBasis">;
  quantity: string;
  totalCost: number;
}) {
  valid(i.totalCost, InvestmentDomainError.INVALID_ACQUISITION_COST);
  const quantity = addQuantities(i.position.quantity, i.quantity);
  const remainingCostBasis =
    i.position.remainingCostBasis == null
      ? null
      : i.position.remainingCostBasis + i.totalCost;
  return {
    quantity,
    remainingCostBasis,
    averageCost:
      remainingCostBasis == null ? null : remainingCostBasis / q(quantity),
  };
}

export function calculateValuation(i: ValuationInput): ValuationResult {
  valid(i.marketPrice, InvestmentDomainError.INVALID_MARKET_PRICE);
  valid(i.navPerUnit, InvestmentDomainError.INVALID_NAV);
  valid(i.buyBackPrice, InvestmentDomainError.INVALID_BUY_BACK_PRICE);
  valid(i.askPrice, InvestmentDomainError.INVALID_ASK_PRICE);
  valid(i.manualTotalValue, InvestmentDomainError.INVALID_MANUAL_VALUE);
  valid(i.manualUnitPrice, InvestmentDomainError.INVALID_MANUAL_UNIT_PRICE);

  const u =
    i.archetype === InvestmentArchetype.SECURITY ||
    i.archetype === InvestmentArchetype.CRYPTO
      ? (i.marketPrice ?? null)
      : i.archetype === InvestmentArchetype.FUND
        ? (i.navPerUnit ?? null)
        : i.archetype === InvestmentArchetype.GOLD
          ? (i.buyBackPrice ?? null)
          : (i.manualUnitPrice ?? null);
  const currentValue =
    i.archetype === InvestmentArchetype.MANUAL_ASSET &&
    i.manualTotalValue != null
      ? i.manualTotalValue
      : u == null
        ? null
        : amount(i.quantity, u);
  return {
    currentValue,
    unitPrice: u,
    buyBackPrice: i.buyBackPrice ?? null,
    askPrice: i.askPrice ?? null,
    spread:
      i.buyBackPrice != null && i.askPrice != null
        ? i.askPrice - i.buyBackPrice
        : null,
  };
}

export function deriveRealizedPnl(i: {
  grossProceeds: number;
  disposedCostBasis: number | null;
  feeAmount?: number;
  taxAmount?: number;
}) {
  valid(i.grossProceeds, InvestmentDomainError.INVALID_GROSS_PROCEEDS);
  valid(i.feeAmount, InvestmentDomainError.INVALID_FEE_AMOUNT);
  valid(i.taxAmount, InvestmentDomainError.INVALID_TAX_AMOUNT);
  return i.disposedCostBasis == null
    ? null
    : i.grossProceeds -
        i.disposedCostBasis -
        (i.feeAmount ?? 0) -
        (i.taxAmount ?? 0);
}

export function deriveUnrealizedPnl(
  value: number | null,
  basis: number | null,
) {
  return value == null || basis == null ? null : value - basis;
}

export function getCashSemantics(
  type: InvestmentEventType,
  asset: InvestmentArchetype,
): CashSemantics {
  const purchase =
    type === InvestmentEventType.BUY || type === InvestmentEventType.SUBSCRIBE;
  const sale =
    type === InvestmentEventType.SELL || type === InvestmentEventType.REDEEM;
  return {
    operation: type,
    isAssetConversion: purchase || sale,
    isOrdinaryExpense: false,
    isOrdinaryIncome: false,
    sourceRequired: purchase && asset !== InvestmentArchetype.CRYPTO,
    destinationRequired: sale && asset !== InvestmentArchetype.CRYPTO,
    quoteAssetMayBeDestination: asset === InvestmentArchetype.CRYPTO && sale,
  };
}

type Strategy = {
  archetype: InvestmentArchetype;
  defaultAccountingMethod: AccountingMethod;
  allowedAccountingMethods: AccountingMethod[];
  allowedOperations: InvestmentEventType[];
  labels: Record<InvestmentEventType, string>;
  valuation: (i: ValuationInput) => ValuationResult;
};

export const INVESTMENT_EVENT_LABELS: Record<InvestmentEventType, string> = {
  [InvestmentEventType.BUY]: "Buy",
  [InvestmentEventType.SELL]: "Sell",
  [InvestmentEventType.SUBSCRIBE]: "Subscribe",
  [InvestmentEventType.REDEEM]: "Redeem",
  [InvestmentEventType.ALLOCATE]: "Allocate units",
  [InvestmentEventType.DIVIDEND]: "Dividend",
  [InvestmentEventType.HISTORICAL_IMPORT]: "Historical import",
  [InvestmentEventType.DISTRIBUTION]: "Distribution",
  [InvestmentEventType.VALUATION_UPDATE]: "Update valuation",
  [InvestmentEventType.ADJUSTMENT]: "Adjust holding",
} as const;

export const investmentStrategies: Record<InvestmentArchetype, Strategy> = {
  [InvestmentArchetype.SECURITY]: {
    archetype: InvestmentArchetype.SECURITY,
    defaultAccountingMethod: AccountingMethod.WEIGHTED_AVERAGE,
    allowedAccountingMethods: [
      AccountingMethod.WEIGHTED_AVERAGE,
      AccountingMethod.FIFO,
    ],
    allowedOperations: [
      InvestmentEventType.BUY,
      InvestmentEventType.SELL,
      InvestmentEventType.DISTRIBUTION,
      InvestmentEventType.DIVIDEND,
      InvestmentEventType.VALUATION_UPDATE,
      InvestmentEventType.ADJUSTMENT,
    ],
    labels: INVESTMENT_EVENT_LABELS,
    valuation: calculateValuation,
  },
  [InvestmentArchetype.FUND]: {
    archetype: InvestmentArchetype.FUND,
    defaultAccountingMethod: AccountingMethod.FIFO,
    allowedAccountingMethods: [
      AccountingMethod.FIFO,
      AccountingMethod.WEIGHTED_AVERAGE,
    ],
    allowedOperations: [
      InvestmentEventType.SUBSCRIBE,
      InvestmentEventType.ALLOCATE,
      InvestmentEventType.REDEEM,
      InvestmentEventType.DISTRIBUTION,
      InvestmentEventType.VALUATION_UPDATE,
      InvestmentEventType.ADJUSTMENT,
    ],
    labels: {
      ...INVESTMENT_EVENT_LABELS,
      [InvestmentEventType.SUBSCRIBE]: "Invest / buy fund units",
      [InvestmentEventType.REDEEM]: "Redeem / sell fund units",
    },
    valuation: calculateValuation,
  },
  [InvestmentArchetype.CRYPTO]: {
    archetype: InvestmentArchetype.CRYPTO,
    defaultAccountingMethod: AccountingMethod.WEIGHTED_AVERAGE,
    allowedAccountingMethods: [AccountingMethod.WEIGHTED_AVERAGE],
    allowedOperations: [
      InvestmentEventType.BUY,
      InvestmentEventType.SELL,
      InvestmentEventType.VALUATION_UPDATE,
      InvestmentEventType.ADJUSTMENT,
    ],
    labels: INVESTMENT_EVENT_LABELS,
    valuation: calculateValuation,
  },
  [InvestmentArchetype.GOLD]: {
    archetype: InvestmentArchetype.GOLD,
    defaultAccountingMethod: AccountingMethod.FIFO,
    allowedAccountingMethods: [
      AccountingMethod.FIFO,
      AccountingMethod.WEIGHTED_AVERAGE,
    ],
    allowedOperations: [
      InvestmentEventType.BUY,
      InvestmentEventType.SELL,
      InvestmentEventType.VALUATION_UPDATE,
      InvestmentEventType.ADJUSTMENT,
    ],
    labels: {
      ...INVESTMENT_EVENT_LABELS,
      [InvestmentEventType.BUY]: "Buy gold",
      [InvestmentEventType.SELL]: "Sell gold",
    },
    valuation: calculateValuation,
  },
  [InvestmentArchetype.MANUAL_ASSET]: {
    archetype: InvestmentArchetype.MANUAL_ASSET,
    defaultAccountingMethod: AccountingMethod.WEIGHTED_AVERAGE,
    allowedAccountingMethods: [AccountingMethod.WEIGHTED_AVERAGE],
    allowedOperations: [
      InvestmentEventType.ADJUSTMENT,
      InvestmentEventType.VALUATION_UPDATE,
    ],
    labels: INVESTMENT_EVENT_LABELS,
    valuation: calculateValuation,
  },
};

export function getInvestmentStrategy(a: InvestmentArchetype) {
  return investmentStrategies[a];
}

export function buildPositionViewModel(i: {
  position: InvestmentPosition;
  name: string;
  provider: string | null;
  valuation: ValuationResult;
  realizedPnl: number | null;
}): PositionViewModel {
  const sc =
    i.position.archetype === InvestmentArchetype.SECURITY ||
    i.position.archetype === InvestmentArchetype.CRYPTO;
  return {
    name: i.name,
    type: i.position.archetype,
    provider: i.provider,
    quantity: i.position.quantity,
    costBasis: i.position.remainingCostBasis,
    currentValue: i.valuation.currentValue,
    realizedPnl: i.realizedPnl,
    unrealizedPnl: deriveUnrealizedPnl(
      i.valuation.currentValue,
      i.position.remainingCostBasis,
    ),
    dataQuality: i.position.dataQuality,
    details: {
      marketPrice: sc ? i.valuation.unitPrice : undefined,
      nav:
        i.position.archetype === InvestmentArchetype.FUND
          ? i.valuation.unitPrice
          : undefined,
      averageCost:
        i.position.archetype === InvestmentArchetype.CRYPTO &&
        i.position.remainingCostBasis != null
          ? i.position.remainingCostBasis / q(i.position.quantity)
          : undefined,
      buyBackPrice:
        i.position.archetype === InvestmentArchetype.GOLD
          ? i.valuation.buyBackPrice
          : undefined,
      askPrice:
        i.position.archetype === InvestmentArchetype.GOLD
          ? i.valuation.askPrice
          : undefined,
      spread:
        i.position.archetype === InvestmentArchetype.GOLD
          ? i.valuation.spread
          : undefined,
    },
  };
}
