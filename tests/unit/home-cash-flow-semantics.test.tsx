import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { resolveHomeFinancialPulseState } from "@/app/[locale]/(product)/home/home-financial-pulse";
import { HomeInboxCta } from "@/app/[locale]/(product)/home/home-inbox-cta";
import { HomeMovementStrip } from "@/app/[locale]/(product)/home/home-movement-strip";
import { HomeStatusLane } from "@/app/[locale]/(product)/home/home-status-lane";
import type { HomeFinancialMetrics } from "@/modules/home/application";
import {
  HomeCashFlowGranularity,
  HomeDashboardPeriod,
  HomeFinancialPulseState,
  HOME_CURRENCY_FRACTION_DIGITS,
  HOME_STATUS_LANE_VARIANT,
  HOME_TEST_ID,
  HomeStatusLaneKind,
} from "@/modules/home/application/home-constants";
import { formatCurrency } from "@/shared/i18n/formatters";
import { StatusBadgeTone } from "@/shared/ui/status-badge";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params?.count !== undefined ? `${key}:${params.count}` : key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));

function metrics(
  overrides: Partial<HomeFinancialMetrics> = {},
): HomeFinancialMetrics {
  return {
    income: 8_000_000,
    expense: 3_000_000,
    netCashFlow: 5_000_000,
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
    ...overrides,
  };
}

function formattedNet(amount: number, locale = "en") {
  return formatCurrency(amount, "VND", locale, {
    maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
  });
}

describe("Home cash-flow semantics", () => {
  it("maps signed net cash flow to financial meaning, not risk attention", () => {
    expect(resolveHomeFinancialPulseState(null)).toBe(
      HomeFinancialPulseState.UNAVAILABLE,
    );
    expect(
      resolveHomeFinancialPulseState(metrics({ hasTransactions: false })),
    ).toBe(HomeFinancialPulseState.UNAVAILABLE);
    expect(
      resolveHomeFinancialPulseState(metrics({ netCashFlow: 5_000_000 })),
    ).toBe(HomeFinancialPulseState.POSITIVE);
    expect(resolveHomeFinancialPulseState(metrics({ netCashFlow: 0 }))).toBe(
      HomeFinancialPulseState.POSITIVE,
    );
    expect(
      resolveHomeFinancialPulseState(metrics({ netCashFlow: -5_000_000 })),
    ).toBe(HomeFinancialPulseState.NEGATIVE);
  });

  it("keeps a negative monthly result signed without danger status chrome", () => {
    const netCashFlow = -5_000_000;
    render(
      <HomeMovementStrip
        currency="VND"
        locale="en"
        period={HomeDashboardPeriod.MONTH}
        metrics={metrics({
          income: 2_000_000,
          expense: 7_000_000,
          netCashFlow,
        })}
      />,
    );

    const amount = formattedNet(netCashFlow);
    expect(amount).toContain("-");
    expect(screen.getByText(amount)).toBeInTheDocument();
    expect(screen.getByText(amount).closest("p")).toHaveClass("text-danger");

    const status = screen.getByTestId(HOME_TEST_ID.FINANCIAL_PULSE_NET_STATUS);
    expect(status).toHaveTextContent("financialPulse.status.negative");
    expect(status).toHaveClass("bg-surface-muted", "text-text-secondary");
    expect(status).not.toHaveClass("bg-danger/10", "text-danger");
    expect(status).not.toHaveClass("bg-warning/10", "text-warning");

    const netGroup = screen.getByRole("group", {
      name: "financialPulse.netLabel.month",
    });
    expect(netGroup).not.toHaveClass("bg-warning/10");
    expect(netGroup).not.toHaveClass("bg-danger/10");
  });

  it("keeps positive and zero cash flow on the success path", () => {
    const { rerender } = render(
      <HomeMovementStrip
        currency="VND"
        locale="en"
        period={HomeDashboardPeriod.MONTH}
        metrics={metrics({ netCashFlow: 5_000_000 })}
      />,
    );

    expect(screen.getByText(formattedNet(5_000_000))).toBeInTheDocument();
    expect(
      screen.getByTestId(HOME_TEST_ID.FINANCIAL_PULSE_NET_STATUS),
    ).toHaveTextContent("financialPulse.status.positive");
    expect(
      screen.getByTestId(HOME_TEST_ID.FINANCIAL_PULSE_NET_STATUS),
    ).toHaveClass("bg-success/10", "text-success");

    rerender(
      <HomeMovementStrip
        currency="VND"
        locale="en"
        period={HomeDashboardPeriod.MONTH}
        metrics={metrics({
          income: 1_000_000,
          expense: 1_000_000,
          netCashFlow: 0,
        })}
      />,
    );

    expect(screen.getByText(formattedNet(0))).toBeInTheDocument();
    expect(
      screen.getByTestId(HOME_TEST_ID.FINANCIAL_PULSE_NET_STATUS),
    ).toHaveTextContent("financialPulse.status.positive");
  });

  it("keeps genuine Home danger and warning treatments intact", () => {
    expect(HOME_STATUS_LANE_VARIANT[HomeStatusLaneKind.ERROR]).toBe("danger");
    expect(StatusBadgeTone.ATTENTION).toBe("attention");

    render(<HomeStatusLane kind={HomeStatusLaneKind.ERROR} />);
    expect(screen.getByText("status.error.title")).toBeVisible();
    expect(
      screen.getByTestId(`${HOME_TEST_ID.STATUS_PREFIX}-error`),
    ).toBeInTheDocument();

    render(<HomeInboxCta openCount={2} />);
    expect(screen.getByTestId(HOME_TEST_ID.INBOX_CONTENT)).toHaveClass(
      "bg-warning/10",
    );
  });
});
