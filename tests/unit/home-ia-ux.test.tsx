import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { HomeDayZeroTrio } from "@/app/[locale]/(product)/home/home-day-zero-trio";
import { HomeInboxCta } from "@/app/[locale]/(product)/home/home-inbox-cta";
import { HomeCashFlowChart } from "@/app/[locale]/(product)/home/home-cash-flow-chart";
import { homeCashFlowChartDomain } from "@/app/[locale]/(product)/home/home-cash-flow-chart";
import { HomeCashFlowSection } from "@/app/[locale]/(product)/home/home-cash-flow-section";
import { HomeSpendingSection } from "@/app/[locale]/(product)/home/home-spending-section";
import { HomeFinancialPulse } from "@/app/[locale]/(product)/home/home-financial-pulse";
import { HomeProductSummaries } from "@/app/[locale]/(product)/home/home-product-summaries";
import { FilterChip } from "@/shared/patterns/filter-chip";
import {
  HOME_TEST_ID,
  HomeDashboardPeriod,
  HomeCashFlowGranularity,
  HomeProductReadStatus,
} from "@/modules/home/application/home-constants";
import { InvestmentHomeValuationQuality } from "@/modules/investments/application";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params?.count !== undefined ? `${key}:${params.count}` : key,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
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
vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
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

