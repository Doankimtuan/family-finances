import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  HomeCashFlowGranularity,
  HomeDashboardPeriod,
  HomeStatusLaneKind,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { HomeCashFlowChart } from "@/app/[locale]/(product)/home/home-cash-flow-chart";
import { HomeCashFlowSection } from "@/app/[locale]/(product)/home/home-cash-flow-section";
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
  spendingRemainder: null,
  spendingInsight: null,
  hasTransactions: true,
} as const;

describe("Home component contracts", () => {
  it("shows the three-period cash-flow summary", () => {
    render(
      <HomeCashFlowSection
        metrics={metrics}
        currency="VND"
        locale="vi"
        period={HomeDashboardPeriod.MONTH}
      />,
    );

    expect(screen.queryByText("cashFlow.infoLabel")).not.toBeInTheDocument();
    expect(screen.getAllByText("cashFlow.income").length).toBeGreaterThan(0);
    expect(screen.getAllByText("cashFlow.expense").length).toBeGreaterThan(0);
    expect(screen.getAllByText("cashFlow.net").length).toBeGreaterThan(0);
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

  it("exposes a recoverable transaction-read partial state", () => {
    render(<HomeStatusLane kind={HomeStatusLaneKind.PARTIAL} />);

    expect(screen.getByText("status.partial.title")).toBeVisible();
    expect(screen.getByText("status.partial.description")).toBeVisible();
    expect(screen.getByRole("button", { name: "status.retry" })).toBeVisible();
  });
});
