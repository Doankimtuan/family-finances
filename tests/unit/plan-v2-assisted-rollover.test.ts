import { describe, expect, it } from "vitest";
import { JarPlanKind, JarRolloverMode } from "@/modules/plan/application/jar-types";
import {
  calculateRolloverCredit,
  previousPeriodMonth,
} from "@/modules/plan/application/jar-rollover";
import {
  buildAssistedSuggestions,
  PlanAssistedSuggestionKind,
} from "@/modules/plan/application/assisted-suggestions";
import { PlanAssistMode } from "@/modules/plan/application/plan-constants";
import { TransactionLedgerType, TransactionStatus } from "@/modules/ledger/application/ledger-constants";

describe("jar rollover", () => {
  it("computes previous period month", () => {
    expect(previousPeriodMonth("2026-08-01")).toBe("2026-07-01");
  });

  it("carries unused budget only for carry jars", () => {
    const jar = {
      plan: { kind: JarPlanKind.FIXED, percentBps: 0, fixedAmount: 5_000_000 },
      capacityDelta: 0,
      rolloverMode: JarRolloverMode.CARRY,
    };
    expect(
      calculateRolloverCredit(jar, "jar-a", [
        {
          type: TransactionLedgerType.EXPENSE,
          amount: 4_000_000,
          status: TransactionStatus.POSTED,
          jar_id: "jar-a",
        },
      ]),
    ).toBe(1_000_000);
    expect(
      calculateRolloverCredit(
        { ...jar, rolloverMode: JarRolloverMode.RESET },
        "jar-a",
        [
          {
            type: TransactionLedgerType.EXPENSE,
            amount: 4_000_000,
            status: TransactionStatus.POSTED,
            jar_id: "jar-a",
          },
        ],
      ),
    ).toBe(0);
  });
});

describe("assisted suggestions", () => {
  it("hides suggestions in manual mode", () => {
    expect(
      buildAssistedSuggestions({
        assistMode: PlanAssistMode.MANUAL,
        budgetsByJar: {
          a: {
            budgetAmount: 1,
            spentAmount: 2,
            remainingAmount: -1,
            usagePercent: 200,
            state: "overspent",
          },
        },
        jars: [{ id: "a", name: "Essentials" }],
        uncategorizedCount: 3,
      }),
    ).toEqual([]);
  });

  it("suggests covering overspend from a donor jar", () => {
    const suggestions = buildAssistedSuggestions({
      assistMode: PlanAssistMode.ASSISTED,
      budgetsByJar: {
        a: {
          budgetAmount: 10,
          spentAmount: 12,
          remainingAmount: -2,
          usagePercent: 120,
          state: "overspent",
        },
        b: {
          budgetAmount: 10,
          spentAmount: 3,
          remainingAmount: 7,
          usagePercent: 30,
          state: "healthy",
        },
      },
      jars: [
        { id: "a", name: "Lifestyle" },
        { id: "b", name: "Buffer" },
      ],
      uncategorizedCount: 0,
    });
    expect(suggestions[0]).toMatchObject({
      kind: PlanAssistedSuggestionKind.COVER_OVERSPEND,
      jarId: "a",
      sourceJarId: "b",
      amount: 2,
    });
  });
});
