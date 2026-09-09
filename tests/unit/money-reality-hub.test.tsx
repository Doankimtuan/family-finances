import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MoneyAccountsScan } from "@/app/[locale]/(product)/money/money-accounts-scan";
import { MoneyModuleRow } from "@/app/[locale]/(product)/money/money-module-section";
import { MoneyPositionHero } from "@/app/[locale]/(product)/money/money-position-hero";
import {
  MoneyAccountGroupKey,
  MoneyAssetAllocationKey,
} from "@/modules/ledger/application";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";

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
  sectionDescription: "Scan usable money.",
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
  creditCardsHint: "Money owed on cards.",
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

describe("Money financial reality hub", () => {
  it("stamps the hero as current-state accessible money and allocation estimates separately", () => {
    render(
      <MoneyPositionHero
        ownedMoneyLabel="Money in active accounts"
        ownedMoneyHint="Not investments or Plan envelopes."
        ownedMoneyValue="₫3,000,000"
        positionUnavailableLabel="Unavailable"
        heroAccessibleLabel="Accessible money in active accounts"
        metaLine={<span>2 active accounts</span>}
        allocationLabel="Where these resources sit"
        allocation={[
          {
            key: MoneyAssetAllocationKey.ACCOUNTS,
            label: "Accounts",
            balanceLabel: "₫2,000,000",
            percentage: 67,
            percentageLabel: "67%",
          },
          {
            key: MoneyAssetAllocationKey.INVESTMENTS,
            label: "Investments (estimated)",
            balanceLabel: "₫1,000,000",
            percentage: 33,
            percentageLabel: "33%",
          },
        ]}
        activityHref={APP_PATH.MONEY_TRANSACTIONS}
        activityLabel="View transactions"
      />,
    );

    expect(
      screen.getByRole("group", {
        name: "Accessible money in active accounts",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("ledger-balance")).toHaveAttribute(
      "data-financial-kind",
      FinancialNumberKind.CURRENT_STATE,
    );
    expect(
      screen.getByText("Not investments or Plan envelopes."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("money-see-activity")).toHaveAttribute(
      "href",
      APP_PATH.MONEY_TRANSACTIONS,
    );

    const estimated = screen
      .getByTestId("money-asset-allocation-legend")
      .querySelector(`[data-financial-kind="${FinancialNumberKind.ESTIMATE}"]`);
    expect(estimated).toHaveTextContent("₫1,000,000");
  });

  it("keeps an empty Money inventory actionable without a fake balance", () => {
    render(
      <MoneyAccountsScan
        labels={labels}
        accountGroups={[]}
        initialAccountGroups={[]}
        accountPresentation="flat"
        hasMoreAccounts={false}
        creditCards={[]}
        createAction={<button type="button">Header create</button>}
        emptyAction={<button type="button">Add account</button>}
      />,
    );

    expect(screen.getByTestId("money-accounts-empty")).toHaveTextContent(
      "No accounts",
    );
    expect(screen.getByText("Add account")).toBeInTheDocument();
    expect(screen.queryByTestId("ledger-balance")).not.toBeInTheDocument();
  });

  it("does not present credit outstanding as a ledger Balance", () => {
    render(
      <MoneyAccountsScan
        labels={labels}
        accountGroups={[
          {
            key: MoneyAccountGroupKey.CASH,
            accounts: [
              {
                id: "cash-1",
                title: "Daily cash",
                typeLabel: "Cash",
                balanceCaption: "Balance",
                balanceLabel: "₫1,200,000",
                icon: FINANCE_ICONS.cash,
                iconTone: IconContainerTone.INCOME,
                financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
                isOwnedByMe: false,
                ownerStatus: OWNER_STATUS.ACTIVE,
              },
            ],
          },
        ]}
        initialAccountGroups={[
          {
            key: MoneyAccountGroupKey.CASH,
            accounts: [
              {
                id: "cash-1",
                title: "Daily cash",
                typeLabel: "Cash",
                balanceCaption: "Balance",
                balanceLabel: "₫1,200,000",
                icon: FINANCE_ICONS.cash,
                iconTone: IconContainerTone.INCOME,
                financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
                isOwnedByMe: false,
                ownerStatus: OWNER_STATUS.ACTIVE,
              },
            ],
          },
        ]}
        accountPresentation="flat"
        hasMoreAccounts={false}
        creditCards={[
          {
            id: "card-1",
            title: "Daily card",
            outstandingLabel: "₫800,000",
            availableLabel: "₫200,000",
            limitLabel: "₫1,000,000",
            utilizationPct: 80,
            utilizationLabel: "80% used",
            utilizationAriaLabel: "80% of the card credit limit used",
          },
        ]}
        createAction={<button type="button">Add account</button>}
      />,
    );

    expect(screen.getByTestId("account-card-balance")).toHaveTextContent(
      "₫1,200,000",
    );
    expect(screen.getByTestId("credit-card-card")).toHaveTextContent(
      "Outstanding",
    );
    expect(
      screen
        .getByTestId("credit-card-card")
        .querySelector(
          `[data-financial-kind="${FinancialNumberKind.CURRENT_STATE}"]`,
        ),
    ).toBeTruthy();
    expect(screen.getByText("Money owed on cards.")).toBeInTheDocument();
    expect(
      screen.getByTestId("money-hub-credit-card-row"),
    ).not.toHaveTextContent("Daily cash");
  });

  it("stamps investment module values as estimates", () => {
    render(
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
        meta="2 holdings"
      />,
    );

    expect(
      screen
        .getByTestId("money-link-investments")
        .querySelector(
          `[data-financial-kind="${FinancialNumberKind.ESTIMATE}"]`,
        ),
    ).toHaveTextContent("₫12,000,000");
    expect(screen.getByTestId("money-link-investments")).toHaveAttribute(
      "href",
      APP_PATH.MONEY_INVESTMENTS,
    );
  });
});
