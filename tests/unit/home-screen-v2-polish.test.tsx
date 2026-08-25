import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  HomeCashFlowGranularity,
  HomeStatusLaneKind,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { HomeCashFlowChart } from "@/app/[locale]/(product)/home/home-cash-flow-chart";
import { HomeCashFlowSection } from "@/app/[locale]/(product)/home/home-cash-flow-section";
import { HomeSpendingSection } from "@/app/[locale]/(product)/home/home-spending-section";
import { HomeStatusLane } from "@/app/[locale]/(product)/home/home-status-lane";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params?.count !== undefined ? `${key}:${params.count}` : key,
}));

vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: () => null,
  CartesianGrid: () => null,
  ReferenceLine: () => null,
  ResponsiveContainer: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const metrics = {
  income: 1_000,
  expense: 800,
  netCashFlow: 200,
  previousIncome: 0,
  previousExpense: 0,
  previousNetCashFlow: 0,
  netCashFlowComparison: null,
  expenseComparison: null,
  trend: {
    granularity: HomeCashFlowGranularity.DAY,
    activePointCount: 1,
    points: [],
  },
  spendingCategories: [],
  spendingInsight: null,
  hasTransactions: true,
} as const;

describe("Home component contracts", () => {
  it("keeps Cash Flow focused on Income and Expense", () => {
    render(
      <HomeCashFlowSection metrics={metrics} currency="VND" locale="vi" />,
    );

    expect(screen.getByText("cashFlow.infoLabel")).toBeVisible();
    expect(screen.getAllByText("cashFlow.income").length).toBeGreaterThan(0);
    expect(screen.getAllByText("cashFlow.expense").length).toBeGreaterThan(0);
    expect(screen.queryByText("cashFlow.net")).not.toBeInTheDocument();
  });

  it("exposes the chart data table and sparse-data explanation", () => {
    render(
      <HomeCashFlowChart trend={metrics.trend} currency="VND" locale="vi" />,
    );

    expect(
      screen.getByTestId(HOME_TEST_ID.CASH_FLOW_DATA_TABLE),
    ).toHaveAccessibleName("cashFlow.dataTableTitle");
    expect(screen.getByText("cashFlow.lowData")).toBeVisible();
  });

  it("shows one uncategorized review affordance when Inbox supports it", () => {
    render(
      <HomeSpendingSection
        metrics={{
          ...metrics,
          expense: 1_000,
          netCashFlow: -1_000,
          spendingCategories: [
            {
              id: null,
              name: null,
              amount: 1_000,
              proportion: 1,
              progressPercent: 100,
            },
          ],
        }}
        currency="VND"
        locale="vi"
        canReviewUncategorized
      />,
    );

    expect(screen.getAllByText("spending.review")).toHaveLength(1);
  });

  it("exposes a recoverable transaction-read partial state", () => {
    render(<HomeStatusLane kind={HomeStatusLaneKind.PARTIAL} />);

    expect(screen.getByText("status.partial.title")).toBeVisible();
    expect(screen.getByText("status.partial.description")).toBeVisible();
    expect(screen.getByRole("button", { name: "status.retry" })).toBeVisible();
  });
});
