import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePeriodStory } from "@/app/[locale]/(product)/home/home-period-story";
import { HomePeriodTransition } from "@/app/[locale]/(product)/home/home-period-transition";
import { HomeInboxCta } from "@/app/[locale]/(product)/home/home-inbox-cta";
import { HomeFinancialPulse } from "@/app/[locale]/(product)/home/home-financial-pulse";
import {
  HomeCashFlowGranularity,
  HomeDashboardPeriod,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params?.count !== undefined ? `${key}:${params.count}` : key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    prefetch: vi.fn(),
    replace: vi.fn(),
  }),
  Link: ({
    href,
    children,
    "data-testid": testId,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: ReactNode;
    "data-testid"?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} data-testid={testId} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: () => null,
  CartesianGrid: () => null,
  ResponsiveContainer: () => null,
  ReferenceLine: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const emptyMetrics = {
  income: 0,
  expense: 0,
  netCashFlow: 0,
  previousIncome: 0,
  previousExpense: 0,
  previousNetCashFlow: 0,
  netCashFlowComparison: null,
  expenseComparison: null,
  trend: {
    granularity: HomeCashFlowGranularity.DAY,
    activePointCount: 0,
    points: [],
  },
  spendingCategories: [],
  spendingInsight: null,
  hasTransactions: false,
} as const;

describe("Home command-center composition", () => {
  it("uses the existing total-assets overview for the Home hero", () => {
    const page = [
      "app/[locale]/(product)/home/page.tsx",
      "app/[locale]/(product)/home/home-streaming-sections.tsx",
    ]
      .map((path) => readFileSync(resolve(process.cwd(), path), "utf8"))
      .join("\n");

    expect(page).toContain("calculateMoneyAssetOverview");
    expect(page).toContain("<HomeInboxCta");
    expect(page).toContain("<HomePlanPulse");
    expect(page).toContain("<HomePeriodStory");
    expect(page).toContain("<HomeCaptureAction");
  });

  it("renders one current-state hero with a path to transactions", () => {
    render(
      <HomeFinancialPulse balance={1_000_000} currency="VND" locale="en" />,
    );

    expect(screen.getByTestId("ledger-balance")).toHaveAttribute(
      "data-financial-kind",
      FinancialNumberKind.CURRENT_STATE,
    );
    expect(screen.getByTestId(HOME_TEST_ID.TRANSACTIONS_LINK)).toHaveAttribute(
      "href",
      APP_PATH.MONEY_TRANSACTIONS,
    );
    expect(
      screen.queryByTestId(HOME_TEST_ID.PERIOD_CONTROL),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(HOME_TEST_ID.PERIOD_MONTH),
    ).not.toBeInTheDocument();
  });

  it("treats Inbox as a preview that launches the queue", () => {
    render(<HomeInboxCta openCount={2} />);

    expect(screen.getByTestId(HOME_TEST_ID.INBOX_CTA)).toHaveAttribute(
      "href",
      APP_PATH.INBOX,
    );
    expect(
      screen.queryByRole("button", { name: "inbox.open" }),
    ).not.toBeInTheDocument();
  });

  it("keeps period activity as supporting movement without a competing transactions action", () => {
    render(
      <HomePeriodTransition period={HomeDashboardPeriod.MONTH}>
        <HomePeriodStory
          metrics={emptyMetrics}
          currency="VND"
          locale="en"
          period={HomeDashboardPeriod.MONTH}
          canReviewUncategorized={false}
          periodControl={<div data-testid={HOME_TEST_ID.PERIOD_CONTROL} />}
        />
      </HomePeriodTransition>,
    );

    expect(screen.getByTestId(HOME_TEST_ID.PERIOD_STORY)).toBeInTheDocument();
    expect(screen.getByTestId(HOME_TEST_ID.PERIOD_CONTROL)).toBeInTheDocument();
    expect(
      screen.queryByTestId(HOME_TEST_ID.TRANSACTIONS_LINK),
    ).not.toBeInTheDocument();
    expect(screen.getByText("periodStory.empty")).toBeVisible();
    expect(
      screen.queryByTestId(HOME_TEST_ID.CASH_FLOW),
    ).not.toBeInTheDocument();
  });
});
