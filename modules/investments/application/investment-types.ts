import type {
  InvestmentAssetClass,
  InvestmentFeeSource,
  InvestmentHistoryStatus,
  InvestmentIncomeKind,
  InvestmentLifecycleStatus,
  InvestmentActivityType,
  InvestmentValuationSource,
  InvestmentVisibilityContext,
} from "./investment-constants";

export type InvestmentFeeInput = {
  source: InvestmentFeeSource;
  amountVnd?: number;
  quantity?: string;
  feeValueVnd: number;
  holdingId?: string;
  cashAccountId?: string;
};

export type InvestmentHolding = {
  id: string;
  householdId: string;
  name: string;
  symbol: string | null;
  assetClass: InvestmentAssetClass;
  providerCustodian: string | null;
  visibilityContext: InvestmentVisibilityContext;
  lifecycleStatus: InvestmentLifecycleStatus;
  historyStatus: InvestmentHistoryStatus;
  quantity: string;
  remainingTotalCostBasis: number | null;
  currentValue: number | null;
  currentValuationDate: string | null;
  unrealizedResult: number | null;
  notes: string | null;
};

export type InvestmentActivity = {
  id: string;
  type: InvestmentActivityType;
  sourceHoldingId: string | null;
  destinationHoldingId: string | null;
  sourceQuantity: string | null;
  destinationQuantity: string | null;
  executedValueVnd: number | null;
  quotedValueVnd: number | null;
  sourceBasisConsumed: number | null;
  destinationBasisAdded: number | null;
  realizedResultVnd: number | null;
  incomeKind: InvestmentIncomeKind | null;
  transactionId: string | null;
  correlationId: string;
  effectiveDate: string;
  feesVnd: number;
};

export type InvestmentValuation = {
  id: string;
  holdingId: string;
  valueVnd: number;
  valuationDate: string;
  source: InvestmentValuationSource;
};

export type InvestmentPortfolio = {
  holdings: InvestmentHolding[];
  totalCurrentValue: number | null;
  totalRemainingCostBasis: number | null;
  unrealizedResult: number | null;
  realizedSaleResult: number;
  investmentIncome: number;
  investmentFees: number;
  valuationCoverage: { included: number; total: number };
  basisCoverage: { included: number; total: number };
  allocationByAssetClass: Array<{
    assetClass: InvestmentAssetClass;
    valueVnd: number;
    shareBasisPoints: number;
  }>;
};

export type InvestmentCommandReceipt = {
  operationId: string;
  holdingId: string | null;
  sourceHoldingId: string | null;
  destinationHoldingId: string | null;
  transactionIds: string[];
  beforeQuantity: string | null;
  afterQuantity: string | null;
  beforeBasis: number | null;
  afterBasis: number | null;
  cashDelta: number;
  realizedResult: number | null;
  feeEffects: Array<{
    source: InvestmentFeeSource;
    feeValueVnd: number;
    transactionId: string | null;
  }>;
  correlationId: string;
  idempotentReplay: boolean;
};
