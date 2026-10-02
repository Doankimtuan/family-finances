import type { ComponentProps } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InvestmentsPage from "@/app/[locale]/(product)/money/investments/page";
import InvestmentsOverviewPage from "@/app/[locale]/(product)/money/investments/overview/page";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en/money.json";
import viMessages from "@/messages/vi/money.json";
import { InvestmentsOverview } from "@/app/[locale]/(product)/money/investments/overview/investments-overview";
import {
  InvestmentAssetClass,
  InvestmentHistoryStatus,
  InvestmentLifecycleStatus,
  InvestmentVisibilityContext,
} from "@/modules/investments/application/investment-constants";
import type {
  InvestmentHolding,
  InvestmentPortfolio,
} from "@/modules/investments/application/investment-types";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";
import {
  APP_PATH,
  moneyInvestmentPath,
} from "@/modules/tenancy/application/app-path";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { FINANCIAL_PRIVACY_MASK } from "@/shared/constants/financial-privacy";
import { APP_LOCALE, type AppLocale } from "@/i18n/routing";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/i18n/set-locale", () => ({ setLocale: vi.fn() }));
vi.mock("@/modules/tenancy/application/get-session-user", () => ({
  getSessionUser: async () => ({ id: "user" }),
}));
vi.mock("@/modules/tenancy/application/resolve-active-membership", () => ({
  resolveActiveMembership: async () => ({ id: "member" }),
}));
vi.mock("@/modules/investments/application", () => ({
  listInvestmentListPortfolio: async () => portfolio,
}));
vi.mock("@/app/[locale]/(product)/money/money-offline-banner", () => ({
  MoneyOfflineBanner: () => null,
}));
vi.mock("@/shared/patterns/top-app-bar", () => ({
  TopAppBar: ({
    title,
    trailing,
  }: ComponentProps<
    typeof import("@/shared/patterns/top-app-bar").TopAppBar
  >) => (
    <header>
      {title}
      {trailing}
    </header>
  ),
}));
const stock: InvestmentHolding = {
  id: "stock",
  householdId: "household",
  name: "Example stock",
  symbol: "EXM",
  instrumentId: null,
  assetClass: InvestmentAssetClass.STOCK,
  providerCustodian: "Custodian",
  visibilityContext: InvestmentVisibilityContext.HOUSEHOLD,
  lifecycleStatus: InvestmentLifecycleStatus.ACTIVE,
  historyStatus: InvestmentHistoryStatus.FULL,
  quantity: "10",
  remainingTotalCostBasis: 900_000,
  currentValue: 1_000_000,
  currentValuationDate: null,
  currentValuationSource: null,
  unrealizedResult: 100_000,
  estimatedUnrealizedPnlPercent: 0.111,
  notes: null,
  ownership: {
    financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
    ownerMembershipId: null,
    isPersonal: false,
    isOwnedByMe: false,
    canMutate: true,
    ownerStatus: OWNER_STATUS.ACTIVE,
  },
};
const unknown: InvestmentHolding = {
  ...stock,
  id: "unknown",
  name: "Unpriced fund",
  assetClass: InvestmentAssetClass.FUND,
  currentValue: null,
  remainingTotalCostBasis: null,
  unrealizedResult: null,
  estimatedUnrealizedPnlPercent: null,
  historyStatus: InvestmentHistoryStatus.COST_BASIS_UNKNOWN,
};
const closed: InvestmentHolding = {
  ...stock,
  id: "closed",
  name: "Settled holding",
  lifecycleStatus: InvestmentLifecycleStatus.EXITED,
};
const portfolio: InvestmentPortfolio = {
  holdings: [stock, unknown, closed],
  activeHoldings: [stock, unknown],
  closedHoldings: [closed],
  incompleteBasisCount: 1,
  closedPositionCount: 1,
  totalCurrentValue: 1_000_000,
  totalRemainingCostBasis: 900_000,
  unrealizedResult: 100_000,
  realizedSaleResult: 0,
  investmentIncome: 0,
  investmentFees: 0,
  valuationCoverage: { included: 1, total: 2 },
  basisCoverage: { included: 1, total: 2 },
  allocationByAssetClass: [
    {
      assetClass: InvestmentAssetClass.STOCK,
      valueVnd: 1_000_000,
      shareBasisPoints: 10_000,
    },
  ],
};
function renderOverview(locale: AppLocale = APP_LOCALE.ENGLISH) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={{
        money: locale === APP_LOCALE.VIETNAMESE ? viMessages : enMessages,
      }}
    >
      <FinancialPrivacyProvider>
        <InvestmentsOverview portfolio={portfolio} locale={locale} />
      </FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

