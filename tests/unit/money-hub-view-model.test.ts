import { describe, expect, it } from "vitest";
import {
  createMoneyHubViewModel,
  MoneyAccountGroupKey,
  MoneyCreditAttention,
} from "@/modules/ledger/application/money-hub-view-model";
import { AccountType } from "@/modules/ledger/application/ledger-constants";
import type { CreditCardSummary } from "@/modules/ledger/application/credit-card-types";
import type { RealPosition } from "@/modules/ledger/application/account-types";

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
    expect(viewModel.composition).toEqual([
      {
        key: MoneyAccountGroupKey.CASH,
        balance: 110,
        share: 1,
        percentage: 100,
        isLessThanOnePercent: false,
      },
    ]);
  });

  it("rounds distribution percentages to exactly 100 points", () => {
    const viewModel = createMoneyHubViewModel({
      position: position([
        {
          id: "cash-1",
          name: "Cash",
          type: AccountType.CASH,
          balance: 1,
          isArchived: false,
        },
        {
          id: "bank-1",
          name: "Bank",
          type: AccountType.CHECKING,
          balance: 1,
          isArchived: false,
        },
        {
          id: "wallet-1",
          name: "Wallet",
          type: AccountType.EWALLET,
          balance: 1,
          isArchived: false,
        },
      ]),
      creditCards: [],
    });

    expect(viewModel.composition.map((segment) => segment.percentage)).toEqual([
      34, 33, 33,
    ]);
    expect(
      viewModel.composition.reduce(
        (sum, segment) => sum + segment.percentage,
        0,
      ),
    ).toBe(100);
    expect(viewModel.composition[1]).toMatchObject({
      percentage: 33,
      isLessThanOnePercent: false,
    });
  });

  it("marks a positive tiny balance as less than one percent", () => {
    const viewModel = createMoneyHubViewModel({
      position: position([
        {
          id: "cash-1",
          name: "Cash",
          type: AccountType.CASH,
          balance: 1000,
          isArchived: false,
        },
        {
          id: "bank-1",
          name: "Bank",
          type: AccountType.CHECKING,
          balance: 1,
          isArchived: false,
        },
      ]),
      creditCards: [],
    });

    expect(viewModel.composition[1]).toMatchObject({
      key: MoneyAccountGroupKey.BANK,
      percentage: 0,
      isLessThanOnePercent: true,
    });
  });

  it("omits composition when no positive owned balance exists", () => {
    const viewModel = createMoneyHubViewModel({
      position: position([
        {
          id: "cash-1",
          name: "Cash",
          type: AccountType.CASH,
          balance: 0,
          isArchived: false,
        },
      ]),
      creditCards: [],
    });

    expect(viewModel.composition).toEqual([]);
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
});
