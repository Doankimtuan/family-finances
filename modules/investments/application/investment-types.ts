import type {
  InvestmentAssetClass,
  InvestmentFeeSource,
  InvestmentHistoryStatus,
  InvestmentIncomeKind,
  InvestmentLifecycleStatus,
  InvestmentActivityType,
  MarketDataProvider,
  MarketFxProvider,
  MarketValuationFreshness,
  MarketValuationQuality,
  MarketValuationSource,
  MarketPriceType,
  MarketPricingMode,
  MarketSyncStatus,
  InvestmentValuationSource,
  InvestmentVisibilityContext,
  MarketSyncProvider,
} from "./investment-constants";
import { InvestmentHoldingReadStatus } from "./investment-constants";
import type { AccountingMethod, InvestmentLot } from "../domain";
import type { FinancialCapabilities } from "@/modules/shared-kernel/application/financial-ownership";

export type InvestmentFeeInput = {
  source: InvestmentFeeSource;
  amountVnd?: number;
  quantity?: string;
  feeValueVnd: number;
  feeAsset?: string | null;
  holdingId?: string;
  cashAccountId?: string;
};

export type InvestmentHolding = {
  id: string;
  householdId: string;
  name: string;
  symbol: string | null;
  instrumentId: string | null;
  instrument?: MarketInstrument | null;
  assetClass: InvestmentAssetClass;
  providerCustodian: string | null;
  visibilityContext: InvestmentVisibilityContext;
  lifecycleStatus: InvestmentLifecycleStatus;
  historyStatus: InvestmentHistoryStatus;
  quantity: string;
  remainingTotalCostBasis: number | null;
  currentValue: number | null;
  currentValuationDate: string | null;
  currentValuationSource: InvestmentValuationSource | null;
  unrealizedResult: number | null;
  estimatedUnrealizedPnl?: number | null;
  estimatedUnrealizedPnlPercent?: number | null;
  valuation?: InvestmentValuationResolution;
  notes: string | null;
  accountingMethod?: AccountingMethod;
  lots?: InvestmentLot[];
  ownership: FinancialCapabilities;
};

export type InvestmentHoldingReadResult =
  | {
      status: typeof InvestmentHoldingReadStatus.READY;
      holding: InvestmentHolding;
    }
  | { status: typeof InvestmentHoldingReadStatus.NOT_FOUND }
  | { status: typeof InvestmentHoldingReadStatus.ERROR };

export type MarketInstrument = {
  id: string;
  assetClass: InvestmentAssetClass;
  symbol: string;
  name: string;
  exchange: string | null;
  currency: string;
  pricingMode: MarketPricingMode;
  autoPriceSupported: boolean;
  isActive: boolean;
  metadata: Record<string, unknown>;
};

export type MarketInstrumentSource = {
  instrumentId: string;
  provider: MarketDataProvider;
  providerInstrumentId: string;
  priority: number;
  isEnabled: boolean;
  metadata: Record<string, unknown>;
};

export type MarketInstrumentPrice = {
  instrumentId: string;
  price: number;
  currency: string;
  priceType: MarketPriceType;
  priceDate: string;
  fetchedAt: string;
  provider: MarketDataProvider;
  metadata: Record<string, unknown>;
  updatedAt: string;
};

export type MarketCurrencyRate = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  rateDate: string;
  fetchedAt: string;
  provider: MarketFxProvider;
  updatedAt: string;
};

export type MarketFxPair = {
  baseCurrency: string;
  quoteCurrency: string;
};

export type MarketFxRateResult = MarketCurrencyRate;

export type MarketFxAdapter = {
  provider: MarketFxProvider;
  fetchRates(pairs: readonly MarketFxPair[]): Promise<{
    rates: readonly MarketFxRateResult[];
    failures: readonly string[];
  }>;
};

