import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en/money.json";
import { InvestmentOverviewClient } from "@/app/[locale]/(product)/money/investments/investment-overview-client";
import { InvestmentDetailHero } from "@/app/[locale]/(product)/money/investments/investment-detail-hero";
import { InvestmentPositionRow } from "@/app/[locale]/(product)/money/investments/investment-position-row";
import {
  InvestmentAssetClass,
  InvestmentHistoryStatus,
  InvestmentHoldingsTab,
  InvestmentLifecycleStatus,
  InvestmentVisibilityContext,
} from "@/modules/investments/application/investment-constants";
import type {
  InvestmentHolding,
  InvestmentPortfolio,
} from "@/modules/investments/application/investment-types";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import {
  APP_PATH,
  moneyInvestmentPath,
} from "@/modules/tenancy/application/app-path";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
} from "@/shared/constants/financial-privacy";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn() }),
}));

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

const HOLDING_ID = "00000000-0000-4000-8000-000000000001";
const CLOSED_ID = "00000000-0000-4000-8000-000000000002";
const UNPRICED_ID = "00000000-0000-4000-8000-000000000003";

const ownership = {
  financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
  ownerMembershipId: null,
  isPersonal: false,
  isOwnedByMe: false,
  canMutate: true,
  ownerStatus: OWNER_STATUS.ACTIVE,
};

const holding: InvestmentHolding = {
  id: HOLDING_ID,
  householdId: "00000000-0000-4000-8000-000000000010",
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
  currentValuationDate: "2026-08-17",
  currentValuationSource: null,
  unrealizedResult: 100_000,
  estimatedUnrealizedPnlPercent: 0.111,
  notes: null,
  ownership,
};

const closedHolding: InvestmentHolding = {
  ...holding,
  id: CLOSED_ID,
  name: "Closed fund",
  symbol: "CLD",
  lifecycleStatus: InvestmentLifecycleStatus.EXITED,
  quantity: "0",
  currentValue: null,
  remainingTotalCostBasis: null,
  unrealizedResult: null,
  estimatedUnrealizedPnlPercent: null,
};

const unpricedHolding: InvestmentHolding = {
  ...holding,
  id: UNPRICED_ID,
  name: "Manual gold",
  symbol: "XAU",
  assetClass: InvestmentAssetClass.GOLD,
  currentValue: null,
  remainingTotalCostBasis: 2_000_000,
  unrealizedResult: null,
  estimatedUnrealizedPnlPercent: null,
  historyStatus: InvestmentHistoryStatus.COST_BASIS_UNKNOWN,
};

const portfolio: InvestmentPortfolio = {
  holdings: [holding],
  activeHoldings: [holding],
  closedHoldings: [],
  incompleteBasisCount: 0,
  closedPositionCount: 0,
  totalCurrentValue: 1_000_000,
  totalRemainingCostBasis: 900_000,
  unrealizedResult: 100_000,
  estimatedUnrealizedPnlPercent: 0.111,
  realizedSaleResult: 0,
  investmentIncome: 0,
  investmentFees: 0,
  valuationCoverage: { included: 1, total: 1 },
  basisCoverage: { included: 1, total: 1 },
  allocationByAssetClass: [
    {
      assetClass: InvestmentAssetClass.STOCK,
      valueVnd: 1_000_000,
      shareBasisPoints: 10_000,
    },
  ],
};

