import type { ComponentProps, ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import enPlan from "@/messages/en/plan.json";
import viPlan from "@/messages/vi/plan.json";
import { PlanHubHero } from "@/app/[locale]/(product)/plan/plan-hub-hero";
import { PlanHubExceptions } from "@/app/[locale]/(product)/plan/plan-hub-exceptions";
import {
  PlanHubWorkObject,
  PlanHubWorkRow,
} from "@/app/[locale]/(product)/plan/plan-hub-work-row";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";
import { APP_PATH, planJarPath } from "@/modules/tenancy/application/app-path";
import { PlanHomeExceptionKind } from "@/modules/plan/application/plan-home-health";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
} from "@/shared/constants/financial-privacy";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialValue } from "@/shared/patterns/financial-value";
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

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function renderPlan(ui: ReactElement, locale: "en" | "vi" = "en") {
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

describe("Phase 9 Plan hub presentation", () => {
  it("reads as planning intention without inventing a cash hero or forbidden concepts", () => {
    const page = readProjectFile("app/[locale]/(product)/plan/page.tsx");

    expect(page).toContain("<PlanHubHero");
    expect(page).not.toContain("<Balance");
    expect(page).not.toContain("<FloatingAction>");
    expect(page).not.toContain("Net Worth");
    expect(page).not.toContain("Free to Spend");
    expect(page).not.toContain("Ready to Assign");
    expect(page).not.toContain("Age of Money");
    expect(page).not.toContain("Total Money");
    expect(page).not.toContain("getMonthlyReview");
    expect(page).not.toContain("getHouseholdCalendar");
    expect(page).not.toContain("listRecurring(");
    expect(page).toContain("APP_PATH.PLAN_RECURRING");
    expect(enPlan.home.subtitle).toMatch(/intentions/i);
    expect(viPlan.home.subtitle).toMatch(/định hướng chi tiêu/i);
    expect(enPlan.home.factIncome).toMatch(/plan/i);
    expect(enPlan.home.factIncome).not.toMatch(/qualifying/i);

    renderPlan(
      <PlanHubHero
        attentionLabel={enPlan.home.planOnTrack}
        attentionTone={StatusBadgeTone.POSITIVE}
        dayProgressLabel="Day 15/30 · 50%"
        dayProgressPercent={50}
        todayLabel={enPlan.home.today}
        activeJarSummary={enPlan.home.activeJarSummary.replace("{count}", "1")}
        incomeLabel={enPlan.home.factIncome}
        incomeValue={enPlan.home.factIncomeEmpty}
        usagePercent={null}
        overBudgetSpendShare={null}
        plannedLabel={enPlan.home.metricPlanned}
        plannedValue="₫100,000"
        spentLabel={enPlan.home.metricSpent}
        spentValue="₫20,000"
        remainingLabel={enPlan.home.metricRemaining}
        remainingValue="₫80,000"
      />,
    );

    expect(screen.getByTestId("plan-period-pulse")).toBeInTheDocument();
    expect(screen.getByTestId("plan-summary-planned")).toHaveAttribute(
      "data-financial-kind",
      FinancialNumberKind.INTENTION,
    );
    expect(screen.getByText(enPlan.home.metricRemaining)).toBeInTheDocument();
    expect(screen.getByText(enPlan.home.planOnTrack)).toBeInTheDocument();
  });

  it("keeps Hũ and Goal values as intention on compact planning rows", () => {
    const jarId = "00000000-0000-4000-8000-000000000001";
    renderPlan(
      <PlanHubWorkRow
        href={planJarPath(jarId)}
        testId={`plan-jar-${jarId}`}
        icon={PLAN_ICONS.jar}
        iconTone={IconContainerTone.SAVINGS}
        label="Groceries"
        meta={enPlan.jars.kinds.spending}
        value={<FinancialValue>₫200,000 remaining</FinancialValue>}
        financialObject={PlanHubWorkObject.JAR}
      />,
    );

    const row = screen.getByTestId(`plan-jar-${jarId}`);
    expect(row).toHaveAttribute("href", planJarPath(jarId));
    expect(row).toHaveAttribute("data-financial-object", "jar");
    expect(row).toHaveClass("min-h-14");
    expect(
      screen.getByText("₫200,000 remaining").closest("[data-financial-kind]"),
    ).toHaveAttribute("data-financial-kind", FinancialNumberKind.INTENTION);
  });

  it("shows the real empty attention state instead of inventing recommendations", () => {
    renderPlan(
      <PlanHubExceptions
        title={enPlan.home.exceptionsTitle}
        emptyTitle={enPlan.home.exceptionsEmptyTitle}
        emptyBody={enPlan.home.exceptionsEmptyBody}
        exceptions={[]}
        hiddenCount={0}
        viewAllHref={APP_PATH.PLAN_JARS}
        viewAllLabel={enPlan.home.viewAll}
        renderTitle={() => "unused"}
        renderDescription={() => null}
        renderAction={() => "unused"}
      />,
    );

    expect(screen.getByTestId("plan-home-exceptions")).toBeInTheDocument();
    expect(
      screen.getByText(enPlan.home.exceptionsEmptyTitle),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("keeps Plan inside the four-route navigation IA", () => {
    expect(TABS).toHaveLength(4);
    expect(TABS.map((tab) => tab.href)).toEqual([
      APP_PATH.HOME,
      APP_PATH.MONEY,
      APP_PATH.PLAN,
      APP_PATH.INBOX,
    ]);
  });

  it("masks intention amounts without leaking them into accessible names", () => {
    const jarId = "00000000-0000-4000-8000-000000000002";
    window.localStorage.setItem(FINANCIAL_PRIVACY_STORAGE_KEY, "true");
    renderPlan(
      <PlanHubWorkRow
        href={planJarPath(jarId)}
        testId={`plan-jar-${jarId}`}
        icon={PLAN_ICONS.jar}
        iconTone={IconContainerTone.SAVINGS}
        label="Travel"
        meta={enPlan.jars.kinds.savings}
        value={<FinancialValue>₫1,250,000</FinancialValue>}
        financialObject={PlanHubWorkObject.JAR}
      />,
    );

    expect(screen.getByText(FINANCIAL_PRIVACY_MASK)).toBeInTheDocument();
    expect(screen.queryByText("₫1,250,000")).not.toBeInTheDocument();
    const row = screen.getByTestId(`plan-jar-${jarId}`);
    expect(row.getAttribute("aria-label") ?? "").not.toContain("1,250,000");
  });

  it("renders EN and VI planning copy on the context surface", () => {
    renderPlan(
      <PlanHubHero
        attentionLabel={viPlan.home.planOnTrack}
        attentionTone={StatusBadgeTone.POSITIVE}
        dayProgressLabel="Ngày 15/30 · Tiến độ 50%"
        dayProgressPercent={50}
        todayLabel={viPlan.home.today}
        activeJarSummary={viPlan.home.activeJarSummary.replace("{count}", "2")}
        incomeLabel={viPlan.home.factIncome}
        incomeValue={viPlan.home.factIncomeEmpty}
        usagePercent={50}
        usageLabel="Đã dùng 50% kế hoạch"
        overBudgetSpendShare={null}
        plannedLabel={viPlan.home.metricPlanned}
        plannedValue="₫1.000.000"
        spentLabel={viPlan.home.metricSpent}
        spentValue="₫800.000"
        remainingLabel={viPlan.home.metricRemaining}
        remainingValue="₫200.000"
      />,
      "vi",
    );

    expect(screen.getByText(/2 hũ đang hoạt động/)).toBeInTheDocument();
    expect(screen.getByText(/Thu nhập kế hoạch/)).toBeInTheDocument();
    expect(screen.getByText(viPlan.home.today)).toBeInTheDocument();
    expect(screen.getByTestId("plan-summary-planned")).toBeInTheDocument();
  });

  it("keeps exception row actions as 44px targets without putting amounts in aria-label", () => {
    const jarId = "00000000-0000-4000-8000-000000000003";
    renderPlan(
      <PlanHubExceptions
        title={enPlan.home.exceptionsTitle}
        emptyTitle={enPlan.home.exceptionsEmptyTitle}
        emptyBody={enPlan.home.exceptionsEmptyBody}
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
        viewAllLabel={enPlan.home.viewAll}
        renderTitle={() => "Groceries is over budget"}
        renderDescription={() => "Over by ₫20,000"}
        renderAction={() => enPlan.home.exceptionOpenJar}
      />,
    );

    const link = screen.getByRole("link", { name: /open jar/i });
    expect(link).toHaveAttribute("href", planJarPath(jarId));
    expect(link).toHaveClass("min-h-14");
    expect(link.getAttribute("aria-label")).toBe(
      `Groceries is over budget. ${enPlan.home.exceptionOpenJar}`,
    );
    expect(link.getAttribute("aria-label")).not.toContain("20,000");
  });
});
