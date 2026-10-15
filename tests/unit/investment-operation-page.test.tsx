import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvestmentOperationPage } from "@/app/[locale]/(product)/money/investments/investment-operation-page";
import {
  InvestmentAssetClass,
  InvestmentFormMode,
  InvestmentHistoryStatus,
  InvestmentLifecycleStatus,
  InvestmentValuationSource,
  InvestmentVisibilityContext,
} from "@/modules/investments/application/investment-constants";
import type { InvestmentHolding } from "@/modules/investments/application/investment-types";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";

const operationReads = vi.hoisted(() => ({
  getInvestmentHolding: vi.fn(),
  listInvestmentHoldingOptions: vi.fn(),
  listInvestmentPortfolio: vi.fn(),
  listAccounts: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({ Link: "a" }));

vi.mock("@/modules/investments/application", async () => {
  const { InvestmentFormMode } =
    await import("@/modules/investments/application/investment-constants");
  return { InvestmentFormMode, ...operationReads };
});

vi.mock("@/modules/ledger/application", () => ({
  listAccounts: operationReads.listAccounts,
}));

const HOLDING_ID = "holding-1";
const holding = {
  id: HOLDING_ID,
  householdId: "household-1",
  name: "FPT",
  symbol: "FPT",
  instrumentId: null,
  assetClass: InvestmentAssetClass.STOCK,
  providerCustodian: null,
  visibilityContext: InvestmentVisibilityContext.HOUSEHOLD,
  lifecycleStatus: InvestmentLifecycleStatus.ACTIVE,
  historyStatus: InvestmentHistoryStatus.FULL,
  quantity: "10",
  remainingTotalCostBasis: 1_000_000,
  currentValue: 1_200_000,
  currentValuationDate: null,
  currentValuationSource: InvestmentValuationSource.MANUAL,
  unrealizedResult: 200_000,
  notes: null,
  ownership: {
    financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
    ownerMembershipId: null,
    isPersonal: false,
    isOwnedByMe: false,
    canMutate: true,
    ownerStatus: OWNER_STATUS.ACTIVE,
  },
} satisfies InvestmentHolding;

describe("investment operation page read requirements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    operationReads.getInvestmentHolding.mockResolvedValue(holding);
    operationReads.listInvestmentHoldingOptions.mockResolvedValue([
      { id: HOLDING_ID, name: holding.name, symbol: holding.symbol },
    ]);
    operationReads.listInvestmentPortfolio.mockResolvedValue({
      holdings: [holding],
    });
    operationReads.listAccounts.mockResolvedValue({ accounts: [] });
  });

  it.each([InvestmentFormMode.BUY, InvestmentFormMode.SELL])(
    "loads selected holding, account and fee selector data for %s without the full portfolio",
    async (mode) => {
      await InvestmentOperationPage({ mode, holdingId: HOLDING_ID });

      expect(operationReads.getInvestmentHolding).toHaveBeenCalledWith(
        HOLDING_ID,
      );
      expect(
        operationReads.listInvestmentHoldingOptions,
      ).toHaveBeenCalledOnce();
      expect(operationReads.listAccounts).toHaveBeenCalledOnce();
      expect(operationReads.listInvestmentPortfolio).not.toHaveBeenCalled();
    },
  );

  it("loads only the selected holding for Update Price", async () => {
    await InvestmentOperationPage({
      mode: InvestmentFormMode.VALUATION,
      holdingId: HOLDING_ID,
    });

    expect(operationReads.getInvestmentHolding).toHaveBeenCalledWith(
      HOLDING_ID,
    );
    expect(operationReads.listInvestmentHoldingOptions).not.toHaveBeenCalled();
    expect(operationReads.listAccounts).not.toHaveBeenCalled();
    expect(operationReads.listInvestmentPortfolio).not.toHaveBeenCalled();
  });

  it.each([InvestmentFormMode.INCOME, InvestmentFormMode.CONVERSION])(
    "preserves the existing portfolio read for %s",
    async (mode) => {
      await InvestmentOperationPage({
        mode,
        ...(mode === InvestmentFormMode.INCOME
          ? { holdingId: HOLDING_ID }
          : {}),
      });

      expect(operationReads.listInvestmentPortfolio).toHaveBeenCalledOnce();
      expect(operationReads.listAccounts).toHaveBeenCalledOnce();
      expect(
        operationReads.listInvestmentHoldingOptions,
      ).not.toHaveBeenCalled();
    },
  );
});
