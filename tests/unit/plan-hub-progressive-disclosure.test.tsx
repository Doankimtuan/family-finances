import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ComponentProps, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import enPlan from "@/messages/en/plan.json";
import viPlan from "@/messages/vi/plan.json";
import { PlanDisclosure } from "@/app/[locale]/(product)/plan/plan-disclosure";
import { PlanHubExceptions } from "@/app/[locale]/(product)/plan/plan-hub-exceptions";
import {
  RecommendationList,
  type Translator,
} from "@/app/[locale]/(product)/plan/recommendation-list";
import {
  PLAN_HUB_VISIBLE_JAR_LIMIT,
  RecommendationListVariant,
} from "@/app/[locale]/(product)/plan/plan-hub-presentations";
import { PlanHomeExceptionKind } from "@/modules/plan/application/plan-home-health";
import {
  PlanRecommendationPriority,
  PlanRecommendationType,
  type PlanRecommendation,
} from "@/modules/plan/application/plan-recommendations";
import { APP_PATH, planJarPath } from "@/modules/tenancy/application/app-path";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";

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

function recommendation(
  overrides: Partial<PlanRecommendation> = {},
): PlanRecommendation {
  return {
    id: "jar-near-limit:jar-1:2026-09-01",
    type: PlanRecommendationType.JAR_NEAR_LIMIT,
    priority: PlanRecommendationPriority.LOW,
    titleKey: "recommendations.jarNearLimit.title",
    descriptionKey: "recommendations.jarNearLimit.description",
    reasonCode: "jar_near_limit",
    reason: { jarId: "jar-1", usagePercent: 82 },
    amount: 120_000,
    entityType: "jar",
    entityId: "jar-1",
    action: {
      type: "review_jar_budget",
      entityType: "jar",
      entityId: "jar-1",
    },
    ...overrides,
  };
}

function SupportingRecommendations() {
  const t = useTranslations("plan");
  return (
    <RecommendationList
      recommendations={[recommendation()]}
      t={t as unknown as Translator}
      resolveHref={() => planJarPath("jar-1")}
      jarNames={{ "jar-1": "Lifestyle" }}
      variant={RecommendationListVariant.SUPPORTING}
      testId="plan-home-recommendations"
    />
  );
}

describe("Plan hub progressive disclosure (B08)", () => {
  it("keeps attention, then active jars, then supporting suggestions", () => {
    const page = readProjectFile("app/[locale]/(product)/plan/page.tsx");
    const loading = readProjectFile("app/[locale]/(product)/plan/loading.tsx");

    expect(page.indexOf("<PlanHubExceptions")).toBeLessThan(
      page.indexOf('testId="plan-home-jars"'),
    );
    expect(page.indexOf('testId="plan-home-jars"')).toBeLessThan(
      page.indexOf('testId="plan-home-goals"'),
    );
    expect(page.indexOf('testId="plan-home-goals"')).toBeLessThan(
      page.indexOf('testId="plan-home-recommendations"'),
    );
    expect(page).toContain("PLAN_HUB_VISIBLE_JAR_LIMIT");
    expect(page).toContain("RecommendationListVariant.SUPPORTING");
    expect(page).not.toContain("CreateCategoryForm");
    expect(page).not.toContain("create-category-form");

    expect(loading.indexOf('testId="plan-home-jars"')).toBeLessThan(
      loading.indexOf('testId="plan-home-goals"'),
    );
    expect(PLAN_HUB_VISIBLE_JAR_LIMIT).toBe(6);
  });

  it("keeps archived jars collapsed until the user expands them", () => {
    renderPlan(
      <PlanDisclosure
        showLabel={enPlan.jars.nonTargetShow.replace("{count}", "2")}
        hideLabel={enPlan.jars.nonTargetHide}
        testId="plan-jars-non-target-toggle"
      >
        <a href={planJarPath("jar-archived")} data-testid="jar-card-archived">
          Archived jar
        </a>
      </PlanDisclosure>,
    );

    const toggle = screen.getByTestId("plan-jars-non-target-toggle");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveTextContent("Show paused & archived (2)");
    expect(screen.queryByTestId("jar-card-archived")).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveTextContent("Hide paused & archived");
    expect(screen.getByTestId("jar-card-archived")).toHaveAttribute(
      "href",
      planJarPath("jar-archived"),
    );

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("jar-card-archived")).not.toBeInTheDocument();
  });

  it("localizes archived disclosure labels in Vietnamese", () => {
    renderPlan(
      <PlanDisclosure
        showLabel={viPlan.jars.nonTargetShow.replace("{count}", "1")}
        hideLabel={viPlan.jars.nonTargetHide}
        testId="plan-jars-non-target-toggle"
      >
        <span>hidden</span>
      </PlanDisclosure>,
      "vi",
    );

    expect(screen.getByTestId("plan-jars-non-target-toggle")).toHaveTextContent(
      "Hiện hũ tạm dừng & lưu trữ (1)",
    );
    fireEvent.click(screen.getByTestId("plan-jars-non-target-toggle"));
    expect(screen.getByTestId("plan-jars-non-target-toggle")).toHaveTextContent(
      "Thu gọn hũ tạm dừng & lưu trữ",
    );
  });

  it("keeps category creation behind an explicit action without duplicating the B03 sheet", () => {
    const hub = readProjectFile("app/[locale]/(product)/plan/page.tsx");
    const jars = readProjectFile("app/[locale]/(product)/plan/jars/page.tsx");
    const form = readProjectFile(
      "app/[locale]/(product)/plan/jars/create-category-form.tsx",
    );

    expect(hub).not.toContain("CreateCategoryForm");
    expect(hub).not.toContain("create-category-form");
    expect(jars).toContain("<CreateCategoryForm");
    expect(jars.match(/<CreateCategoryForm/g)).toHaveLength(1);
    expect(jars).toContain("<CreateJarForm");
    expect(form).toContain('data-testid="category-create-open"');
    expect(form).toContain("<Sheet");
    expect(form).toContain('data-testid="category-create-form"');
  });

  it("keeps attention actions available and suggestions quieter than highlighted cards", () => {
    const jarId = "00000000-0000-4000-8000-000000000001";
    renderPlan(
      <>
        <PlanHubExceptions
          title={enPlan.home.exceptionsTitle}
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
        />
        <SupportingRecommendations />
      </>,
    );

    expect(screen.getByTestId("plan-home-exceptions")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open jar/i })).toHaveAttribute(
      "href",
      planJarPath(jarId),
    );
    expect(screen.getByTestId("plan-home-recommendations")).toBeInTheDocument();
    expect(
      screen.getByText("Lifestyle is close to its budget"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: enPlan.recommendations.actions.reviewBudget,
      }),
    ).toHaveAttribute("href", planJarPath("jar-1"));
    expect(
      screen.getByTestId("plan-home-recommendations").innerHTML,
    ).not.toContain("bg-surface-highlight");
  });

  it("does not change the ritual recommendation surface or jar list navigation contracts", () => {
    const ritual = readProjectFile(
      "app/[locale]/(product)/plan/ritual/monthly-review.tsx",
    );
    const jars = readProjectFile("app/[locale]/(product)/plan/jars/page.tsx");

    expect(ritual).not.toContain("RecommendationListVariant.SUPPORTING");
    expect(jars).toContain("planJarPath(jar.id)");
    expect(jars).toContain("data-testid={`jar-card-${jar.id}`}");
    expect(jars.indexOf("plan-jars-active")).toBeLessThan(
      jars.indexOf("plan-jars-non-target"),
    );
  });
});
