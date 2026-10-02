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
import {
  MoneyAccountGroupKey,
  MoneyAssetAllocationKey,
} from "@/modules/ledger/application";
import { FinancialAccountHero } from "@/shared/patterns/financial-account-hero";
import { CreditCardHero } from "@/app/[locale]/(product)/money/accounts/[id]/credit-card-hero";
import { MoneyPositionHero } from "@/app/[locale]/(product)/money/money-position-hero";
import { MoneyModuleRow } from "@/app/[locale]/(product)/money/money-module-section";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

vi.mock("@/i18n/navigation", () => ({
  Link: (linkProps: ComponentProps<"a"> & { prefetch?: boolean }) => {
    const { href, children, ...anchorProps } = linkProps;
    delete anchorProps.prefetch;
    return (
      <a href={href} {...anchorProps}>
        {children}
      </a>
    );
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const labels = {
  sectionTitle: "Accounts",
  sectionDescription: "4 accounts · 1 credit card",
  totalBalanceLabel: "₫1,200,000",
  creditCardType: "Credit card",
  outstanding: "Outstanding",
  accountsUnavailable: "Accounts unavailable",
  creditCardsUnavailable: "Credit cards unavailable",
  emptyTitle: "No accounts",
  emptyDescription: "Add an account.",
  viewAccounts: "View accounts",
  showAllAccounts: "Show all accounts",
  showFewerAccounts: "Show fewer accounts",
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

  it("masks Money hub credit outstanding while keeping its label visible", () => {
    window.localStorage.setItem("vinha.financial-values-hidden", "true");

    render(
      <FinancialPrivacyProvider>
        <MoneyPositionHero
          ownedMoneyLabel="Owned money"
          ownedMoneyValue="₫2,000,000"
          metaLine={
            <span>
              Card debt <FinancialValue>₫800,000</FinancialValue>
            </span>
          }
          allocationLabel="Asset allocation"
          allocation={[]}
          activityHref="/money/transactions"
          activityLabel="See activity"
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByText(/Card debt/)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("₫800,000");
    expect(document.body).toHaveTextContent("••••••");
  });

  it("masks the total asset allocation while keeping categories visible", () => {
    window.localStorage.setItem("vinha.financial-values-hidden", "true");

    render(
      <FinancialPrivacyProvider>
        <MoneyPositionHero
          ownedMoneyLabel="Money in active accounts"
          ownedMoneyValue="₫3,000,000"
          metaLine={<span>3 active accounts</span>}
          allocationLabel="Where your assets are"
          allocationHint="Across active accounts, savings, and valued investments."
          allocation={[
            {
              key: MoneyAssetAllocationKey.ACCOUNTS,
              label: "Accounts",
              balanceLabel: "₫1,000,000",
              percentage: 33,
              percentageLabel: "33%",
            },
            {
              key: MoneyAssetAllocationKey.SAVINGS,
              label: "Savings",
              balanceLabel: "₫2,000,000",
              percentage: 67,
              percentageLabel: "67%",
            },
          ]}
          activityHref="/money/transactions"
          activityLabel="View transactions"
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByText("Accounts")).toBeInTheDocument();
    expect(screen.getByText("Savings")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("₫3,000,000");
    expect(document.body).not.toHaveTextContent("₫1,000,000");
    expect(document.body).not.toHaveTextContent("₫2,000,000");
    expect(document.body).toHaveTextContent("••••••");
  });

  it("keeps an investment holdings count visible under privacy", () => {
    window.localStorage.setItem("vinha.financial-values-hidden", "true");

    render(
      <FinancialPrivacyProvider>
        <MoneyModuleRow
          href={APP_PATH.MONEY_INVESTMENTS}
          testId="money-link-investments"
          icon={FINANCE_ICONS.investment}
          iconTone={IconContainerTone.INVESTMENT}
          label="Investments"
          value={{ state: "count", label: "3 holdings" }}
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByTestId("money-link-investments")).toHaveTextContent(
      "3 holdings",
    );
    expect(screen.getByTestId("money-link-investments")).not.toHaveTextContent(
      "••••••",
    );
  });

  it("masks estimated investment value on a Money module row", () => {
    window.localStorage.setItem("vinha.financial-values-hidden", "true");

    render(
      <FinancialPrivacyProvider>
        <MoneyModuleRow
          href={APP_PATH.MONEY_INVESTMENTS}
          testId="money-link-investments"
          icon={FINANCE_ICONS.investment}
          iconTone={IconContainerTone.INVESTMENT}
          label="Investments"
          value={{
            state: "value",
            label: "₫12,000,000",
            kind: FinancialNumberKind.ESTIMATE,
          }}
          meta="3 holdings"
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByTestId("money-link-investments")).toHaveTextContent(
      "3 holdings",
    );
    expect(document.body).not.toHaveTextContent("₫12,000,000");
    expect(screen.getByTestId("money-link-investments")).toHaveAttribute(
      "href",
      APP_PATH.MONEY_INVESTMENTS,
    );
  });

  it("renders account and credit-card objects with distinct bounded semantics", () => {
    render(
      <MoneyAccountsScan
        labels={labels}
        accounts={[
          {
            key: MoneyAccountGroupKey.CASH,
            accounts: [
              {
                id: "cash-object",
                title: "Cash object",
                balanceLabel: "1,200,000 ₫",
                icon: FINANCE_ICONS.cash,
                iconTone: IconContainerTone.INCOME,
              },
            ],
          },
        ]}
        creditCards={[
          {
            id: "card-object",
            title: "Daily card",
            outstandingLabel: "800,000 ₫",
            utilizationLabel: "80% used",
          },
        ]}
      />,
    );

    expect(
      screen.getByTestId("money-account-object-collection"),
    ).toHaveAttribute("data-slot", "card");
    expect(screen.getByTestId("money-hub-credit-card-row")).toHaveTextContent(
      "Credit card",
    );
    expect(screen.getByTestId("money-hub-account-row")).toHaveAttribute(
      "href",
      "/money/accounts/cash-object",
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

  it("renders compact domain rows with the full account route available", () => {
    render(
      <MoneyAccountsScan
        labels={labels}
        accounts={[
          {
            key: MoneyAccountGroupKey.CASH,
            accounts: [account("Cash group", "1 ₫")],
          },
          {
            key: MoneyAccountGroupKey.BANK,
            accounts: [account("Bank group", "2 ₫")],
          },
        ]}
        creditCards={[]}
      />,
    );

    expect(screen.getAllByTestId("money-hub-account-row")).toHaveLength(2);
    expect(
      screen.queryByTestId("money-accounts-manage"),
    ).not.toBeInTheDocument();
  });

  it("keeps account and card failures visible as independent states", () => {
    render(
      <MoneyAccountsScan
        labels={{
          ...labels,
          accountsUnavailable: "Accounts unavailable",
          creditCardsUnavailable: "Credit cards unavailable",
        }}
        accounts={[]}
        creditCards={[]}
        accountsUnavailable
        creditCardsUnavailable
      />,
    );

    expect(screen.getByTestId("money-accounts-unavailable")).toHaveTextContent(
      "Accounts unavailable",
    );
    expect(
      screen.getByTestId("money-credit-cards-unavailable"),
    ).toHaveTextContent("Credit cards unavailable");
  });

  it("keeps empty account creation available beside the Accounts entry point", () => {
    render(
      <MoneyAccountsScan
        labels={labels}
        accounts={[]}
        creditCards={[]}
        emptyAction={<button type="button">Empty create</button>}
      />,
    );

    expect(screen.getByTestId("money-accounts-empty")).toBeInTheDocument();
    expect(screen.getByText("Empty create")).toBeInTheDocument();
    expect(screen.getByTestId("money-accounts-route-link")).toHaveAttribute(
      "href",
      APP_PATH.MONEY_ACCOUNTS,
    );
  });

  it("expands the account preview to the full inventory and can collapse it", () => {
    const accounts = [
      {
        key: MoneyAccountGroupKey.CASH,
        accounts: [
          {
            id: "cash-1",
            title: "Cash 1",
            balanceLabel: "1 ₫",
            icon: FINANCE_ICONS.cash,
            iconTone: IconContainerTone.INCOME,
          },
          {
            id: "cash-2",
            title: "Cash 2",
            balanceLabel: "2 ₫",
            icon: FINANCE_ICONS.cash,
            iconTone: IconContainerTone.INCOME,
          },
          {
            id: "cash-3",
            title: "Cash 3",
            balanceLabel: "3 ₫",
            icon: FINANCE_ICONS.cash,
            iconTone: IconContainerTone.INCOME,
          },
          {
            id: "cash-4",
            title: "Cash 4",
            balanceLabel: "4 ₫",
            icon: FINANCE_ICONS.cash,
            iconTone: IconContainerTone.INCOME,
          },
        ],
      },
    ];

    render(
      <MoneyAccountsScan
        labels={labels}
        accounts={accounts}
        allAccounts={[
          {
            ...accounts[0],
            accounts: [
              ...accounts[0].accounts,
              {
                id: "cash-5",
                title: "Cash 5",
                balanceLabel: "5 ₫",
                icon: FINANCE_ICONS.cash,
                iconTone: IconContainerTone.INCOME,
              },
            ],
          },
        ]}
        creditCards={[
          {
            id: "card-1",
            title: "Card 1",
            outstandingLabel: "1 ₫",
            utilizationLabel: "10% used",
          },
          {
            id: "card-2",
            title: "Card 2",
            outstandingLabel: "2 ₫",
            utilizationLabel: "20% used",
          },
        ]}
      />,
    );

    expect(screen.getAllByTestId("money-hub-account-row")).toHaveLength(4);
    expect(screen.queryByText("Cash 5")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("money-hub-credit-card-row")).toHaveLength(1);
    const toggle = screen.getByRole("button", { name: "Show all accounts" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(screen.getByText("Cash 5")).toBeInTheDocument();
    expect(screen.getAllByTestId("money-hub-account-row")).toHaveLength(5);
    expect(screen.getAllByTestId("money-hub-credit-card-row")).toHaveLength(2);
    const collapse = screen.getByRole("button", {
      name: "Show fewer accounts",
    });
    expect(collapse).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(collapse);
    expect(screen.getAllByTestId("money-hub-account-row")).toHaveLength(4);
    expect(screen.getAllByTestId("money-hub-credit-card-row")).toHaveLength(1);
  });
});
