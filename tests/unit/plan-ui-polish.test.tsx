import type { ComponentProps, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enPlan from "@/messages/en/plan.json";
import { PlanHubHero } from "@/app/[locale]/(product)/plan/plan-hub-hero";
import { PlanHubExceptions } from "@/app/[locale]/(product)/plan/plan-hub-exceptions";
import { PlanDestinationRow } from "@/app/[locale]/(product)/plan/plan-destination-row";
import { PlanSectionTitle } from "@/app/[locale]/(product)/plan/plan-section-title";
import { PlanUnavailable } from "@/app/[locale]/(product)/plan/plan-unavailable";
import {
  allocationFactTone,
  allocationFactValue,
  exceptionHref,
  getPlanMonthProgress,
  isUpcomingDueEvent,
} from "@/app/[locale]/(product)/plan/plan-hub-presentations";
import {
  AllocationHealthStatus,
  CalendarEventSource,
} from "@/modules/plan/application/client";
import { PlanHomeExceptionKind } from "@/modules/plan/application/plan-home-health";
import { APP_PATH, planJarPath } from "@/modules/tenancy/application/app-path";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadgeTone } from "@/shared/ui/status-badge";

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

function renderPlan(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ plan: enPlan }}>
      <FinancialPrivacyProvider>{ui}</FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

describe("Plan hub UI polish", () => {
  it("shows household-local calendar progress only for the active month", () => {
    const now = new Date("2026-09-28T12:00:00.000Z");

    expect(getPlanMonthProgress("2026-09-01", "vi", now)).toEqual({
      day: 28,
      days: 30,
      percent: 93,
    });
    expect(getPlanMonthProgress("2026-08-01", "vi", now)).toBeNull();
    expect(getPlanMonthProgress("2026-13-01", "vi", now)).toBeNull();
  });

  it("matches the compact plan progress card without introducing a cash hero", () => {
    renderPlan(
      <PlanHubHero
        attentionLabel={enPlan.home.planOnTrack}
        attentionTone={StatusBadgeTone.POSITIVE}
        dayProgressLabel="Day 15/30 · 50%"
        dayProgressPercent={50}
        todayLabel={enPlan.home.today}
        activeJarSummary="1 active jar"
        incomeLabel="Income base for this month's plan"
        incomeValue="Not set"
        usagePercent={50}
        usageLabel="50% of the plan used"
        overBudgetSpendShare={25}
        plannedLabel="Planned"
        plannedValue="$1,000"
        spentLabel="Spent"
        spentValue="$200"
        remainingLabel="Remaining"
        remainingValue="$800"
      />,
    );

    expect(screen.getByTestId("plan-period-pulse")).toBeInTheDocument();
    expect(screen.getByText("Day 15/30 · 50%")).toBeInTheDocument();
    expect(screen.getByText(/1 active jar/)).toBeInTheDocument();
    expect(screen.getByTestId("plan-summary-planned")).toHaveAttribute(
      "data-financial-kind",
      "intention",
    );
    expect(screen.queryByText(/net worth/i)).not.toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByTestId("plan-period-pulse")).toHaveClass(
      "bg-surface/90",
    );
  });

  it("renders exception actions as links without inventing extra copy", () => {
    const jarId = "00000000-0000-4000-8000-000000000001";
    renderPlan(
      <PlanHubExceptions
        title="Things to review"
        emptyTitle="Nothing needs a decision right now"
        emptyBody="When a Jar needs a look, it will show up here."
        exceptions={[
          {
            kind: PlanHomeExceptionKind.OVERSPENT_JAR,
            jarId,
            jarName: "Groceries",
            amount: 20_000,
          },
        ]}
        hiddenCount={0}
        viewAllHref={APP_PATH.PLAN_JARS}
        viewAllLabel="View all"
        renderTitle={() => "Groceries is over budget"}
        renderDescription={() => "Over by ₫20,000"}
        renderAction={() => "Open Jar"}
      />,
    );

    expect(screen.getByTestId("plan-home-exceptions")).toBeInTheDocument();
    expect(screen.getByText("Groceries is over budget")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open jar/i })).toHaveAttribute(
      "href",
      planJarPath(jarId),
    );
    expect(screen.getByRole("link", { name: /open jar/i })).toHaveAttribute(
      "data-prefetch",
      "false",
    );
  });

  it("renders workspace destinations as navigable rows", () => {
    renderPlan(
      <PlanDestinationRow
        href={APP_PATH.PLAN_RITUAL}
        testId="plan-ritual-open"
        icon={PLAN_ICONS.ritual}
        iconTone={IconContainerTone.PRIMARY}
        label="Monthly review"
        meta="Close the month when you are ready."
      />,
    );

    const row = screen.getByTestId("plan-ritual-open");
    expect(row).toHaveAttribute("href", APP_PATH.PLAN_RITUAL);
    expect(row).toHaveAttribute("data-prefetch", "false");
    expect(screen.getByText("Monthly review")).toBeInTheDocument();
  });

  it("keeps section titles as quiet headings", () => {
    render(<PlanSectionTitle>Goals</PlanSectionTitle>);
    expect(screen.getByRole("heading", { name: "Goals" })).toBeInTheDocument();
  });

  it("composes a recovery empty state with a surface action", () => {
    renderPlan(
      <PlanUnavailable
        title="Jar not found"
        description="It may have been archived."
        actionHref={APP_PATH.PLAN_JARS}
        actionLabel="Back to list"
      />,
    );

    expect(screen.getByText("Jar not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to list" })).toHaveAttribute(
      "href",
      APP_PATH.PLAN_JARS,
    );
  });

  it("maps allocation facts and exception destinations from real statuses", () => {
    expect(
      allocationFactValue(
        {
          status: AllocationHealthStatus.NO_INCOME,
          incomeBase: 0,
          plannedOutlay: 0,
          percentTotalBps: 0,
          fixedTotal: 0,
          utilizationPercent: 0,
        },
        (key) => key,
      ),
    ).toBe("allocationHealthNoIncome");
    expect(allocationFactTone(AllocationHealthStatus.OVER_ALLOCATED)).toBe(
      "danger",
    );
    expect(
      exceptionHref({ kind: PlanHomeExceptionKind.UNCATEGORIZED, count: 2 }),
    ).toBe(APP_PATH.INBOX);
    expect(isUpcomingDueEvent(CalendarEventSource.CARD_DUE)).toBe(true);
    expect(isUpcomingDueEvent(CalendarEventSource.RECURRING)).toBe(false);
  });
});
