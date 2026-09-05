import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { HomeCaptureAction } from "@/app/[locale]/(product)/home/home-capture-action";
import { HomeDayZeroTrio } from "@/app/[locale]/(product)/home/home-day-zero-trio";
import { HomeInboxCta } from "@/app/[locale]/(product)/home/home-inbox-cta";
import { HomeCashFlowChart } from "@/app/[locale]/(product)/home/home-cash-flow-chart";
import { homeCashFlowChartDomain } from "@/app/[locale]/(product)/home/home-cash-flow-chart";
import { HomeCashFlowSection } from "@/app/[locale]/(product)/home/home-cash-flow-section";
import { HomeSpendingSection } from "@/app/[locale]/(product)/home/home-spending-section";
import { HomeFinancialPulse } from "@/app/[locale]/(product)/home/home-financial-pulse";
import { FilterChip } from "@/shared/patterns/filter-chip";
import {
  HOME_TEST_ID,
  HomeCashFlowGranularity,
  HomeDashboardPeriod,
} from "@/modules/home/application/home-constants";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params?.count !== undefined ? `${key}:${params.count}` : key,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
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
  it("uses capture when an account exists and account setup otherwise", () => {
    const { rerender } = render(<HomeCaptureAction accountCount={1} />);

    const captureBtn = screen.getByTestId(HOME_TEST_ID.CAPTURE_ACTION);
    expect(captureBtn).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "capture" })).toBeVisible();
    fireEvent.click(captureBtn);
    expect(pushMock).toHaveBeenLastCalledWith(APP_PATH.MONEY_ADD);

    rerender(<HomeCaptureAction accountCount={0} />);
    const addAccountBtn = screen.getByTestId(HOME_TEST_ID.ACCOUNT_ACTION);
    expect(addAccountBtn).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "addAccount" })).toBeVisible();
    expect(
      screen.queryByTestId(HOME_TEST_ID.CAPTURE_ACTION),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "capture" }),
    ).not.toBeInTheDocument();

    fireEvent.click(addAccountBtn);
    expect(pushMock).toHaveBeenLastCalledWith(APP_PATH.MONEY);
  });

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
    const openBtn = screen.getByTestId(HOME_TEST_ID.INBOX_CTA);
    expect(openBtn).toBeVisible();
    expect(openBtn).toHaveTextContent("inbox.open");

    fireEvent.click(openBtn);
    expect(pushMock).toHaveBeenLastCalledWith(APP_PATH.INBOX);

    rerender(<HomeInboxCta openCount={0} />);
    expect(screen.getByText("inbox.clear")).toBeInTheDocument();
    expect(
      screen.queryByTestId(HOME_TEST_ID.INBOX_CTA),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "inbox.open" }),
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

  it("keeps Net out of the period analytics summary", () => {
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
          spendingInsight: null,
          hasTransactions: true,
        }}
        currency="VND"
        locale="vi"
      />,
    );

    expect(screen.queryByText("cashFlow.net")).not.toBeInTheDocument();
    expect(screen.getAllByText("cashFlow.income").length).toBeGreaterThan(0);
    expect(screen.getAllByText("cashFlow.expense").length).toBeGreaterThan(0);
  });

  it("only exposes Uncategorized review when Inbox supports it", () => {
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
      spendingInsight: null,
      hasTransactions: true,
    };
    const { rerender } = render(
      <HomeSpendingSection
        metrics={metrics}
        currency="VND"
        locale="vi"
        canReviewUncategorized={false}
      />,
    );

    expect(screen.queryByText("spending.review")).not.toBeInTheDocument();

    rerender(
      <HomeSpendingSection
        metrics={metrics}
        currency="VND"
        locale="vi"
        canReviewUncategorized={true}
      />,
    );

    expect(screen.getByText("spending.review")).toHaveAttribute(
      "href",
      APP_PATH.INBOX,
    );
  });

  it("gives the balance and net value their financial meaning", () => {
    render(
      <HomeFinancialPulse
        balance={1200000}
        currency="VND"
        locale="vi"
        period={HomeDashboardPeriod.QUARTER}
        metrics={null}
      />,
    );

    expect(
      screen.getByRole("group", { name: "financialPulse.accessibleLabel" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "financialPulse.netLabel.quarter" }),
    ).toBeInTheDocument();
  });

  it("keeps the total asset pulse explicit when the aggregate is unavailable", () => {
    render(
      <HomeFinancialPulse
        balance={null}
        currency="VND"
        locale="vi"
        period={HomeDashboardPeriod.MONTH}
        metrics={null}
      />,
    );

    expect(screen.getByText("financialPulse.unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("ledger-balance")).not.toBeInTheDocument();
  });
});