describe("Stitch investments overview", () => {
  it("serves the Stitch UI on the canonical investments route and its overview alias", async () => {
    expect(InvestmentsOverviewPage).toBe(InvestmentsPage);
    const page = await InvestmentsPage({
      params: Promise.resolve({ locale: APP_LOCALE.ENGLISH }),
    });
    render(
      <NextIntlClientProvider
        locale={APP_LOCALE.ENGLISH}
        messages={{ money: enMessages }}
      >
        <FinancialPrivacyProvider>{page}</FinancialPrivacyProvider>
      </NextIntlClientProvider>,
    );
    expect(screen.getByTestId("money-investments")).toBeVisible();
    expect(screen.getByTestId("investment-overview-summary")).toBeVisible();
    expect(screen.getByRole("link", { name: "add" })).toHaveAttribute(
      "href",
      APP_PATH.MONEY_INVESTMENTS_NEW,
    );
    expect(
      screen.queryByTestId("investment-overview-client"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("money-capture")).not.toBeInTheDocument();
  });
  it("filters and searches real holdings, and switches to settled holdings", () => {
    renderOverview();
    expect(screen.getByRole("link", { name: /Example stock/ })).toHaveAttribute(
      "href",
      moneyInvestmentPath(stock.id),
    );
    fireEvent.click(screen.getByRole("button", { name: "Funds (1)" }));
    expect(
      screen.queryByRole("link", { name: /Example stock/ }),
    ).not.toBeInTheDocument();
    const fund = screen.getByRole("link", { name: /Unpriced fund/ });
    expect(
      within(fund).getAllByText(
        enMessages.investments.overview.unknownValue,
      )[0],
    ).toBeVisible();
    expect(
      within(fund).getByText(enMessages.investments.overview.insufficientData),
    ).toBeVisible();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "missing" },
    });
    expect(
      screen.getByText(enMessages.investments.overview.noFilteredResults),
    ).toBeVisible();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Settled 1/ }));
    expect(screen.getByRole("link", { name: /Settled holding/ })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /Unpriced fund/ }),
    ).not.toBeInTheDocument();
  });
  it("shows safety coverage, policy navigation, and masks amounts", () => {
    renderOverview();
    expect(
      screen.getByTestId("investment-overview-not-cash"),
    ).toHaveTextContent(enMessages.investments.stitchOverview.notCash);
    expect(screen.getByText(/Value includes 1 of 2/)).toBeVisible();
    expect(screen.getByRole("link", { name: /View policies/ })).toHaveAttribute(
      "href",
      APP_PATH.POLICIES,
    );
    fireEvent.click(screen.getByTestId("investment-overview-privacy"));
    expect(screen.getByTestId("investment-overview-total")).toHaveTextContent(
      FINANCIAL_PRIVACY_MASK,
    );
    fireEvent.click(screen.getByTestId("investment-overview-privacy"));
  });
  it("renders the Vietnamese copy", () => {
    renderOverview(APP_LOCALE.VIETNAMESE);
    expect(
      screen.getByRole("heading", {
        name: viMessages.investments.stitchOverview.rulesTitle,
      }),
    ).toBeVisible();
    expect(
      screen.getByTestId("investment-overview-not-cash"),
    ).toHaveTextContent(viMessages.investments.stitchOverview.notCash);
  });
});
