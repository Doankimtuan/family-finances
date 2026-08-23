import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MoneyAccountsScan } from "@/app/[locale]/(product)/money/money-accounts-scan";
import { AccountCard } from "@/modules/ledger/ui/account-card";
import { CreditCardCard } from "@/modules/ledger/ui/credit-card-card";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";
import { MoneyAccountGroupKey } from "@/modules/ledger/application";
import { FinancialAccountHero } from "@/shared/patterns/financial-account-hero";
import { CreditCardHero } from "@/app/[locale]/(product)/money/accounts/[id]/credit-card-hero";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const labels = {
  sectionTitle: "Accounts",
  groupTitles: {
    cash: "Cash",
    bank: "Bank",
    wallet: "E-wallet",
    savings: "Savings",
    investment: "Investments",
    other: "Other",
  },
  creditCardsTitle: "Credit cards",
  creditCardType: "Credit card",
  creditCardsHint: "Credit values stay separate.",
  outstanding: "Outstanding",
  availableCredit: "Available credit",
  creditLimit: "Credit limit",
  emptyTitle: "No accounts",
  emptyDescription: "Add an account.",
  showAll: "See all accounts",
  showLess: "Show fewer accounts",
  attentionLabels: {
    overdue: "Overdue",
    due_soon: "Due soon",
    high_utilization: "High use",
  },
} as const;

function account(id: string, balanceLabel: string) {
  return {
    id,
    title: id,
    typeLabel: "Cash",
    balanceCaption: "Balance",
    balanceLabel,
    icon: FINANCE_ICONS.cash,
    iconTone: "income" as const,
    financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
    isOwnedByMe: false,
    ownerStatus: OWNER_STATUS.ACTIVE,
  };
}

