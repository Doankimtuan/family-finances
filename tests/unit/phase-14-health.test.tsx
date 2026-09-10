import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import enHealth from "@/messages/en/health.json";
import viHealth from "@/messages/vi/health.json";
import { HealthCoverageCard } from "@/app/[locale]/(product)/health/health-coverage-card";
import { HealthFactRow } from "@/app/[locale]/(product)/health/health-fact-row";
import { HealthNoticeRow } from "@/app/[locale]/(product)/health/health-notice-row";
import { HealthRetryLink } from "@/app/[locale]/(product)/health/health-retry-link";
import { HealthSourceLink } from "@/app/[locale]/(product)/health/insights/health-source-link";
import { healthSourceHref } from "@/app/[locale]/(product)/health/health-presentations";
import {
  HEALTH_SOURCE_TOTAL,
  HealthSourceKind,
} from "@/modules/health/application/health-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    prefetch,
    ...props
  }: ComponentProps<"a"> & { prefetch?: boolean }) => {
    void prefetch;
    return (
      <a href={typeof href === "string" ? href : "#"} {...props}>
        {children}
      </a>
    );
  },
}));

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

const ADVICE_PATTERNS = [
  "you should",
  "you need to",
  "we recommend",
  "consider investing",
  "pay this debt first",
  "reduce spending",
  "increase savings",
  "financially healthy",
  "financially unhealthy",
  "bạn nên",
  "chúng tôi khuyên",
] as const;

function flattenCopy(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(flattenCopy).join(" ");
  if (value && typeof value === "object") {
    return Object.values(value).map(flattenCopy).join(" ");
  }
  return "";
}

