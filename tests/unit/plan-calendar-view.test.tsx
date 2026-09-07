import type { ComponentProps, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enPlan from "@/messages/en/plan.json";
import viPlan from "@/messages/vi/plan.json";
import { HouseholdCalendarView } from "@/app/[locale]/(product)/plan/calendar/calendar-view";
import {
  APP_PATH,
  PLAN_MONTH_QUERY,
} from "@/modules/tenancy/application/app-path";
import {
  CalendarCashFlowSign,
  CalendarEventSource,
} from "@/modules/plan/application/client";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";

function hrefToString(href: unknown): string {
  if (typeof href === "string") return href;
  if (
    href &&
    typeof href === "object" &&
    "pathname" in href &&
    typeof (href as { pathname: unknown }).pathname === "string"
  ) {
    const path = (href as { pathname: string }).pathname;
    const query = (href as { query?: Record<string, string> }).query;
    if (!query) return path;
    return `${path}?${new URLSearchParams(query).toString()}`;
  }
  return "#";
}

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: ComponentProps<"a"> & { href?: unknown }) => (
    <a href={hrefToString(href)} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/shared/motion", () => ({
  motionTokens: { duration: { fast: 0 } },
  useMotionPolicy: () => ({ enabled: false }),
}));

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

function renderCalendar(ui: ReactElement, locale: "en" | "vi" = "en") {
  const messages = { plan: locale === "en" ? enPlan : viPlan };
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <FinancialPrivacyProvider>{ui}</FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

const readyProps = {
  anchorMonth: "2024-03-01",
  currency: DEFAULT_CURRENCY,
  eventsByDate: {
    "2024-03-10": [
      {
        id: "recurring:r1:2024-03-10",
        date: "2024-03-10",
        title: "Rent",
        amount: 3_600_000,
        currency: DEFAULT_CURRENCY,
        source: CalendarEventSource.RECURRING,
        cashFlowSign: CalendarCashFlowSign.OUTFLOW,
        sourceId: "r1",
        isPayoffMilestone: false,
      },
    ],
  },
  deficitDates: [] as string[],
  payoffMilestoneDates: [] as string[],
  startingBalance: 1_000_000,
  payoffInboxItemByPlanId: {},
};

describe("HouseholdCalendarView navigation", () => {
  it("links previous and next month through the existing calendar query", () => {
    renderCalendar(<HouseholdCalendarView {...readyProps} />);

    expect(screen.getByTestId("calendar-month-previous")).toHaveAttribute(
      "href",
      `${APP_PATH.PLAN_CALENDAR}?${PLAN_MONTH_QUERY}=2024-02-01`,
    );
    expect(screen.getByTestId("calendar-month-next")).toHaveAttribute(
      "href",
      `${APP_PATH.PLAN_CALENDAR}?${PLAN_MONTH_QUERY}=2024-04-01`,
    );
    expect(screen.getByTestId("calendar-month-heading")).toHaveTextContent(
      /March 2024/i,
    );
  });

  it("orders weekdays Sunday-first in EN and Monday-first in VI", () => {
    const weekdayLabels = () =>
      Array.from(
        screen.getByTestId("calendar-weekdays").querySelectorAll("span"),
      ).map((node) => node.textContent?.trim());

    const { unmount } = renderCalendar(
      <HouseholdCalendarView {...readyProps} />,
      "en",
    );
    expect(weekdayLabels()).toEqual(["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]);
    unmount();

    renderCalendar(<HouseholdCalendarView {...readyProps} />, "vi");
    expect(weekdayLabels()).toEqual(["T2", "T3", "T4", "T5", "T6", "T7", "CN"]);
  });

  it("keeps the calendar frame when data is unavailable", () => {
    renderCalendar(
      <HouseholdCalendarView anchorMonth="2024-03-01" isUnavailable />,
    );

    expect(screen.getByTestId("calendar-unavailable")).toBeVisible();
    expect(screen.getByTestId("calendar-month-nav")).toBeVisible();
    expect(screen.getByTestId("calendar-weekdays")).toBeVisible();
    expect(screen.getByTestId("calendar-grid")).toBeVisible();
    expect(screen.getByTestId("calendar-day-1")).toBeVisible();
    expect(screen.queryByText("Starting balance")).not.toBeInTheDocument();
  });

  it("selects a day without inventing events", () => {
    renderCalendar(<HouseholdCalendarView {...readyProps} />);

    fireEvent.click(screen.getByTestId("calendar-day-10"));
    expect(screen.getByTestId("calendar-event-recurring")).toHaveTextContent(
      "Rent",
    );
  });
});