export type InvestmentValuationResolution = {
  currentValue: number | null;
  estimatedUnrealizedPnl: number | null;
  estimatedUnrealizedPnlPercent: number | null;
  price: number | null;
  priceCurrency: string | null;
  unitPriceVnd: number | null;
  fxRateToVnd: number | null;
  priceType: MarketPriceType | null;
  priceDate: string | null;
  fetchedAt: string | null;
  provider: MarketDataProvider | null;
  source: MarketValuationSource;
  freshness: MarketValuationFreshness;
  quality: MarketValuationQuality;
};

export type MarketCatalogCandidate = {
  assetClass: InvestmentAssetClass;
  symbol: string;
  name: string;
  exchange: string | null;
  currency: string;
  pricingMode: MarketPricingMode;
  autoPriceSupported: boolean;
  provider: MarketSyncProvider;
  providerInstrumentId: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
};

export type MarketCatalogAdapter = {
  provider: MarketSyncProvider;
  searchInstruments(
    query: string,
    assetClass?: InvestmentAssetClass,
  ): Promise<readonly unknown[]>;
  listInstruments(
    assetClass?: InvestmentAssetClass,
  ): Promise<readonly unknown[]>;
  normalizeProviderResult(
    raw: unknown,
    assetClass?: InvestmentAssetClass,
  ): MarketCatalogCandidate | null;
  fetchPrices(
    targets: readonly MarketPriceFetchTarget[],
  ): Promise<MarketPriceFetchResult>;
};

export type MarketPriceFetchTarget = {
  instrumentId: string;
  providerInstrumentId: string;
  symbol: string;
  assetClass: InvestmentAssetClass;
  pricingMode: MarketPricingMode;
  currency: string;
  provider: MarketSyncProvider;
};

export type MarketPriceResult = {
  instrumentId: string;
  price: number;
  currency: string;
  priceType: MarketPriceType;
  priceDate: string;
  fetchedAt: string;
  provider: MarketSyncProvider;
  metadata: Record<string, unknown>;
};

export type MarketPriceFetchFailure = {
  instrumentId: string;
  error: string;
};

export type MarketPriceFetchResult = {
  prices: readonly MarketPriceResult[];
  failures: readonly MarketPriceFetchFailure[];
};

export type MarketPriceSyncInput = {
  assetClass?: InvestmentAssetClass;
  provider?: MarketSyncProvider;
};

export type MarketPriceSyncProviderResult = {
  provider: MarketSyncProvider;
  assetClass: InvestmentAssetClass | null;
  startedAt: string;
  finishedAt: string;
  requestedCount: number;
  successCount: number;
  failedCount: number;
  status: MarketSyncStatus;
  errorSummary: string | null;
};

export type MarketPriceSyncResult = {
  status: MarketSyncStatus;
  skipped: boolean;
  requestedCount: number;
  successCount: number;
  failedCount: number;
  providers: MarketPriceSyncProviderResult[];
};

export type MarketCatalogSearchInput = {
  query?: string;
  assetClass?: InvestmentAssetClass;
  activeOnly?: boolean;
  limit?: number;
};

export type MarketCatalogSyncProviderResult = {
  provider: MarketSyncProvider;
  startedAt: string;
  finishedAt: string;
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  failedCount: number;
  error: string | null;
};

export type MarketCatalogSyncResult = {
  providers: MarketCatalogSyncProviderResult[];
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
  unitPriceVnd: number | null;
};

export type InvestmentValuation = {
  id: string;
  holdingId: string;
  valueVnd: number;
  valuationDate: string;
  source: InvestmentValuationSource;
  quantity: string;
  unitPriceVnd: number | null;
};

export type InvestmentPortfolio = {
  holdings: InvestmentHolding[];
  activeHoldings: InvestmentHolding[];
  closedHoldings: InvestmentHolding[];
  incompleteBasisCount: number;
  closedPositionCount: number;
  totalCurrentValue: number | null;
  totalRemainingCostBasis: number | null;
  unrealizedResult: number | null;
  estimatedUnrealizedPnl?: number | null;
  estimatedUnrealizedPnlPercent?: number | null;
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