describe("Phase 14 Health factual presentation", () => {
  it("keeps the Health hierarchy: context, summary, facts, coverage, insights", () => {
    const page = readProjectFile("app/[locale]/(product)/health/page.tsx");

    expect(page.indexOf('data-testid="health-context"')).toBeLessThan(
      page.indexOf('data-testid="health-summary"'),
    );
    expect(page.indexOf('data-testid="health-summary"')).toBeLessThan(
      page.indexOf('data-testid="health-factors"'),
    );
    expect(page.indexOf('data-testid="health-factors"')).toBeLessThan(
      page.indexOf("<HealthCoverageCard"),
    );
    expect(page.indexOf("<HealthCoverageCard")).toBeLessThan(
      page.indexOf('data-testid="health-limitations"'),
    );
    expect(page.indexOf('data-testid="health-limitations"')).toBeLessThan(
      page.indexOf("<HealthViewInsightsAction"),
    );
  });

  it("does not coerce a missing pulse to zero", () => {
    const page = readProjectFile("app/[locale]/(product)/health/page.tsx");
    const card = readProjectFile(
      "app/[locale]/(product)/health/health-overview-card.tsx",
    );

    expect(page).toContain("if (!overview.health)");
    expect(page).toContain("return null");
    expect(page).not.toContain("overview.health?.score ?? 0");
    expect(card).not.toContain("?? 0");
  });

  it("renders recorded counts without inventing a financial amount", () => {
    render(
      <HealthFactRow
        icon={FINANCE_ICONS.account}
        label="2 recorded accounts"
        source={HealthSourceKind.ACCOUNTS}
        sourceLabel="View Accounts source"
        factor={HealthSourceKind.ACCOUNTS}
        origin={APP_PATH.HEALTH}
        testId="health-source-accounts"
      />,
    );

    expect(screen.getByText("2 recorded accounts")).toBeInTheDocument();
    const source = screen.getByTestId("health-source-accounts");
    expect(source).toHaveAttribute(
      "href",
      healthSourceHref(
        HealthSourceKind.ACCOUNTS,
        APP_PATH.HEALTH,
        HealthSourceKind.ACCOUNTS,
      ),
    );
    expect(source).toHaveClass("min-h-11");
  });

  it("keeps insight source links on the insights origin", () => {
    render(
      <HealthSourceLink
        source={HealthSourceKind.INBOX}
        label="View Inbox source"
        factor="inbox"
        testId="health-source-inbox-notice"
      />,
    );

    expect(screen.getByTestId("health-source-inbox-notice")).toHaveAttribute(
      "href",
      healthSourceHref(
        HealthSourceKind.INBOX,
        APP_PATH.HEALTH_INSIGHTS,
        "inbox",
      ),
    );
  });

  it("shows coverage gaps without converting missing sources into zero cash", () => {
    render(
      <HealthCoverageCard
        completeness={{
          visibleSourceCount: 1,
          totalSourceCount: HEALTH_SOURCE_TOTAL,
          missingAccounts: false,
          missingPlan: true,
        }}
        copy={{
          title: enHealth.coverageTitle,
          body: "1 of 4 source areas have recorded facts.",
          missingAccounts: enHealth.coverageMissingAccounts,
          missingPlan: enHealth.coverageMissingPlan,
        }}
      />,
    );

    const coverage = screen.getByTestId("health-coverage");
    expect(coverage).toHaveTextContent(
      "1 of 4 source areas have recorded facts.",
    );
    expect(coverage).toHaveTextContent(enHealth.coverageMissingPlan);
    expect(coverage).not.toHaveTextContent(enHealth.coverageMissingAccounts);
    expect(coverage).not.toHaveTextContent("0 ₫");
  });

  it("keeps notices read-only and does not add mutation controls", () => {
    render(
      <HealthNoticeRow
        title="Open Inbox items"
        body="2 open items are waiting in Inbox."
        testId="health-insight-inbox"
      />,
    );

    expect(screen.getByTestId("health-insight-inbox")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses ErrorState retry links instead of Health mutations", () => {
    render(
      <HealthRetryLink
        href={APP_PATH.HEALTH}
        label={enHealth.retry}
        testId="health-retry"
      />,
    );

    const retry = screen.getByTestId("health-retry");
    expect(retry).toHaveAttribute("href", APP_PATH.HEALTH);
    expect(retry).toHaveClass("min-h-11");
  });

  it("does not introduce financial advice in EN or VI Health copy", () => {
    const english = flattenCopy(enHealth).toLowerCase();
    const vietnamese = flattenCopy(viHealth).toLowerCase();

    for (const pattern of ADVICE_PATTERNS) {
      expect(english).not.toContain(pattern);
      expect(vietnamese).not.toContain(pattern);
    }

    expect(enHealth.pulseMeaning.toLowerCase()).toContain(
      "not a credit rating",
    );
    expect(viHealth.pulseMeaning).toMatch(/không phải điểm tín dụng/i);
    expect(enHealth.insights.items.ai_guardrail.body).toMatch(
      /must not invent balances/i,
    );
    expect(viHealth.insights.items.ai_guardrail.body).toMatch(
      /không được bịa số dư/i,
    );
  });

  it("explains the existing pulse without inventing a second score", () => {
    const page = readProjectFile("app/[locale]/(product)/health/page.tsx");
    const pulse = readProjectFile("modules/health/application/health-pulse.ts");

    expect(page).toContain("overview.health.score");
    expect(page).not.toContain("computeHealthPulse");
    expect(pulse).toContain("score += 25");
    expect(enHealth.chipTitle).toBe("Household pulse");
    expect(enHealth.levels.strong).toBe("Strong");
  });

  it("uses semantic headings and labels in both locales", () => {
    expect(enHealth.factorsTitle).toBe("Recorded coverage");
    expect(viHealth.factorsTitle).toBe("Phạm vi đã ghi");
    expect(enHealth.insights.sectionInsights).toBe("Recorded notices");
    expect(viHealth.insights.sectionInsights).toBe("Thông báo đã ghi");
    expect(enHealth.context).toMatch(/does not give advice/i);
    expect(viHealth.context).toMatch(/không tư vấn/i);
  });
});