function renderWithPrivacy(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ money: enMessages }}>
      <FinancialPrivacyProvider>{ui}</FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe("phase 8 investments presentation", () => {
  it("makes estimated market value primary and does not present it as cash", () => {
    renderWithPrivacy(
      <InvestmentOverviewClient portfolio={portfolio} locale="en" />,
    );

    const summary = screen.getByTestId("investment-portfolio-summary");
    expect(summary).toHaveTextContent("Estimated market value");
    expect(
      summary.querySelector("[data-financial-object='investment']"),
    ).not.toBeNull();
    expect(screen.getByTestId("intention-amount")).toHaveAttribute(
      "data-financial-kind",
      FinancialNumberKind.ESTIMATE,
    );
    expect(screen.getByTestId("intention-amount")).toHaveTextContent(
      "₫1,000,000",
    );
    expect(
      screen.getByText("Estimated market value is not cash in your accounts."),
    ).toBeInTheDocument();
    expect(summary).not.toHaveTextContent(/net worth/i);
    expect(summary).not.toHaveTextContent(/total money/i);
    expect(summary).not.toHaveTextContent(/free to spend/i);
    expect(summary).not.toHaveTextContent(/ready to assign/i);
    expect(screen.queryByText(/^Balance$/)).not.toBeInTheDocument();
  });

  it("does not render missing valuation as ₫0", () => {
    renderWithPrivacy(
      <InvestmentOverviewClient
        portfolio={{
          ...portfolio,
          holdings: [unpricedHolding],
          activeHoldings: [unpricedHolding],
          totalCurrentValue: null,
          totalRemainingCostBasis: 2_000_000,
          unrealizedResult: null,
          estimatedUnrealizedPnlPercent: null,
          valuationCoverage: { included: 0, total: 1 },
          basisCoverage: { included: 1, total: 1 },
          allocationByAssetClass: [],
        }}
        locale="en"
      />,
    );

    expect(screen.getByTestId("investment-hero-unavailable")).toHaveTextContent(
      "No price yet",
    );
    expect(
      screen.getByText(
        "Value includes 0 of 1 holdings. Missing valuations are excluded, not zero.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("intention-amount")).not.toBeInTheDocument();
    const position = screen.getByTestId(`investment-position-${UNPRICED_ID}`);
    expect(position).toHaveTextContent("No price yet");
    expect(
      screen.getByTestId("investment-hero-unavailable"),
    ).not.toHaveTextContent("₫0");
    expect(position).not.toHaveTextContent("₫0");
  });

  it("keeps incomplete allocation coverage visible instead of fabricating 100%", () => {
    renderWithPrivacy(
      <InvestmentOverviewClient
        portfolio={{
          ...portfolio,
          activeHoldings: [holding, unpricedHolding],
          holdings: [holding, unpricedHolding],
          valuationCoverage: { included: 1, total: 2 },
        }}
        locale="en"
      />,
    );

    expect(screen.getByTestId("investment-allocation")).toHaveTextContent(
      "Value includes 1 of 2 holdings. Missing valuations are excluded, not zero.",
    );
    expect(
      screen.getByTestId("investment-allocation-stock"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("investment-allocation-gold"),
    ).not.toBeInTheDocument();
  });

  it("uses identity-first cards with estimated value and unit metadata in the footer", () => {
    renderWithPrivacy(
      <InvestmentPositionRow
        href="/money/investments/1"
        testId="investment-position-1"
        cardTestId="investment-position-card-1"
        icon={FINANCE_ICONS.investment}
        title="Example stock"
        subtitle="EXM · Custodian"
        valueLabel="₫1,000,000"
        quantityLabel="10 units"
        performance={<span>+₫100,000</span>}
        valuation={<span>Automatic · today</span>}
      />,
    );

    const card = screen.getByTestId("investment-position-card-1");
    expect(card).toHaveAttribute("data-financial-object", "investment");
    expect(screen.getByText("Example stock")).toBeInTheDocument();
    expect(screen.getByText("₫1,000,000")).toBeInTheDocument();
    expect(screen.getByText("10 units")).toBeInTheDocument();
    expect(screen.getByText("+₫100,000")).toBeInTheDocument();
    expect(
      screen
        .getByText("₫1,000,000")
        .compareDocumentPosition(screen.getByText("+₫100,000")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders unavailable position value without masking or zero-filling", () => {
    renderWithPrivacy(
      <InvestmentPositionRow
        href="/money/investments/3"
        testId="investment-position-unpriced"
        cardTestId="investment-position-card-unpriced"
        icon={FINANCE_ICONS.investment}
        title="Manual gold"
        subtitle="XAU"
        unavailableLabel="No price yet"
      />,
    );

    expect(screen.getByText("No price yet")).toBeInTheDocument();
    expect(screen.queryByText("₫0")).not.toBeInTheDocument();
    expect(screen.queryByText(FINANCIAL_PRIVACY_MASK)).not.toBeInTheDocument();
  });

  it("keeps closed holdings quiet, labeled, and navigable", () => {
    renderWithPrivacy(
      <InvestmentOverviewClient
        portfolio={{
          ...portfolio,
          closedHoldings: [closedHolding],
          closedPositionCount: 1,
        }}
        locale="en"
      />,
    );

    const tabs = screen.getByTestId("investment-holdings-tabs");
    const activeTab = screen.getByRole("tab", { name: /Active/ });
    const closedTab = screen.getByRole("tab", { name: /Closed/ });
    expect(tabs).toHaveAttribute("role", "tablist");
    expect(activeTab).toHaveAttribute("aria-selected", "true");
    expect(closedTab).toHaveAttribute("aria-selected", "false");
  });

  it("exposes selected tab state when switching to closed holdings", () => {
    renderWithPrivacy(
      <InvestmentOverviewClient
        portfolio={{
          ...portfolio,
          closedHoldings: [closedHolding],
          closedPositionCount: 1,
        }}
        locale="en"
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Closed/ }));
    expect(screen.getByRole("tab", { name: /Closed/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: /Active/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(
      screen.getByTestId(`investment-closed-position-${CLOSED_ID}`),
    ).toHaveAttribute("href", moneyInvestmentPath(CLOSED_ID));
    expect(
      screen.getByTestId(`investment-position-card-${CLOSED_ID}`),
    ).toHaveAttribute("data-tone", "soft");
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("masks hero and position values without leaking amounts into aria-label", () => {
    window.localStorage.setItem(FINANCIAL_PRIVACY_STORAGE_KEY, "true");
    renderWithPrivacy(
      <InvestmentOverviewClient portfolio={portfolio} locale="en" />,
    );

    expect(screen.getAllByText(FINANCIAL_PRIVACY_MASK).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText("₫1,000,000")).not.toBeInTheDocument();
    const row = screen.getByTestId(`investment-position-${HOLDING_ID}`);
    expect(row.getAttribute("aria-label") ?? "").not.toContain("1,000,000");
  });

  it("keeps convert on the holdings header using the existing convert route", () => {
    renderWithPrivacy(
      <InvestmentOverviewClient portfolio={portfolio} locale="en" />,
    );

    expect(screen.getByTestId("investment-convert-link")).toHaveAttribute(
      "href",
      APP_PATH.MONEY_INVESTMENTS_CONVERT,
    );
    expect(screen.getByTestId("investment-holdings-tabs")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Active/ })).toHaveClass("min-h-11");
  });

  it("keeps the detail hero estimate-first and does not place PnL on the hero", () => {
    renderWithPrivacy(
      <InvestmentDetailHero
        icon={FINANCE_ICONS.investment}
        caption="Estimated market value"
        amountLabel="₫1,000,000"
      />,
    );

    const hero = screen.getByTestId("investment-detail-hero");
    expect(hero).toHaveAttribute("data-financial-object", "investment");
    expect(screen.getByTestId("intention-amount")).toHaveAttribute(
      "data-financial-kind",
      FinancialNumberKind.ESTIMATE,
    );
    expect(hero).not.toHaveTextContent(/net worth/i);
    expect(hero).not.toHaveTextContent("+₫100,000");
  });

  it("renders detail unavailable copy outside Amount so privacy cannot mask it as a zero", () => {
    renderWithPrivacy(
      <InvestmentDetailHero
        icon={FINANCE_ICONS.investment}
        caption="Estimated market value"
        unavailableLabel="No price yet"
      />,
    );

    expect(
      screen.getByTestId("investment-detail-hero-unavailable"),
    ).toHaveTextContent("No price yet");
    expect(screen.queryByTestId("intention-amount")).not.toBeInTheDocument();
    expect(screen.queryByText("₫0")).not.toBeInTheDocument();
  });

  it("does not invent holdings-tab values outside the domain constant", () => {
    expect(InvestmentHoldingsTab.ACTIVE).toBe("active");
    expect(InvestmentHoldingsTab.CLOSED).toBe("closed");
  });
});
