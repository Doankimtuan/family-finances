import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en/money.json";
import { InvestmentOverviewClient } from "@/app/[locale]/(product)/money/investments/investment-overview-client";
import { investmentAssetIcon } from "@/app/[locale]/(product)/money/investments/investment-asset-icon";
import { InvestmentActivityRow } from "@/app/[locale]/(product)/money/investments/investment-activity-row";
import { InvestmentDetailHero } from "@/app/[locale]/(product)/money/investments/investment-detail-hero";
import {
  InvestmentFactNote,
  InvestmentFactRow,
  InvestmentFactsCard,
} from "@/app/[locale]/(product)/money/investments/investment-facts";
import { InvestmentPositionRow } from "@/app/[locale]/(product)/money/investments/investment-position-row";
import { InvestmentSectionTitle } from "@/app/[locale]/(product)/money/investments/investment-section-title";
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
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
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

function renderOverview() {
  return render(
    <NextIntlClientProvider locale="en" messages={{ money: enMessages }}>
      <FinancialPrivacyProvider>
        <InvestmentOverviewClient portfolio={portfolio} locale="en" />
      </FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

describe("Investment UI polish", () => {
  it("maps asset-class icons without treating gold as a phone or chart", () => {
    expect(investmentAssetIcon(InvestmentAssetClass.STOCK)).toBe(
      FINANCE_ICONS.investment,
    );
    expect(investmentAssetIcon(InvestmentAssetClass.GOLD)).not.toBe(
      investmentAssetIcon(InvestmentAssetClass.CRYPTO),
    );
  });

  it("renders holdings as an interactive card with a trailing chevron", () => {
    render(
      <InvestmentPositionRow
        href="/money/investments/1"
        testId="investment-position-1"
        cardTestId="investment-position-card-1"
        icon={FINANCE_ICONS.investment}
        title="Example stock"
        subtitle="EXM"
        meta="Custodian"
        valueLabel="₫1,000,000"
      />,
    );

    const row = screen.getByTestId("investment-position-1");
    const card = screen.getByTestId("investment-position-card-1");
    expect(row.tagName).toBe("A");
    expect(card).toHaveAttribute("data-financial-object", "investment");
    expect(card).toHaveAttribute("data-tone", "interactive");
    expect(row.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Example stock")).toHaveClass("break-words");
    expect(screen.getByText("Example stock")).not.toHaveClass("truncate");
  });

  it("keeps holding PnL after the current value instead of under identity", () => {
    render(
      <InvestmentPositionRow
        href="/money/investments/1"
        testId="investment-position-1"
        cardTestId="investment-position-card-1"
        icon={FINANCE_ICONS.investment}
        title="Usdt of household member with a long name"
        subtitle="USDT · Tether"
        meta="Binance · Crypto"
        valueLabel="₫63,301,794"
        quantityLabel="2,433 units"
        performance={<span>+₫4,909,794 · 8.4%</span>}
      />,
    );

    const value = screen.getByText("₫63,301,794");
    const pnl = screen.getByText("+₫4,909,794 · 8.4%");
    expect(
      value.compareDocumentPosition(pnl) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("keeps investment facts in a single elevated definition list", () => {
    render(
      <InvestmentFactsCard title="Performance" testId="investment-facts">
        <InvestmentFactRow label="Quantity" value="10 units" />
      </InvestmentFactsCard>,
    );

    expect(
      screen.getByTestId("investment-facts").querySelector("dl"),
    ).toHaveClass("divide-y");
    expect(screen.getByText("Performance")).toBeInTheDocument();
  });

  it("keeps a trailing privacy control on the hero and convert in the holdings header", () => {
    renderOverview();

    expect(
      screen.getByTestId("investment-financial-privacy-toggle"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("investment-convert-link")).toBeInTheDocument();
    expect(screen.getByTestId("investment-opening-link")).toBeInTheDocument();
    expect(
      screen.getByTestId(`investment-position-card-${HOLDING_ID}`),
    ).toHaveTextContent("EXM · Custodian");
    expect(
      screen.getByTestId("investment-allocation-strip"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("investment-portfolio-summary"),
    ).not.toContainElement(screen.getByTestId("investment-convert-link"));
  });

  it("uses a quiet section title instead of a second screen heading", () => {
    render(<InvestmentSectionTitle>Tracked holdings</InvestmentSectionTitle>);
    const heading = screen.getByRole("heading", { name: "Tracked holdings" });
    expect(heading.tagName).toBe("H2");
    expect(heading).toHaveClass("text-sm");
  });

  it("renders the detail hero with one caption, amount, and privacy slot", () => {
    render(
      <FinancialPrivacyProvider>
        <InvestmentDetailHero
          icon={FINANCE_ICONS.investment}
          caption="Estimated market value"
          amountLabel="₫1,000,000"
          trailing={
            <span data-testid="investment-detail-financial-privacy-toggle" />
          }
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByTestId("investment-detail-hero")).toBeInTheDocument();
    expect(screen.getByText("Estimated market value")).toBeInTheDocument();
    expect(screen.getByText("₫1,000,000")).toBeInTheDocument();
    expect(screen.getByTestId("intention-amount")).toHaveAttribute(
      "data-financial-kind",
      FinancialNumberKind.ESTIMATE,
    );
    expect(
      screen.getByTestId("investment-detail-financial-privacy-toggle"),
    ).toBeInTheDocument();
  });

  it("keeps activity history as a static row with optional snapshot copy", () => {
    render(
      <FinancialPrivacyProvider>
        <ul>
          <InvestmentActivityRow
            title="Buy"
            subtitle="6 Sep 2026 · 1 units"
            amountLabel="₫1,000,000"
            snapshot="Original amount (USDT): 10 USDT"
          />
        </ul>
      </FinancialPrivacyProvider>,
    );

    const row = screen.getByTestId("investment-activity-row");
    expect(row.tagName).toBe("LI");
    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(
      screen.getByText("Original amount (USDT): 10 USDT"),
    ).toBeInTheDocument();
  });

  it("renders a full-width note inside the facts list", () => {
    render(
      <InvestmentFactsCard title="Instrument">
        <InvestmentFactNote>Gold uses buy-back price.</InvestmentFactNote>
      </InvestmentFactsCard>,
    );

    expect(screen.getByText("Gold uses buy-back price.")).toBeInTheDocument();
  });
});
