import { describe, expect, it } from "vitest";
import { JarPlanKind } from "@/modules/plan/application/jar-types";
import { calculateAllocationHealth } from "@/modules/plan/application/allocation-health";

describe("allocation health", () => {
  it("flags over-allocation when planned outlay exceeds income", () => {
    expect(
      calculateAllocationHealth(
        [
          {
            plan: {
              kind: JarPlanKind.FIXED,
              percentBps: 0,
              fixedAmount: 15_000_000,
            },
          },
          {
            plan: {
              kind: JarPlanKind.PERCENT,
              percentBps: 3_000,
              fixedAmount: 0,
            },
          },
        ],
        20_000_000,
      ),
    ).toMatchObject({
      status: "over_allocated",
      plannedOutlay: 21_000_000,
      utilizationPercent: 105,
    });
  });

  it("allows mixed percent and fixed under income", () => {
    expect(
      calculateAllocationHealth(
        [
          {
            plan: {
              kind: JarPlanKind.FIXED,
              percentBps: 0,
              fixedAmount: 10_000_000,
            },
          },
          {
            plan: {
              kind: JarPlanKind.PERCENT,
              percentBps: 2_000,
              fixedAmount: 0,
            },
          },
        ],
        20_000_000,
      ),
    ).toMatchObject({
      status: "under_allocated",
      plannedOutlay: 14_000_000,
      utilizationPercent: 70,
    });
  });

  it("reports no_income when percent jars exist without posted income", () => {
    expect(
      calculateAllocationHealth(
        [
          {
            plan: {
              kind: JarPlanKind.PERCENT,
              percentBps: 5_000,
              fixedAmount: 0,
            },
          },
        ],
        0,
      ).status,
    ).toBe("no_income");
  });
});
