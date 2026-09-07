import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import enMessages from "@/messages/en/money.json";
import { MoneyPositionHero } from "@/app/[locale]/(product)/money/money-position-hero";
import { InvestmentOverviewClient } from "@/app/[locale]/(product)/money/investments/investment-overview-client";
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
import {
  APP_PATH,
  moneySavingsProvidersPath,
} from "@/modules/tenancy/application/app-path";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import {
  HeroPillLink,
  HERO_PILL_LINK_HIT_AREA_CLASS,
  HERO_PILL_LINK_VISUAL_CLASS,
} from "@/shared/patterns/hero-pill-link";

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

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

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

function assertHeroPillTouchTarget(link: HTMLElement) {
  expect(link.tagName).toBe("A");
  expect(link).toHaveClass("min-h-11", "min-w-11");
  expect(link.className).toContain("min-h-11");
  expect(link.className).not.toMatch(/(?:^|\s)min-h-8(?:\s|$)/);
  expect(link).not.toHaveClass("-mt-1", "-mb-1", "-my-1", "absolute");

  const visual = link.querySelector("span");
  expect(visual).not.toBeNull();
  expect(visual).toHaveClass("min-h-8", "rounded-full");
}

describe("Hero pill link touch target (B12)", () => {
  it("keeps a 44px hit area while the visible pill stays compact", () => {
    expect(HERO_PILL_LINK_HIT_AREA_CLASS).toContain("min-h-11");
    expect(HERO_PILL_LINK_HIT_AREA_CLASS).toContain("min-w-11");
    expect(HERO_PILL_LINK_VISUAL_CLASS).toContain("min-h-8");
    expect(HERO_PILL_LINK_VISUAL_CLASS).toContain("rounded-full");

    render(
      <HeroPillLink href={APP_PATH.MONEY_TRANSACTIONS}>
        See activity
      </HeroPillLink>,
    );

    const link = screen.getByRole("link", { name: "See activity" });
    expect(link).toHaveAttribute("href", APP_PATH.MONEY_TRANSACTIONS);
    assertHeroPillTouchTarget(link);
    expect(link).toHaveTextContent("See activity");
  });

  it("does not let adjacent pills share overlapping hit-area chrome", () => {
    render(
      <div className="flex flex-wrap items-center justify-between gap-x-(--space-3) gap-y-(--space-2)">
        <HeroPillLink href={APP_PATH.MONEY_TRANSACTIONS}>
          View transactions
        </HeroPillLink>
        <HeroPillLink href={APP_PATH.MONEY_SAVINGS_PROVIDERS}>
          Manage providers
        </HeroPillLink>
      </div>,
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);

    for (const link of links) {
      assertHeroPillTouchTarget(link);
    }

    expect(links[0].compareDocumentPosition(links[1])).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("keeps the Money hero activity control as a 44px pill link", () => {
    render(
      <MoneyPositionHero
        ownedMoneyLabel="Owned money"
        ownedMoneyValue="₫2,000,000"
        positionUnavailableLabel="Unavailable"
        metaLine={<span>3 active accounts</span>}
        allocationLabel="Asset allocation"
        allocation={[]}
        activityHref={APP_PATH.MONEY_TRANSACTIONS}
        activityLabel="See activity"
      />,
    );

    const link = screen.getByTestId("money-see-activity");
    expect(link).toHaveAccessibleName(/See activity/);
    expect(link).toHaveAttribute("href", APP_PATH.MONEY_TRANSACTIONS);
    assertHeroPillTouchTarget(link);
    expect(link.querySelector("svg")).not.toBeNull();
  });

  it("keeps the Investments hero convert control as a 44px pill link", () => {
    render(
      <NextIntlClientProvider locale="en" messages={{ money: enMessages }}>
        <FinancialPrivacyProvider>
          <InvestmentOverviewClient portfolio={portfolio} locale="en" />
        </FinancialPrivacyProvider>
      </NextIntlClientProvider>,
    );

    const link = screen.getByTestId("investment-convert-link");
    expect(link).toHaveAttribute("href", APP_PATH.MONEY_INVESTMENTS_CONVERT);
    assertHeroPillTouchTarget(link);
    expect(link.querySelector("svg")).not.toBeNull();
  });

  it("wires every remaining on-hero pill link through HeroPillLink", () => {
    const usages = [
      "app/[locale]/(product)/money/money-position-hero.tsx",
      "app/[locale]/(product)/money/savings/page.tsx",
      "app/[locale]/(product)/money/investments/investment-overview-client.tsx",
    ];

    for (const relativePath of usages) {
      const source = readProjectFile(relativePath);
      expect(source).toContain("HeroPillLink");
      expect(source).not.toMatch(/min-h-8 items-center gap-\(--space-1\)/);
    }

    const savingsSource = readProjectFile(
      "app/[locale]/(product)/money/savings/page.tsx",
    );
    expect(savingsSource).toContain("savings-manage-providers");
    expect(savingsSource).toContain("moneySavingsProvidersPath");
    expect(moneySavingsProvidersPath()).toBe(APP_PATH.MONEY_SAVINGS_PROVIDERS);
  });
});
