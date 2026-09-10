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
  isUpcomingDueEvent,
} from "@/app/[locale]/(product)/plan/plan-hub-presentations";
import {
  AllocationHealthStatus,
  CalendarEventSource,
} from "@/modules/plan/application/client";
import {
  PlanHomeExceptionKind,
  PlanHomeHealthStatus,
} from "@/modules/plan/application/plan-home-health";
import { APP_PATH, planJarPath } from "@/modules/tenancy/application/app-path";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";

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
  it("keeps the privacy control on the planning context and avoids a cash hero", () => {
    renderPlan(
      <PlanHubHero
        periodCaption="This month"
        periodLabel="September 2026"
        assistLabel="Assisted"
        health={PlanHomeHealthStatus.HEALTHY}
        healthTitle="On track"
        healthBody="The plan is holding."
        contextMeta="1 jar · 100%"
        incomeLabel="Income base for this month's plan"
        incomeValue="Not set"
      />,
    );

    expect(screen.getByTestId("plan-period-pulse")).toBeInTheDocument();
    expect(screen.getByText("September 2026")).toBeInTheDocument();
    expect(screen.getByText("On track")).toBeInTheDocument();
    expect(screen.getByText("1 jar · 100%")).toBeInTheDocument();
    expect(screen.getByTestId("plan-hub-income-base")).toHaveAttribute(
      "data-financial-kind",
      "intention",
    );
    expect(screen.queryByText(/net worth/i)).not.toBeInTheDocument();
    expect(
      screen.getByTestId("plan-financial-privacy-toggle"),
    ).toBeInTheDocument();
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
