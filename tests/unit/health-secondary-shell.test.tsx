import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enHealth from "@/messages/en/health.json";
import viHealth from "@/messages/vi/health.json";
import { HealthOverviewCard } from "@/app/[locale]/(product)/health/health-overview-card";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

const HEALTH_UI_FILES = [
  "app/[locale]/(product)/health/page.tsx",
  "app/[locale]/(product)/health/loading.tsx",
  "app/[locale]/(product)/health/health-overview-card.tsx",
  "app/[locale]/(product)/health/health-view-insights-action.tsx",
  "app/[locale]/(product)/health/health-section-title.tsx",
  "app/[locale]/(product)/health/insights/page.tsx",
  "app/[locale]/(product)/health/insights/loading.tsx",
  "app/[locale]/(product)/health/insights/health-source-link.tsx",
] as const;

const FORBIDDEN_MUTATION_PATTERNS = [
  "createSupabaseServerClient",
  "createSupabaseBrowserClient",
  ".insert(",
  ".update(",
  ".upsert(",
  ".delete(",
  ".rpc(",
] as const;

describe("Health secondary-screen shell (B06)", () => {
  it("frames Health as a detail screen with Back to Home", () => {
    const page = readProjectFile("app/[locale]/(product)/health/page.tsx");
    const loading = readProjectFile(
      "app/[locale]/(product)/health/loading.tsx",
    );

    for (const source of [page, loading]) {
      expect(source).toContain('variant="detail"');
      expect(source).toContain("backHref={APP_PATH.HOME}");
      expect(source).toContain('backLabel={t("backHome")}');
      expect(source).toContain("<Page");
      expect(source).not.toContain('variant="primary"');
      expect(source).not.toContain('variant="contextual"');
    }

    expect(page.indexOf("health-summary")).toBeLessThan(
      page.indexOf("health-factors"),
    );
    expect(page.indexOf('data-testid="health-factors"')).toBeLessThan(
      page.indexOf("<HealthViewInsightsAction"),
    );
    expect(page).not.toContain('data-testid="health-back-home"');
  });

  it("frames insights as a child detail screen with Back to Health", () => {
    const page = readProjectFile(
      "app/[locale]/(product)/health/insights/page.tsx",
    );
    const loading = readProjectFile(
      "app/[locale]/(product)/health/insights/loading.tsx",
    );

    for (const source of [page, loading]) {
      expect(source).toContain('variant="detail"');
      expect(source).toContain("backHref={APP_PATH.HEALTH}");
      expect(source).toContain('backLabel={t("insights.backHealth")}');
      expect(source).toContain("<Page");
    }

    expect(page.indexOf("health-insight-list")).toBeLessThan(
      page.indexOf("health-scenario-list"),
    );
    expect(page).not.toContain('data-testid="health-insights-back"');
  });

  it("keeps insight groups as supporting rows instead of equal large cards", () => {
    const page = readProjectFile(
      "app/[locale]/(product)/health/insights/page.tsx",
    );

    expect(page).toContain('tone="elevated"');
    expect(page).toContain('tone="soft"');
    expect(page).toContain("HealthSupportingItem");
    expect(page).not.toContain(
      "data-testid={`health-insight-${insight.kind}`}\n                    >",
    );
  });

  it("mirrors summary then insight rows in the route loading skeletons", () => {
    const overviewLoading = readProjectFile(
      "app/[locale]/(product)/health/loading.tsx",
    );
    const insightsLoading = readProjectFile(
      "app/[locale]/(product)/health/insights/loading.tsx",
    );

    expect(overviewLoading).toContain('testId="health-overview-loading"');
    expect(overviewLoading).toContain("health-overview-loading-summary");
    expect(overviewLoading).toContain("health-overview-loading-factors");
    expect(
      overviewLoading.indexOf("health-overview-loading-summary"),
    ).toBeLessThan(overviewLoading.indexOf("health-overview-loading-factors"));

    expect(insightsLoading).toContain('testId="health-insights-loading"');
    expect(insightsLoading).toContain("health-insights-loading-notices");
    expect(insightsLoading).toContain("health-insights-loading-scenarios");
    expect(
      insightsLoading.indexOf("health-insights-loading-notices"),
    ).toBeLessThan(
      insightsLoading.indexOf("health-insights-loading-scenarios"),
    );
  });

  it("preserves existing Health state branches and insight navigation", () => {
    const page = readProjectFile("app/[locale]/(product)/health/page.tsx");
    const insights = readProjectFile(
      "app/[locale]/(product)/health/insights/page.tsx",
    );

    expect(page).toContain("HealthAssessmentState.NO_VISIBLE_FACTS");
    expect(page).toContain("HealthAssessmentState.PARTIAL");
    expect(page).toContain("loadFailed");
    expect(page).toContain("HealthViewInsightsAction");
    expect(insights).toContain("HealthAssessmentState.NO_VISIBLE_FACTS");
    expect(insights).toContain("HealthAssessmentState.PARTIAL");
    expect(insights).toContain("insights.loadErrorTitle");
  });

  it("does not introduce Health mutations in the UI shell", () => {
    for (const file of HEALTH_UI_FILES) {
      const source = readProjectFile(file);
      for (const pattern of FORBIDDEN_MUTATION_PATTERNS) {
        expect(source.includes(pattern)).toBe(false);
      }
    }
  });

  it("keeps locale-aware Home and Health routes as constants", () => {
    expect(APP_PATH.HOME).toBe("/home");
    expect(APP_PATH.HEALTH).toBe("/health");
    expect(APP_PATH.HEALTH_INSIGHTS).toBe("/health/insights");
  });

  it("renders the Health summary as a dominant hero with unchanged score values", () => {
    render(
      <NextIntlClientProvider locale="en" messages={{ health: enHealth }}>
        <HealthOverviewCard
          title={enHealth.chipTitle}
          score={73}
          levelLabel={enHealth.levels.steady}
          narrative={enHealth.narratives.steady}
        />
      </NextIntlClientProvider>,
    );

    const card = screen.getByTestId("health-overview-card");
    expect(card).toHaveTextContent("73");
    expect(card).toHaveTextContent("/100");
    expect(card).toHaveTextContent("Financial Health");
    expect(card).toHaveTextContent("Steady");
    expect(card).toHaveTextContent(enHealth.narratives.steady);
    expect(card.className).toContain("from-hero");
  });

  it("localizes Health secondary-shell copy in English and Vietnamese", () => {
    expect(enHealth.backHome).toBe("Back to Home");
    expect(viHealth.backHome).toBe("Về Trang chủ");
    expect(enHealth.subtitle).toMatch(/read-only/i);
    expect(viHealth.subtitle).toMatch(/chỉ xem/i);
    expect(enHealth.insights.backHealth).toBe("Back to Health");
    expect(viHealth.insights.backHealth).toBe("Về Sức khỏe");
    expect(enHealth.insights.subtitle).toMatch(/read-only/i);
    expect(viHealth.insights.subtitle).toMatch(/chỉ xem/i);
    expect(enHealth.subtitle).not.toMatch(/^health\./);
    expect(viHealth.subtitle).not.toMatch(/^health\./);
  });
});
