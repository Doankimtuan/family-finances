import type { ComponentProps, ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import enPlan from "@/messages/en/plan.json";
import viPlan from "@/messages/vi/plan.json";
import { JarCard } from "@/shared/patterns/jar-card";
import { GoalCard } from "@/shared/patterns/goal-card";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import {
  JarBudgetState,
  JarState,
  GoalStatus,
  QualifyingIncomeSource,
} from "@/modules/plan/application/plan-constants";
import {
  APP_PATH,
  planGoalPath,
  planJarPath,
} from "@/modules/tenancy/application/app-path";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";
import {
  isJarBudgetNoIncome,
  jarBudgetProgressPercent,
} from "@/app/[locale]/(product)/plan/jars/jar-presentations";
import { isOpenGoal } from "@/app/[locale]/(product)/plan/goals/goal-presentations";
import type { JarBudgetMetrics } from "@/modules/plan/application/jar-budget";

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

describe("Phase 10 Hũ and Goals presentation", () => {
  it("keeps Hũ list scan-first, intention-labeled, and free of cash-account semantics", () => {
    const jars = readProjectFile("app/[locale]/(product)/plan/jars/page.tsx");
    const jarCard = readProjectFile("shared/patterns/jar-card.tsx");

    expect(jars).toContain("TopAppBarVariant.DETAIL");
    expect(jars).toContain("backHref={APP_PATH.PLAN}");
    expect(jars).toContain("listContext");
    expect(jars).toContain("plan-jars-active");
    expect(jars).toContain("plan-jars-non-target");
    expect(jars.indexOf("plan-jars-active")).toBeLessThan(
      jars.indexOf("plan-jars-non-target"),
    );
    expect(jars).toContain("data-testid={`jar-card-${jar.id}`}");
    expect(jars).toContain("planJarPath(jar.id)");
    expect(jars).toContain("EmptyState");
    expect(jars).toContain("<CreateJarForm");
    expect(jars).not.toContain("allocated / target");
    expect(jars).not.toContain("budgetAmount /");
    for (const term of FORBIDDEN) {
      expect(jars).not.toContain(term);
    }

    expect(jarCard).toContain("data-financial-object");
    expect(jarCard).toContain("FinancialNumberKind.INTENTION");
    expect(jarCard).toContain("min-h-14");
    expect(jarCard).not.toContain('tone="interactive"');

    const jarId = "00000000-0000-4000-8000-000000000010";
    renderUi(
      <JarCard
        href={planJarPath(jarId)}
        name="Groceries"
        kindLabel={enPlan.jars.kinds.spending}
        stateLabel={enPlan.jars.stateActive}
        state={JarState.ACTIVE}
        remainingLabel="₫200,000 remaining"
        usagePercent={40}
        usageLabel="40% used"
        budgetState={JarBudgetState.HEALTHY}
        data-testid={`jar-card-${jarId}`}
      />,
    );

    const row = screen.getByTestId(`jar-card-${jarId}`);
    expect(row).toHaveAttribute("href", planJarPath(jarId));
    expect(row).toHaveAttribute("data-financial-object", "jar");
    expect(row).toHaveAttribute("data-jar-state", JarState.ACTIVE);
    expect(
      screen.getByText("₫200,000 remaining").closest("[data-financial-kind]"),
    ).toHaveAttribute("data-financial-kind", FinancialNumberKind.INTENTION);
    expect(screen.getByRole("progressbar")).toHaveAccessibleName("40% used");
  });

  it("does not invent Hũ progress or replace missing budget with zero", () => {
    const detail = readProjectFile(
      "app/[locale]/(product)/plan/jars/[id]/page.tsx",
    );
    expect(detail).toContain("plan-jar-hero");
    expect(detail).toContain("jarIntentionRemainingLabel");
    expect(detail).toContain("jarBudgetProgressPercent");
    expect(detail).not.toContain("budgetMetrics?.budgetAmount ?? 0");
    expect(detail).not.toContain("budgetMetrics?.spentAmount ?? 0");
    expect(detail).not.toContain("allocated / target");
    expect(detail).not.toContain("<Balance");
    expect(detail).toContain("FinancialNumberKind.INTENTION");
    expect(detail).toContain("ReallocateJarForm");
    expect(detail).toContain("JarDetailControls");
    expect(detail).toContain("plan-jar-privacy-toggle");

    const missing: JarBudgetMetrics | undefined = undefined;
    expect(jarBudgetProgressPercent(missing)).toBeUndefined();
    expect(
      isJarBudgetNoIncome({
        budgetAmount: 0,
        spentAmount: 0,
        remainingAmount: 0,
        usagePercent: 0,
        state: JarBudgetState.NO_BUDGET,
        incomeSource: QualifyingIncomeSource.NONE,
      }),
    ).toBe(true);
    expect(
      jarBudgetProgressPercent({
        budgetAmount: 0,
        spentAmount: 0,
        remainingAmount: 0,
        usagePercent: 0,
        state: JarBudgetState.NO_BUDGET,
        incomeSource: QualifyingIncomeSource.NONE,
      }),
    ).toBeUndefined();
  });

  it("keeps Goal list scan-first with existing progress and linked-source copy", () => {
    const goals = readProjectFile("app/[locale]/(product)/plan/goals/page.tsx");
    const goalCard = readProjectFile("shared/patterns/goal-card.tsx");

    expect(goals).toContain("TopAppBarVariant.DETAIL");
    expect(goals).toContain("listContext");
    expect(goals).toContain("plan-goals-active");
    expect(goals).toContain("plan-goals-history");
    expect(goals).toContain("data-testid={`goal-card-${goal.id}`}");
    expect(goals).toContain("planGoalPath(goal.id)");
    expect(goals).toContain("progressPercent={goal.progressPercent}");
    expect(goals).toContain("linkedTo");
    expect(goals).not.toContain("fundedAmount / targetAmount");
    expect(goals).not.toContain("time-to-goal");
    for (const term of FORBIDDEN) {
      expect(goals).not.toContain(term);
    }

    expect(goalCard).toContain("FinancialNumberKind.INTENTION");
    expect(goalCard).toContain("min-h-14");
    expect(isOpenGoal(GoalStatus.ACTIVE)).toBe(true);
    expect(isOpenGoal(GoalStatus.COMPLETED)).toBe(false);

    const goalId = "00000000-0000-4000-8000-000000000011";
    renderUi(
      <GoalCard
        href={planGoalPath(goalId)}
        name="Emergency fund"
        fundedLabel="₫4,000,000"
        targetLabel="Target ₫10,000,000"
        progressPercent={40}
        statusLabel={enPlan.goals.status.active}
        sourceLabel={enPlan.goals.linkedTo.replace(
          "{source}",
          "Family savings",
        )}
        data-testid={`goal-card-${goalId}`}
      />,
    );

    const row = screen.getByTestId(`goal-card-${goalId}`);
    expect(row).toHaveAttribute("href", planGoalPath(goalId));
    expect(row).toHaveAttribute("data-financial-object", "goal");
    expect(
      screen.getByText("Family savings", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAccessibleName("40%");
  });

  it("does not treat a Goal as cash and preserves linked Money kinds", () => {
    const detail = readProjectFile(
      "app/[locale]/(product)/plan/goals/[id]/page.tsx",
    );
    const controls = readProjectFile(
      "app/[locale]/(product)/plan/goals/[id]/goal-detail-controls.tsx",
    );

    expect(detail).toContain("plan-goal-hero");
    expect(detail).toContain("progressPercent");
    expect(detail).toContain("FinancialNumberKind.INTENTION");
    expect(detail).toContain("FinancialNumberKind.ESTIMATE");
    expect(detail).toContain("FinancialNumberKind.CURRENT_STATE");
    expect(detail).toContain("linkedSourceHint");
    expect(detail).not.toContain("<Balance");
    expect(detail).not.toContain("Goal balance");
    expect(controls).toContain("linkedTo");
    expect(controls).toContain("contributeToGoalAction");
    expect(controls).toContain("goal-legacy-contribute");
    expect(controls).not.toContain("createTransaction");
  });

  it("masks Hũ and Goal amounts without leaking values into names or aria", () => {
    window.localStorage.setItem(
      FINANCIAL_PRIVACY_STORAGE_KEY,
      FINANCIAL_PRIVACY_STORAGE_TRUE,
    );

    renderUi(
      <>
        <JarCard
          name="Housing"
          kindLabel="Spending"
          stateLabel="Active"
          state={JarState.ACTIVE}
          remainingLabel="₫6,000,000 remaining"
          usageLabel="40% used"
          usagePercent={40}
          data-testid="jar-card-privacy"
        />
        <GoalCard
          name="Emergency fund"
          fundedLabel="₫4,000,000"
          targetLabel="₫10,000,000"
          progressPercent={40}
          statusLabel="Active"
          data-testid="goal-card-privacy"
        />
      </>,
    );

    expect(screen.getByText("Housing")).toBeInTheDocument();
    expect(screen.getByText("Emergency fund")).toBeInTheDocument();
    expect(screen.queryByText("₫6,000,000 remaining")).not.toBeInTheDocument();
    expect(screen.queryByText("₫4,000,000")).not.toBeInTheDocument();
    expect(screen.getAllByText(FINANCIAL_PRIVACY_MASK).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByTestId("jar-card-privacy")).not.toHaveAttribute(
      "aria-label",
    );
    expect(
      screen
        .getAllByRole("progressbar")
        .every(
          (bar) => bar.getAttribute("aria-label") === FINANCIAL_PRIVACY_MASK,
        ),
    ).toBe(true);
  });

  it("keeps EN/VI intention copy and Plan child navigation", () => {
    expect(enPlan.jars.listContext).toMatch(/intention/i);
    expect(enPlan.jars.emptyDescription).toMatch(/intention/i);
    expect(enPlan.jars.emptyDescription).not.toMatch(/first account/i);
    expect(enPlan.goals.listContext).toMatch(/intention/i);
    expect(enPlan.goals.linkedSourceHint).toMatch(/does not own/i);
    expect(viPlan.jars.listContext).toMatch(/ý định/i);
    expect(viPlan.jars.emptyDescription).toMatch(/ý định/i);
    expect(viPlan.goals.linkedTo).toMatch(/Gắn với/);
    expect(viPlan.goals.listSubtitle).toMatch(/hướng tới/);

    expect(APP_PATH.PLAN_JARS).toBe("/plan/jars");
    expect(APP_PATH.PLAN_GOALS).toBe("/plan/goals");
    expect(planJarPath("abc")).toBe("/plan/jars/abc");
    expect(planGoalPath("abc")).toBe("/plan/goals/abc");
    expect(TABS).toHaveLength(5);

    const reallocate = readProjectFile(
      "app/[locale]/(product)/plan/jars/reallocate-jar-form.tsx",
    );
    expect(reallocate).toContain("reallocateJarCapacityAction");
    expect(reallocate).toContain("virtualBannerTitle");
    expect(reallocate).toContain("availableToMoveValue");
  });

  it("keeps interactive Hũ/Goal rows at least 44px and uses disclosure for secondary state", () => {
    renderUi(
      <JarCard
        href={planJarPath("jar-1")}
        name="Buffer"
        kindLabel="Buffer"
        stateLabel="Paused"
        state={JarState.PAUSED}
        planLabel="No plan yet"
        data-testid="jar-card-jar-1"
      />,
    );
    expect(screen.getByTestId("jar-card-jar-1")).toHaveClass("flex");
    expect(
      screen.getByTestId("jar-card-jar-1").querySelector(".min-h-14"),
    ).not.toBeNull();

    const jars = readProjectFile("app/[locale]/(product)/plan/jars/page.tsx");
    expect(jars).toContain("plan-jars-non-target-toggle");
    const goals = readProjectFile("app/[locale]/(product)/plan/goals/page.tsx");
    expect(goals).toContain("plan-goals-history-toggle");
  });
});
