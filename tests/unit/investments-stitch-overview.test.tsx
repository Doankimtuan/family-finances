import type { ComponentProps } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InvestmentsPage from "@/app/[locale]/(product)/money/investments/page";
import InvestmentsOverviewPage from "@/app/[locale]/(product)/money/investments/overview/page";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en/money.json";
import viMessages from "@/messages/vi/money.json";
import { InvestmentsOverview } from "@/app/[locale]/(product)/money/investments/overview/investments-overview";
import {
  InvestmentAssetClass,
  InvestmentHoldingsTab,
  InvestmentHistoryStatus,
  InvestmentOverviewFilter,
  InvestmentLifecycleStatus,
  InvestmentVisibilityContext,
  INVESTMENT_LIST_QUERY_PARAM,
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
import { SHELL_SCROLL_REGION_SLOT } from "@/shared/patterns/shell-scroll-region";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

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
function renderOverview(
  locale: AppLocale = APP_LOCALE.ENGLISH,
  currentPortfolio: InvestmentPortfolio = portfolio,
) {
  const tree = () => (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        money: locale === APP_LOCALE.VIETNAMESE ? viMessages : enMessages,
      }}
    >
      <FinancialPrivacyProvider>
        <InvestmentsOverview portfolio={currentPortfolio} locale={locale} />
      </FinancialPrivacyProvider>
    </NextIntlClientProvider>
  );
  const result = render(tree());
  return Object.assign(result, {
    refreshFromUrl: () => result.rerender(tree()),
  });
}

describe("Stitch investments overview", () => {
  beforeEach(() => {
    window.history.replaceState(
      null,
      "",
      `/${APP_LOCALE.ENGLISH}${APP_PATH.MONEY_INVESTMENTS}`,
    );
  });

  afterEach(() => vi.unstubAllGlobals());

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
    const view = renderOverview();
    expect(screen.getByRole("link", { name: /Example stock/ })).toHaveAttribute(
      "href",
      moneyInvestmentPath(stock.id),
    );
    fireEvent.click(screen.getByRole("button", { name: "Funds (1)" }));
    view.refreshFromUrl();
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
      new URLSearchParams(window.location.search).get(
        INVESTMENT_LIST_QUERY_PARAM.SEARCH,
      ),
    ).toBe("missing");
    view.refreshFromUrl();
    expect(
      screen.getByText(enMessages.investments.overview.noFilteredResults),
    ).toBeVisible();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    view.refreshFromUrl();
    fireEvent.click(screen.getByRole("button", { name: /Settled 1/ }));
    view.refreshFromUrl();
    expect(screen.getByRole("link", { name: /Settled holding/ })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /Unpriced fund/ }),
    ).not.toBeInTheDocument();
  });

  it("restores URL-backed search, tab, and asset filter", () => {
    const params = new URLSearchParams({
      [INVESTMENT_LIST_QUERY_PARAM.SEARCH]: "Settled",
      [INVESTMENT_LIST_QUERY_PARAM.TAB]: InvestmentHoldingsTab.CLOSED,
      [INVESTMENT_LIST_QUERY_PARAM.FILTER]: InvestmentAssetClass.STOCK,
    });
    window.history.replaceState(
      null,
      "",
      `/${APP_LOCALE.ENGLISH}${APP_PATH.MONEY_INVESTMENTS}?${params}`,
    );

    renderOverview();

    expect(screen.getByRole("searchbox")).toHaveValue("Settled");
    expect(screen.getByRole("button", { name: /Settled 1/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("link", { name: /Settled holding/ })).toBeVisible();
  });

  it("defaults invalid tab and asset-filter query values", () => {
    const params = new URLSearchParams({
      [INVESTMENT_LIST_QUERY_PARAM.TAB]: "invalid-tab",
      [INVESTMENT_LIST_QUERY_PARAM.FILTER]: "invalid-filter",
    });
    window.history.replaceState(
      null,
      "",
      `/${APP_LOCALE.ENGLISH}${APP_PATH.MONEY_INVESTMENTS}?${params}`,
    );

    renderOverview();

    const tabs = within(
      screen.getByRole("group", {
        name: enMessages.investments.overview.holdingsViewAria,
      }),
    ).getAllByRole("button");
    const filters = within(
      screen.getByRole("group", {
        name: enMessages.investments.overview.filterAria,
      }),
    ).getAllByRole("button");

    expect(tabs[0]).toHaveAttribute("aria-pressed", "true");
    expect(filters[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("clears the asset filter on tab change and keeps the search", () => {
    const params = new URLSearchParams({
      [INVESTMENT_LIST_QUERY_PARAM.SEARCH]: "Example",
      [INVESTMENT_LIST_QUERY_PARAM.FILTER]: InvestmentOverviewFilter.STOCK,
    });
    window.history.replaceState(
      null,
      "",
      `/${APP_LOCALE.ENGLISH}${APP_PATH.MONEY_INVESTMENTS}?${params}`,
    );
    const view = renderOverview();

    fireEvent.click(screen.getByRole("button", { name: /Settled 1/ }));

    const updatedParams = new URLSearchParams(window.location.search);
    expect(updatedParams.get(INVESTMENT_LIST_QUERY_PARAM.SEARCH)).toBe(
      "Example",
    );
    expect(updatedParams.get(INVESTMENT_LIST_QUERY_PARAM.TAB)).toBe(
      InvestmentHoldingsTab.CLOSED,
    );
    expect(updatedParams.has(INVESTMENT_LIST_QUERY_PARAM.FILTER)).toBe(false);
    view.refreshFromUrl();
    expect(screen.getByRole("searchbox")).toHaveValue("Example");
  });

  it("renders an empty Closed tab when no holdings are closed", () => {
    const noClosedHoldings: InvestmentPortfolio = {
      ...portfolio,
      holdings: [stock, unknown],
      closedHoldings: [],
      closedPositionCount: 0,
    };
    const params = new URLSearchParams({
      [INVESTMENT_LIST_QUERY_PARAM.TAB]: InvestmentHoldingsTab.CLOSED,
    });
    window.history.replaceState(
      null,
      "",
      `/${APP_LOCALE.ENGLISH}${APP_PATH.MONEY_INVESTMENTS}?${params}`,
    );

    renderOverview(APP_LOCALE.ENGLISH, noClosedHoldings);

    expect(screen.getByRole("button", { name: /Settled 0/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByText(enMessages.investments.overview.noClosedResults),
    ).toBeVisible();
  });

  it("restores only the scroll offset for the same list history entry", () => {
    const navigation = { currentEntry: { key: "investments-list-key" } };
    vi.stubGlobal("navigation", navigation);
    const scrollRegion = document.createElement("main");
    scrollRegion.dataset.slot = SHELL_SCROLL_REGION_SLOT;
    document.body.append(scrollRegion);

    try {
      const view = renderOverview();
      scrollRegion.scrollTop = 620;
      fireEvent.scroll(scrollRegion);
      view.unmount();

      navigation.currentEntry = { key: "investment-detail-key" };
      scrollRegion.scrollTop = 0;
      navigation.currentEntry = { key: "investments-list-key" };
      renderOverview();

      expect(scrollRegion.scrollTop).toBe(620);
    } finally {
      scrollRegion.remove();
    }
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