describe("Home IA and action states", () => {
  it("orders day-zero setup without exposing transaction capture", () => {
    render(<HomeDayZeroTrio />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "addAccount",
      "dayZero.setupPlan",
      "dayZero.invite",
    ]);

    expect(
      screen.getByTestId(HOME_TEST_ID.DAY_ZERO_ACCOUNT),
    ).toBeInTheDocument();
    expect(screen.getByTestId(HOME_TEST_ID.DAY_ZERO_PLAN)).toBeInTheDocument();
    expect(
      screen.getByTestId(HOME_TEST_ID.DAY_ZERO_INVITE),
    ).toBeInTheDocument();
    expect(screen.queryByText("dayZero.addExpense")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId(HOME_TEST_ID.DAY_ZERO_ACCOUNT));
    expect(pushMock).toHaveBeenLastCalledWith(APP_PATH.MONEY);

    fireEvent.click(screen.getByTestId(HOME_TEST_ID.DAY_ZERO_PLAN));
    expect(pushMock).toHaveBeenLastCalledWith(APP_PATH.PLAN);

    fireEvent.click(screen.getByTestId(HOME_TEST_ID.DAY_ZERO_INVITE));
    expect(pushMock).toHaveBeenLastCalledWith(APP_PATH.INVITATIONS);
  });

  it("keeps Inbox stable but quiet when clear and actionable when pending", () => {
    const { rerender } = render(<HomeInboxCta openCount={3} />);

    expect(screen.getByText("inbox.pending:3")).toBeInTheDocument();
    const inboxPreview = screen.getByTestId(HOME_TEST_ID.INBOX_CTA);
    expect(inboxPreview).toBeVisible();
    expect(inboxPreview).toHaveAttribute("href", APP_PATH.INBOX);
    expect(inboxPreview).toHaveAccessibleName(
      /inbox\.pending:3.*inbox\.pendingDetail.*inbox\.open/,
    );

    rerender(<HomeInboxCta openCount={0} />);
    expect(screen.getByText("inbox.clear")).toBeInTheDocument();
    expect(
      screen.queryByTestId(HOME_TEST_ID.INBOX_CTA),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "inbox.open" }),
    ).not.toBeInTheDocument();
  });

  it("enforces 44px touch target contract on FilterChip", () => {
    const onPressMock = vi.fn();
    render(
      <FilterChip
        selected={true}
        onPress={onPressMock}
        data-testid="test-filter-chip"
      >
        Month
      </FilterChip>,
    );

    const chip = screen.getByTestId("test-filter-chip");
    expect(chip).toHaveClass("min-h-11");
    expect(chip).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(chip);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it("exposes chart points in a localized semantic table", () => {
    render(
      <HomeCashFlowChart
        trend={{
          granularity: HomeCashFlowGranularity.DAY,
          activePointCount: 1,
          points: [
            {
              key: "2026-08-19",
              startDate: "2026-08-19",
              endDate: "2026-08-19",
              income: 1200000,
              expense: 450000,
            },
          ],
        }}
        currency="VND"
        locale="vi"
      />,
    );

    const table = screen.getByTestId(HOME_TEST_ID.CASH_FLOW_DATA_TABLE);
    expect(table).toHaveAccessibleName("cashFlow.dataTableTitle");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(table).toHaveTextContent("cashFlow.dataTable.period");
    expect(table).toHaveTextContent("19/08");
    expect(table).toHaveTextContent("cashFlow.income");
    expect(table).toHaveTextContent("cashFlow.expense");
  });

  it("keeps the chart domain above the highest value without changing data", () => {
    expect(
      homeCashFlowChartDomain([
        {
          key: "2026-08-19",
          startDate: "2026-08-19",
          endDate: "2026-08-19",
          income: 1000,
          expense: 800,
        },
      ]),
    ).toEqual([0, 1120]);
  });

  it("keeps daily cash-flow values on the period they were recorded", () => {
    render(
      <HomeCashFlowChart
        trend={{
          granularity: HomeCashFlowGranularity.DAY,
          activePointCount: 1,
          points: [
            {
              key: "2026-08-19",
              startDate: "2026-08-19",
              endDate: "2026-08-19",
              income: 1000,
              expense: 200,
            },
            {
              key: "2026-08-20",
              startDate: "2026-08-20",
              endDate: "2026-08-20",
              income: 0,
              expense: 0,
            },
          ],
        }}
        currency="VND"
        locale="vi"
      />,
    );

    const rows = screen
      .getByTestId(HOME_TEST_ID.CASH_FLOW_DATA_TABLE)
      .querySelectorAll("tbody tr");
    const quietDay = rows.item(1);
    const quietDayAmounts = quietDay.querySelectorAll("td");

    expect(quietDayAmounts.item(0)).toHaveTextContent("0");
    expect(quietDayAmounts.item(1)).toHaveTextContent("0");
  });

  it("summarizes net, income, and expense for the selected period", () => {
    render(
      <HomeCashFlowSection
        metrics={{
          income: 1000,
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
        }}
        currency="VND"
        locale="vi"
        period={HomeDashboardPeriod.MONTH}
      />,
    );

    expect(screen.getByText("cashFlow.net")).toBeVisible();
    expect(screen.getAllByText("cashFlow.income").length).toBeGreaterThan(0);
    expect(screen.getAllByText("cashFlow.expense").length).toBeGreaterThan(0);
  });

  it("keeps the spending composition free of an Inbox action", () => {
    const metrics = {
      income: 0,
      expense: 1000,
      netCashFlow: -1000,
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
      spendingCategories: [
        {
          id: null,
          name: null,
          amount: 1000,
          proportion: 1,
          progressPercent: 100,
        },
      ],
      spendingRemainder: null,
      spendingInsight: null,
      hasTransactions: true,
    };
    render(
      <HomeSpendingSection metrics={metrics} currency="VND" locale="vi" />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("gives the total-assets balance current-state meaning without a competing net hero", () => {
    render(<HomeFinancialPulse balance={1200000} currency="VND" locale="vi" />);

    expect(
      screen.getByRole("group", { name: "financialPulse.accessibleLabel" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("ledger-balance")).toHaveAttribute(
      "data-financial-kind",
      "current-state",
    );
    expect(
      screen.queryByRole("group", { name: "financialPulse.netLabel.quarter" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the total-assets pulse explicit when the balance is unavailable", () => {
    render(<HomeFinancialPulse balance={null} currency="VND" locale="vi" />);

    expect(screen.getByText("financialPulse.unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("ledger-balance")).not.toBeInTheDocument();
  });

  it("renders product summaries as navigable rows with attention badges", () => {
    const t = (key: string, params?: Record<string, unknown>) =>
      params?.count !== undefined ? `${key}:${params.count}` : key;

    render(
      <HomeProductSummaries
        locale="en"
        currency="VND"
        savings={{
          status: HomeProductReadStatus.READY,
          summary: {
            activeCount: 1,
            principal: 1_000_000,
            actionRequiredCount: 2,
            nearestMaturityDate: null,
          },
        }}
        investments={{
          status: HomeProductReadStatus.READY,
          summary: {
            activeCount: 1,
            marketValue: 500_000,
            unrealizedPnl: null,
            realizedPnl: 0,
            income: 0,
            valuationQuality: InvestmentHomeValuationQuality.STALE,
            valuationStale: true,
            valuationIncluded: 2,
            valuationTotal: 3,
          },
        }}
        loans={{
          status: HomeProductReadStatus.READY,
          summary: {
            activeCount: 0,
            remainingPrincipal: 0,
            attentionCount: 0,
            nearestDueDate: null,
            overdueCount: 0,
          },
        }}
        debt={{
          status: HomeProductReadStatus.UNAVAILABLE,
        }}
        t={t as never}
      />,
    );

    const savingsLink = screen.getByRole("link", {
      name: /productSummary.savings.label/,
    });
    expect(savingsLink).toHaveAttribute("href", APP_PATH.MONEY_SAVINGS);
    expect(
      screen.getByText("productSummary.savings.attention:2"),
    ).toBeVisible();
    expect(
      screen.getByText(/productSummary.investments.quality.stale/),
    ).toBeVisible();
    expect(
      screen.getByText(/productSummary.investments.incomplete/),
    ).toBeVisible();
    expect(
      screen.queryByText("• productSummary.unavailable"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("productSummary.debt.label").closest("a"),
    ).toHaveAttribute("href", APP_PATH.MONEY_DEBTS);
  });
});
