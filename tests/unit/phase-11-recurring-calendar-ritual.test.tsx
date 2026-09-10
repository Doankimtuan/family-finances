import type { ComponentProps, ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import enPlan from "@/messages/en/plan.json";
import viPlan from "@/messages/vi/plan.json";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import {
  APP_PATH,
  PLAN_MONTH_QUERY,
  planCalendarPath,
  planRecurringPath,
  planRitualPath,
} from "@/modules/tenancy/application/app-path";
import {
  CalendarEventSource,
  MonthlyReviewStatus,
  PlanAssistMode,
  RecurringDirection,
  RecurringFrequency,
} from "@/modules/plan/application/plan-constants";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";
import { PlanRecurringRow } from "@/app/[locale]/(product)/plan/recurring/plan-recurring-row";
import {
  isWeeklyRecurring,
  partitionRecurringRules,
} from "@/app/[locale]/(product)/plan/recurring/recurring-presentations";
import { calendarEventPresentation } from "@/app/[locale]/(product)/plan/calendar/calendar-presentations";
import {
  isAssistedReview,
  isReviewMarked,
  MONTHLY_REVIEW_CASH_FLOW_FACTS,
} from "@/app/[locale]/(product)/plan/ritual/ritual-presentations";
import type { PlanRecurring } from "@/modules/plan/application/goal-recurring-types";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    prefetch,
    ...props
  }: ComponentProps<"a"> & { prefetch?: boolean }) => (
    <a
      href={typeof href === "string" ? href : "#"}
      data-prefetch={prefetch === false ? "false" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
}));

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function renderUi(ui: ReactElement, locale: "en" | "vi" = "en") {
  const plan = locale === "en" ? enPlan : viPlan;
  return render(
    <NextIntlClientProvider locale={locale} messages={{ plan }}>
      <FinancialPrivacyProvider>{ui}</FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  window.localStorage.removeItem(FINANCIAL_PRIVACY_STORAGE_KEY);
});

const FORBIDDEN = [
  "Net Worth",
  "Free to Spend",
  "Ready to Assign",
  "Age of Money",
  "Total Money",
  "<Balance",
];

const sampleRule = (overrides: Partial<PlanRecurring> = {}): PlanRecurring => ({
  id: "rule-1",
  name: "Rent",
  direction: RecurringDirection.EXPENSE,
  amount: 3_600_000,
  frequency: RecurringFrequency.MONTHLY,
  intervalCount: 1,
  dayOfMonth: 1,
  dayOfWeek: null,
  startDate: "2026-09-01",
  nextRunDate: "2026-10-01",
  isActive: true,
  ...overrides,
});

