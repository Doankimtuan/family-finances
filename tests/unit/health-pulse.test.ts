import { describe, expect, it } from "vitest";
import {
  computeHealthPulse,
  HealthLevel,
} from "@/modules/health/application/health-pulse";

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
