import { describe, expect, it } from "vitest";
import {
  calculateMoneyAssetOverview,
  createMoneyHubViewModel,
  createMoneyHubModuleSummaries,
  MoneyAccountGroupKey,
  MoneyAssetAllocationKey,
  MoneyAssetOverviewStatus,
  MoneyCreditAttention,
} from "@/modules/ledger/application/money-hub-view-model";
import { AccountType } from "@/modules/ledger/application/ledger-constants";
import type { CreditCardSummary } from "@/modules/ledger/application/credit-card-types";
import type { RealPosition } from "@/modules/ledger/application/account-types";
import { InvestmentHomeValuationQuality } from "@/modules/investments/application";

function position(accounts: RealPosition["accounts"]): RealPosition {
  return {
    householdId: "household-1",
    currency: "VND",
    totalBalance: accounts.reduce((sum, account) => sum + account.balance, 0),
    accounts,
  };
}

function creditCard(
  overrides: Partial<CreditCardSummary> = {},
): CreditCardSummary {
  return {
    accountId: "card-1",
    name: "Daily card",
    type: AccountType.CREDIT_CARD,
    creditLimit: 100,
    statementDay: 25,
    dueDay: 15,
    linkedBankAccountId: null,
    outstanding: 80,
    nextDueRemaining: 80,
    availableCredit: 20,
    utilizationPct: 80,
    nextDueDate: null,
    ...overrides,
  };
}