describe("Phase 11 Recurring, Calendar, and Ritual presentation", () => {
  it("keeps Recurring list scan-first with planned-amount semantics", () => {
    const list = readProjectFile(
      "app/[locale]/(product)/plan/recurring/page.tsx",
    );
    const row = readProjectFile(
      "app/[locale]/(product)/plan/recurring/plan-recurring-row.tsx",
    );
    const detail = readProjectFile(
      "app/[locale]/(product)/plan/recurring/[id]/page.tsx",
    );

    expect(list).toContain("TopAppBarVariant.DETAIL");
    expect(list).toContain("listContext");
    expect(list).toContain("plan-recurring-active");
    expect(list).toContain("plan-recurring-paused");
    expect(list.indexOf("plan-recurring-active")).toBeLessThan(
      list.indexOf("plan-recurring-paused"),
    );
    expect(list).toContain("planRecurringPath(rule.id)");
    expect(list).toContain("EmptyState");
    expect(list).toContain("<CreateRecurringForm");
    expect(list).not.toContain("startingBalance");
    for (const term of FORBIDDEN) {
      expect(list).not.toContain(term);
    }

    expect(row).toContain("FinancialNumberKind.INTENTION");
    expect(row).toContain("PLAN_DESTINATION_ROW_CLASS");
    expect(row).toContain("StatusBadge");

    expect(detail).toContain("plan-recurring-hero");
    expect(detail).toContain("FinancialNumberKind.INTENTION");
    expect(detail).toContain("plannedAmountLabel");
    expect(detail).toContain("RecurringDetailForm");
    expect(detail).not.toContain("forecast");
    expect(detail).not.toContain("annual total");

    const { active, paused } = partitionRecurringRules([
      sampleRule({ id: "paused", isActive: false, name: "Gym" }),
      sampleRule({ id: "soon", nextRunDate: "2026-09-15" }),
      sampleRule({ id: "later", nextRunDate: "2026-11-01" }),
    ]);
    expect(active.map((rule) => rule.id)).toEqual(["soon", "later"]);
    expect(paused).toHaveLength(1);
    expect(isWeeklyRecurring(RecurringFrequency.WEEKLY)).toBe(true);

    const ruleId = "00000000-0000-4000-8000-000000000021";
    renderUi(
      <PlanRecurringRow
        href={planRecurringPath(ruleId)}
        testId={`recurring-card-${ruleId}`}
        name="Rent"
        cadenceLabel="Expense · Monthly"
        amountLabel="₫3,600,000"
        statusLabel={enPlan.recurring.active}
        isActive
        direction={RecurringDirection.EXPENSE}
        nextRun="Next: Oct 1"
      />,
    );
    const rendered = screen.getByTestId(`recurring-card-${ruleId}`);
    expect(rendered).toHaveAttribute("href", planRecurringPath(ruleId));
    expect(
      screen.getByText("₫3,600,000").closest("[data-financial-kind]"),
    ).toHaveAttribute("data-financial-kind", FinancialNumberKind.INTENTION);
  });

  it("masks recurring amounts while keeping identity and status", () => {
    window.localStorage.setItem(
      FINANCIAL_PRIVACY_STORAGE_KEY,
      FINANCIAL_PRIVACY_STORAGE_TRUE,
    );
    renderUi(
      <PlanRecurringRow
        href={planRecurringPath("rule-1")}
        testId="recurring-card-rule-1"
        name="Rent"
        cadenceLabel="Expense · Monthly"
        amountLabel="₫3,600,000"
        statusLabel={enPlan.recurring.active}
        isActive
        direction={RecurringDirection.EXPENSE}
      />,
    );
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText(enPlan.recurring.active)).toBeInTheDocument();
    expect(screen.queryByText("₫3,600,000")).not.toBeInTheDocument();
    expect(screen.getByText(FINANCIAL_PRIVACY_MASK)).toBeInTheDocument();
  });

  it("keeps create and edit fields grouped without changing mutation payloads", () => {
    const create = readProjectFile(
      "app/[locale]/(product)/plan/recurring/create-recurring-form.tsx",
    );
    const edit = readProjectFile(
      "app/[locale]/(product)/plan/recurring/[id]/recurring-detail-form.tsx",
    );

    expect(create).toContain("createRecurringAction");
    expect(create).toContain("intervalCount: 1");
    expect(create).toContain("amountHint");
    expect(create).toContain("SheetActionFooter");
    expect(edit).toContain("updateRecurringAction");
    expect(edit).toContain("deleteRecurringAction");
    expect(edit).toContain("identitySection");
    expect(edit).toContain("cadenceSection");
    expect(edit).toContain("scheduleSection");
    expect(edit).toContain("recurring-delete");
    expect(edit).toContain("weekdayNames");
    expect(edit).not.toContain("yearly");
  });

  it("keeps Calendar month query, navigation, and source semantics", () => {
    const page = readProjectFile(
      "app/[locale]/(product)/plan/calendar/page.tsx",
    );
    const view = readProjectFile(
      "app/[locale]/(product)/plan/calendar/calendar-view.tsx",
    );
    const frame = readProjectFile(
      "app/[locale]/(product)/plan/calendar/calendar-month-frame.tsx",
    );

    expect(page).toContain("PLAN_MONTH_QUERY");
    expect(page).toContain("getHouseholdCalendar(anchorMonth)");
    expect(page).not.toContain("startingBalance={");
    expect(view).toContain(
      "previousHref={planCalendarPath(shiftPeriodMonth(props.anchorMonth, -1))}",
    );
    expect(view).toContain(
      "nextHref={planCalendarPath(shiftPeriodMonth(props.anchorMonth, 1))}",
    );
    expect(view).toContain(
      "currentHref={isCurrentPeriod ? undefined : planCalendarPath()}",
    );
    expect(view).toContain("planCalendarPath()");
    expect(view).toContain("EmptyState");
    expect(view).toContain("calendarEventPresentation");
    expect(view).not.toContain("startingBalance");
    expect(view).not.toContain("deficitClearTitle");
    expect(frame).toContain("min-h-11");
    expect(frame).toContain("calendar-month-current");
    for (const term of FORBIDDEN) {
      expect(view).not.toContain(term);
    }

    expect(calendarEventPresentation(CalendarEventSource.RECURRING).kind).toBe(
      FinancialNumberKind.INTENTION,
    );
    expect(calendarEventPresentation(CalendarEventSource.LOAN).kind).toBe(
      FinancialNumberKind.CURRENT_STATE,
    );
    expect(calendarEventPresentation(CalendarEventSource.CARD_DUE).kind).toBe(
      FinancialNumberKind.CURRENT_STATE,
    );

    const nextHref = planCalendarPath("2024-04-01");
    expect(nextHref).toEqual({
      pathname: APP_PATH.PLAN_CALENDAR,
      query: { [PLAN_MONTH_QUERY]: "2024-04-01" },
    });
  });

  it("keeps Ritual as a finishable review, not a report dashboard", () => {
    const page = readProjectFile("app/[locale]/(product)/plan/ritual/page.tsx");
    const review = readProjectFile(
      "app/[locale]/(product)/plan/ritual/monthly-review.tsx",
    );
    const actions = readProjectFile(
      "app/[locale]/(product)/plan/ritual/monthly-review-actions.tsx",
    );

    expect(page).toContain("TopAppBarVariant.DETAIL");
    expect(page).toContain("PLAN_MONTH_QUERY");
    expect(page).toContain("getMonthlyReview");
    expect(review).toContain("monthly-review-context");
    expect(review).toContain("monthly-review-question");
    expect(review).toContain("monthly-review-cash-flow");
    expect(review.indexOf("monthly-review-question")).toBeLessThan(
      review.indexOf("monthly-review-cash-flow"),
    );
    expect(review).not.toContain('tone="metric"');
    expect(review).not.toContain("RecommendationListVariant.SUPPORTING");
    expect(review).not.toContain("financial health");
    expect(review).not.toContain("XP");
    expect(review).toContain("planRitualPath");
    expect(review).toContain("MonthlyReviewActions");
    expect(review).not.toContain("RecommendationListVariant.SUPPORTING");
    expect(actions).toContain("MonthlyReviewStatus.MARKED_REVIEWED");
    for (const term of FORBIDDEN) {
      expect(review).not.toContain(term);
    }

    expect(isReviewMarked(MonthlyReviewStatus.MARKED_REVIEWED)).toBe(true);
    expect(isReviewMarked(MonthlyReviewStatus.VIEWED)).toBe(false);
    expect(isAssistedReview(PlanAssistMode.ASSISTED)).toBe(true);
    expect(MONTHLY_REVIEW_CASH_FLOW_FACTS).toHaveLength(6);
    expect(planRitualPath("2026-08-01")).toEqual({
      pathname: APP_PATH.PLAN_RITUAL,
      query: { [PLAN_MONTH_QUERY]: "2026-08-01" },
    });
  });

  it("keeps Plan hub child entries concise and the five-tab shell unchanged", () => {
    const hub = readProjectFile("app/[locale]/(product)/plan/page.tsx");
    expect(hub).toContain("plan-entry-recurring");
    expect(hub).toContain("plan-workspace-calendar");
    expect(hub).toContain("plan-ritual-open");
    expect(hub).toContain("APP_PATH.PLAN_RECURRING");
    expect(hub).toContain("APP_PATH.PLAN_CALENDAR");
    expect(hub).toContain("APP_PATH.PLAN_RITUAL");
    expect(hub).not.toContain("getHouseholdCalendar");
    expect(hub).not.toContain("listRecurring");
    expect(hub).not.toContain("getMonthlyReview");
    expect(TABS).toHaveLength(5);
  });

  it("uses locale weekday names in Recurring copy, not 0=Sun developer labels", () => {
    expect(enPlan.recurring.weekdayNames.sun).toBe("Sunday");
    expect(viPlan.recurring.weekdayNames.sun).toBe("Chủ nhật");
    expect(enPlan.recurring.dayOfWeekLabel).not.toMatch(/0=/);
    expect(viPlan.recurring.dayOfWeekLabel).not.toMatch(/0=/);
    expect(enPlan.calendar.thisMonth).toBe("This month");
    expect(viPlan.calendar.thisMonth).toBe("Tháng này");
    expect(enPlan.monthlyReview.questionReadyTitle).toMatch(
      /finish this review/i,
    );
    expect(viPlan.monthlyReview.questionReadyTitle).toMatch(/kết thúc/i);
  });
});
