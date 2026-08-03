import { describe, expect, it } from "vitest";
import {
  buildHealthInsights,
  InsightKind,
  ScenarioKind,
} from "@/modules/health/application/build-health-insights";

describe("buildHealthInsights", () => {
  it("always ends with AI guardrail and never invents amounts", () => {
    const built = buildHealthInsights({
      accountCount: 1,
      activeJarCount: 2,
      openInboxCount: 0,
      recentTransactionCount: 3,
      hasEmiCompletePending: false,
    });

    expect(built.insights.at(-1)?.kind).toBe(InsightKind.AI_GUARDRAIL);
    for (const insight of built.insights) {
      for (const value of Object.values(insight.params)) {
        expect(typeof value).toBe("number");
      }
    }
  });

  it("surfaces EMI complete celebration when pending (AC-011)", () => {
    const built = buildHealthInsights({
      accountCount: 1,
      activeJarCount: 1,
      openInboxCount: 1,
      recentTransactionCount: 0,
      hasEmiCompletePending: true,
    });

    expect(built.insights[0]?.kind).toBe(InsightKind.EMI_COMPLETE);
    expect(built.insights.some((i) => i.kind === InsightKind.INBOX)).toBe(true);
  });

  it("offers setup insight and add-jar scenario when jars missing", () => {
    const built = buildHealthInsights({
      accountCount: 0,
      activeJarCount: 0,
      openInboxCount: 0,
      recentTransactionCount: 0,
      hasEmiCompletePending: false,
    });

    expect(built.insights.some((i) => i.kind === InsightKind.SETUP)).toBe(true);
    expect(built.scenarios.some((s) => s.kind === ScenarioKind.ADD_JAR)).toBe(
      true,
    );
    expect(
      built.scenarios.some((s) => s.kind === ScenarioKind.KEEP_RHYTHM),
    ).toBe(true);
  });

  it("includes clear-inbox scenario when inbox has load", () => {
    const built = buildHealthInsights({
      accountCount: 2,
      activeJarCount: 1,
      openInboxCount: 4,
      recentTransactionCount: 1,
      hasEmiCompletePending: false,
    });

    expect(
      built.scenarios.find((s) => s.kind === ScenarioKind.CLEAR_INBOX)?.params
        .count,
    ).toBe(4);
  });
});
