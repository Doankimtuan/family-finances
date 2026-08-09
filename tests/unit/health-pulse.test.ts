import { describe, expect, it } from "vitest";
import {
  assessHealthPulse,
  computeHealthPulse,
  HealthLevel,
} from "@/modules/health/application/health-pulse";
import { HealthAssessmentState } from "@/modules/health/application/health-constants";

describe("computeHealthPulse", () => {
  it("scores starting when household is empty", () => {
    expect(
      computeHealthPulse({
        accountCount: 0,
        activeJarCount: 0,
        openInboxCount: 0,
      }),
    ).toEqual({ score: 50, level: HealthLevel.STARTING });
  });

  it("scores strong when accounts, jars, and clear inbox", () => {
    expect(
      computeHealthPulse({
        accountCount: 2,
        activeJarCount: 3,
        openInboxCount: 0,
      }),
    ).toEqual({ score: 100, level: HealthLevel.STRONG });
  });

  it("scores steady with partial setup and light inbox", () => {
    const pulse = computeHealthPulse({
      accountCount: 1,
      activeJarCount: 0,
      openInboxCount: 2,
    });
    expect(pulse).toEqual({ score: 68, level: HealthLevel.STEADY });
  });

  it("never invents balances — only setup counts", () => {
    const a = computeHealthPulse({
      accountCount: 1,
      activeJarCount: 1,
      openInboxCount: 5,
    });
    const b = computeHealthPulse({
      accountCount: 1,
      activeJarCount: 1,
      openInboxCount: 5,
    });
    expect(a).toEqual(b);
    expect(a.score).toBeLessThanOrEqual(100);
  });
});

describe("assessHealthPulse", () => {
  it("does not emit a score when no source facts are visible", () => {
    expect(
      assessHealthPulse({
        accountCount: 0,
        activeJarCount: 0,
        openInboxCount: 0,
        recentTransactionCount: 0,
      }),
    ).toMatchObject({
      state: HealthAssessmentState.NO_VISIBLE_FACTS,
      health: null,
    });
  });

  it("marks missing account or plan context as partial", () => {
    expect(
      assessHealthPulse({
        accountCount: 1,
        activeJarCount: 0,
        openInboxCount: 1,
        recentTransactionCount: 1,
      }),
    ).toMatchObject({
      state: HealthAssessmentState.PARTIAL,
      health: null,
    });
  });
});