describe("createMoneyHubViewModel", () => {
  it("counts only active, real asset accounts as owned money", () => {
    const viewModel = createMoneyHubViewModel({
      position: position([
        {
          id: "cash-1",
          name: "Wallet",
          type: AccountType.CASH,
          balance: 100,
          isArchived: false,
        },
        {
          id: "bank-1",
          name: "Bank",
          type: AccountType.CHECKING,
          balance: 50,
          isArchived: false,
        },
        {
          id: "archived-cash-1",
          name: "Archived cash",
          type: AccountType.CASH,
          balance: 75,
          isArchived: true,
        },
        {
          id: "card-1",
          name: "Card",
          type: AccountType.CREDIT_CARD,
          balance: 1_000,
          isArchived: false,
        },
        {
          id: "savings-product-1",
          name: "Term deposit",
          type: AccountType.SAVINGS_PRODUCT,
          balance: 500,
          isArchived: false,
        },
      ]),
      creditCards: [creditCard()],
    });

    expect(viewModel.totalOwnedBalance).toBe(150);
    expect(viewModel.activeAccountCount).toBe(2);
    expect(viewModel.totalCreditOutstanding).toBe(80);
    expect(viewModel.accountGroups.map((group) => group.key)).toEqual([
      MoneyAccountGroupKey.CASH,
      MoneyAccountGroupKey.BANK,
    ]);
  });

  it("groups accounts deterministically and uses a flat presentation for one group", () => {
    const viewModel = createMoneyHubViewModel({
      position: position([
        {
          id: "cash-small",
          name: "Small cash",
          type: AccountType.CASH,
          balance: 10,
          isArchived: false,
        },
        {
          id: "cash-large",
          name: "Large cash",
          type: AccountType.CASH,
          balance: 100,
          isArchived: false,
        },
      ]),
      creditCards: [],
    });

    expect(viewModel.accountPresentation).toBe("flat");
    expect(
      viewModel.accountGroups[0]?.accounts.map((account) => account.id),
    ).toEqual(["cash-large", "cash-small"]);
  });

  it("exposes only the initial account rows until the user expands a long list", () => {
    const accounts = Array.from({ length: 5 }, (_, index) => ({
      id: `cash-${index}`,
      name: `Cash ${index}`,
      type: AccountType.CASH,
      balance: index + 1,
      isArchived: false,
    }));
    const viewModel = createMoneyHubViewModel({
      position: position(accounts),
      creditCards: [],
    });

    expect(viewModel.hasMoreAccounts).toBe(true);
    expect(viewModel.initialAccountGroups[0]?.accounts).toHaveLength(4);
  });

  it("suppresses utilization when a card has no valid credit limit", () => {
    const viewModel = createMoneyHubViewModel({
      position: position([]),
      creditCards: [
        creditCard({
          creditLimit: 0,
          outstanding: 25,
          availableCredit: 0,
          utilizationPct: 100,
        }),
      ],
    });

    expect(viewModel.creditCards[0]).toMatchObject({
      utilizationForDisplay: null,
      progressValue: null,
      attention: null,
    });
  });

  it("prioritizes an overdue card state over high utilization", () => {
    const viewModel = createMoneyHubViewModel({
      position: position([]),
      creditCards: [creditCard({ nextDueDate: "2026-08-01" })],
      today: new Date("2026-08-13T12:00:00Z"),
    });

    expect(viewModel.creditCards[0]?.attention).toBe(
      MoneyCreditAttention.OVERDUE,
    );
  });

  it("marks a high-utilization card when no payment is currently due", () => {
    const viewModel = createMoneyHubViewModel({
      position: position([]),
      creditCards: [creditCard()],
      today: new Date("2026-08-13T12:00:00Z"),
    });

    expect(viewModel.creditCards[0]?.attention).toBe(
      MoneyCreditAttention.HIGH_UTILIZATION,
    );
  });

  it("compares due dates by UTC calendar day, independent of local timezone", () => {
    const viewModel = createMoneyHubViewModel({
      position: position([]),
      creditCards: [creditCard({ nextDueDate: "2026-08-02" })],
      today: new Date("2026-08-01T23:30:00-08:00"),
    });

    expect(viewModel.creditCards[0]?.attention).toBe(
      MoneyCreditAttention.DUE_SOON,
    );
  });

  it("keeps unknown investment valuation indeterminate", () => {
    const summary = createMoneyHubModuleSummaries({
      savings: null,
      investments: {
        activeCount: 2,
        marketValue: null,
        valuationQuality: InvestmentHomeValuationQuality.UNKNOWN,
        valuationIncluded: 0,
        valuationTotal: 2,
      },
      loans: null,
      debts: null,
    });

    expect(summary.investments).toMatchObject({
      loaded: true,
      count: 2,
      total: null,
      valuationQuality: InvestmentHomeValuationQuality.UNKNOWN,
      valuationCoverage: { included: 0, total: 2 },
    });
  });

  it("preserves a partial estimated market value and coverage", () => {
    const summary = createMoneyHubModuleSummaries({
      savings: null,
      investments: {
        activeCount: 3,
        marketValue: 120,
        valuationQuality: InvestmentHomeValuationQuality.PARTIAL,
        valuationIncluded: 2,
        valuationTotal: 3,
      },
      loans: null,
      debts: null,
    });

    expect(summary.investments).toMatchObject({
      total: 120,
      valuationQuality: InvestmentHomeValuationQuality.PARTIAL,
      valuationCoverage: { included: 2, total: 3 },
    });
  });

  it("calculates complete asset totals and allocation percentages", () => {
    const overview = calculateMoneyAssetOverview({
      accounts: 100,
      savings: 50,
      investments: {
        amount: 50,
        valuationIncluded: 2,
        valuationTotal: 2,
      },
    });

    expect(overview).toEqual({
      status: MoneyAssetOverviewStatus.COMPLETE,
      total: 200,
      investmentCoverage: { included: 2, total: 2 },
      allocation: [
        {
          key: MoneyAssetAllocationKey.ACCOUNTS,
          amount: 100,
          share: 0.5,
          percentage: 50,
          isLessThanOnePercent: false,
        },
        {
          key: MoneyAssetAllocationKey.SAVINGS,
          amount: 50,
          share: 0.25,
          percentage: 25,
          isLessThanOnePercent: false,
        },
        {
          key: MoneyAssetAllocationKey.INVESTMENTS,
          amount: 50,
          share: 0.25,
          percentage: 25,
          isLessThanOnePercent: false,
        },
      ],
    });
  });

  it("keeps an account-only total complete when no products exist", () => {
    const overview = calculateMoneyAssetOverview({
      accounts: 100,
      savings: 0,
      investments: {
        amount: null,
        valuationIncluded: 0,
        valuationTotal: 0,
      },
    });

    expect(overview).toMatchObject({
      status: MoneyAssetOverviewStatus.COMPLETE,
      total: 100,
      allocation: [
        expect.objectContaining({
          key: MoneyAssetAllocationKey.ACCOUNTS,
          percentage: 100,
        }),
      ],
    });
  });

  it("rounds asset allocation percentages to exactly 100 points", () => {
    const overview = calculateMoneyAssetOverview({
      accounts: 1,
      savings: 1,
      investments: {
        amount: 1,
        valuationIncluded: 1,
        valuationTotal: 1,
      },
    });

    expect(
      overview.status === MoneyAssetOverviewStatus.UNAVAILABLE
        ? []
        : overview.allocation.map((segment) => segment.percentage),
    ).toEqual([34, 33, 33]);
    expect(
      overview.status === MoneyAssetOverviewStatus.UNAVAILABLE
        ? 0
        : overview.allocation.reduce(
            (sum, segment) => sum + segment.percentage,
            0,
          ),
    ).toBe(100);
  });

  it("marks a partial investment valuation without inventing an unknown slice", () => {
    const overview = calculateMoneyAssetOverview({
      accounts: 100,
      savings: 50,
      investments: {
        amount: 50,
        valuationIncluded: 1,
        valuationTotal: 2,
      },
    });

    expect(overview).toMatchObject({
      status: MoneyAssetOverviewStatus.PARTIAL,
      total: 200,
      investmentCoverage: { included: 1, total: 2 },
    });
    expect(
      overview.status === MoneyAssetOverviewStatus.UNAVAILABLE
        ? []
        : overview.allocation.reduce(
            (sum, segment) => sum + segment.percentage,
            0,
          ),
    ).toBe(100);
  });

  it("makes the asset overview unavailable when a required value is missing", () => {
    expect(
      calculateMoneyAssetOverview({
        accounts: 100,
        savings: null,
        investments: {
          amount: 50,
          valuationIncluded: 1,
          valuationTotal: 1,
        },
      }),
    ).toEqual({ status: MoneyAssetOverviewStatus.UNAVAILABLE });

    expect(
      calculateMoneyAssetOverview({
        accounts: 100,
        savings: 50,
        investments: {
          amount: null,
          valuationIncluded: 0,
          valuationTotal: 2,
        },
      }),
    ).toEqual({ status: MoneyAssetOverviewStatus.UNAVAILABLE });
  });
});