describe("Money IA and financial privacy", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("masks account and credit-card monetary leaves without hiding identity", () => {
    window.localStorage.setItem("vinha.financial-values-hidden", "true");

    render(
      <FinancialPrivacyProvider>
        <AccountCard
          title="Daily cash"
          typeLabel="Cash"
          balanceLabel="1,200,000 ₫"
        />
        <CreditCardCard
          title="Daily card"
          outstandingCaption="Outstanding"
          outstandingLabel="800,000 ₫"
          availableCaption="Available credit"
          availableLabel="200,000 ₫"
          limitCaption="Credit limit"
          limitLabel="1,000,000 ₫"
          utilizationPct={80}
          utilizationLabel="80% used"
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByText("Daily cash")).toBeInTheDocument();
    expect(screen.getByText("Daily card")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("1,200,000 ₫");
    expect(document.body).not.toHaveTextContent("800,000 ₫");
    expect(document.body).not.toHaveTextContent("200,000 ₫");
    expect(document.body).not.toHaveTextContent("1,000,000 ₫");
    expect(document.querySelector('[aria-label*="1,200,000"]')).toBeNull();
  });

  it("keeps detail balance and card debt semantics privacy-safe", () => {
    window.localStorage.setItem("vinha.financial-values-hidden", "true");

    render(
      <FinancialPrivacyProvider>
        <FinancialAccountHero
          icon={FINANCE_ICONS.cash}
          amountLabel="₫1,200,000"
          amountCaption="Balance"
        />
        <CreditCardHero
          title="Daily card"
          outstandingLabel="₫800,000"
          outstandingCaption="Outstanding"
          utilizationPct={80}
          utilizationLabel="80% used"
          availableLabel="₫200,000"
          availableCaption="Available credit"
          limitLabel="₫1,000,000"
          limitCaption="Credit limit"
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("Outstanding")).toBeInTheDocument();
    expect(screen.getByText("Available credit")).toBeInTheDocument();
    expect(screen.getByText("Credit limit")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("₫1,200,000");
    expect(document.body).not.toHaveTextContent("₫800,000");
  });

  it("renders account and credit-card objects with distinct bounded semantics", () => {
    render(
      <MoneyAccountsScan
        labels={labels}
        accountGroups={[
          {
            key: MoneyAccountGroupKey.CASH,
            accounts: [account("Cash object", "1,200,000 ₫")],
          },
        ]}
        initialAccountGroups={[
          {
            key: MoneyAccountGroupKey.CASH,
            accounts: [account("Cash object", "1,200,000 ₫")],
          },
        ]}
        accountPresentation="flat"
        hasMoreAccounts={false}
        creditCards={[
          {
            id: "card-object",
            title: "Daily card",
            outstandingLabel: "800,000 ₫",
            availableLabel: "200,000 ₫",
            limitLabel: "1,000,000 ₫",
            utilizationPct: 80,
            utilizationLabel: "80% used",
            utilizationAriaLabel: "80% of the card credit limit used",
          },
        ]}
        createAction={<button type="button">Add account</button>}
      />,
    );

    expect(
      screen.getByTestId("money-account-object-collection"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("account-card")).toHaveAttribute(
      "data-surface",
      "soft-bounded",
    );
    expect(screen.getByTestId("account-card")).toHaveAttribute(
      "data-financial-object",
      "account",
    );
    expect(screen.getByTestId("credit-card-card")).toHaveAttribute(
      "data-financial-object",
      "credit-card",
    );
    expect(screen.getByTestId("credit-card-card")).toHaveTextContent(
      "Credit card",
    );
    expect(screen.getByTestId("money-hub-account-row")).toHaveAttribute(
      "href",
      "/money/accounts/Cash object",
    );
  });

  it("keeps long account identity and balance content in the same object", () => {
    render(
      <AccountCard
        title="Household emergency cash reserve"
        typeLabel="Cash"
        balanceCaption="Balance"
        balanceLabel="₫999,999,999,999"
      />,
    );

    expect(
      screen.getByText("Household emergency cash reserve"),
    ).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("₫999,999,999,999")).toBeInTheDocument();
  });

  it("does not repeat an account name as its supporting type label", () => {
    render(
      <AccountCard
        title="Cash"
        typeLabel="Cash"
        balanceCaption="Balance"
        balanceLabel="₫500,000"
      />,
    );

    expect(screen.getAllByText("Cash")).toHaveLength(1);
  });

  it("allows long card identities to wrap and keeps the account hero amount readable", () => {
    const longCardName = "Household travel and emergency credit card";

    render(
      <>
        {/* Account identity lives in the screen header; the hero carries the balance. */}
        <FinancialAccountHero
          icon={FINANCE_ICONS.cash}
          amountLabel="₫9,999,999,999"
          amountCaption="Balance"
        />
        <CreditCardHero
          title={longCardName}
          outstandingLabel="₫9,999,999,999"
          outstandingCaption="Outstanding"
          utilizationPct={80}
          utilizationLabel="80% used"
          availableLabel="₫1,999,999,999"
          availableCaption="Available credit"
          limitLabel="₫11,999,999,999"
          limitCaption="Credit limit"
        />
      </>,
    );

    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getAllByText("₫9,999,999,999").length).toBeGreaterThan(0);
    expect(screen.getByText(longCardName)).toHaveClass("break-words");
  });

  it("keeps domain-backed group headings above account objects", () => {
    render(
      <MoneyAccountsScan
        labels={labels}
        accountGroups={[
          {
            key: MoneyAccountGroupKey.CASH,
            accounts: [account("Cash group", "1 ₫")],
          },
          {
            key: MoneyAccountGroupKey.BANK,
            accounts: [account("Bank group", "2 ₫")],
          },
        ]}
        initialAccountGroups={[
          {
            key: MoneyAccountGroupKey.CASH,
            accounts: [account("Cash group", "1 ₫")],
          },
          {
            key: MoneyAccountGroupKey.BANK,
            accounts: [account("Bank group", "2 ₫")],
          },
        ]}
        accountPresentation="grouped"
        hasMoreAccounts={false}
        creditCards={[]}
        createAction={<button type="button">Add account</button>}
      />,
    );

    expect(screen.getAllByTestId("money-account-group-title")).toHaveLength(2);
    expect(screen.getAllByTestId("account-card")).toHaveLength(2);
  });

  it("expands the full account dataset inline and collapses it in place", () => {
    const groups = [
      {
        key: MoneyAccountGroupKey.CASH,
        accounts: [
          account("Cash 1", "1 ₫"),
          account("Cash 2", "2 ₫"),
          account("Cash 3", "3 ₫"),
          account("Cash 4", "4 ₫"),
          account("Cash 5", "5 ₫"),
        ],
      },
    ];

    render(
      <MoneyAccountsScan
        labels={labels}
        accountGroups={groups}
        initialAccountGroups={[
          { ...groups[0], accounts: groups[0].accounts.slice(0, 4) },
        ]}
        accountPresentation="flat"
        hasMoreAccounts
        creditCards={[]}
        createAction={<button type="button">Add account</button>}
      />,
    );

    expect(screen.queryByText("Cash 5")).not.toBeInTheDocument();
    const expand = screen.getByTestId("money-accounts-show-all");
    expect(expand).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(expand);
    expect(screen.getByText("Cash 5")).toBeInTheDocument();
    expect(expand).toHaveTextContent("Show fewer accounts");
    expect(expand).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(expand);
    expect(screen.queryByText("Cash 5")).not.toBeInTheDocument();
    expect(expand).toHaveAttribute("aria-expanded", "false");
  });
});
