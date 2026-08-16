import { describe, expect, it } from "vitest";
import { JarKind, JarPlanKind } from "@/modules/plan/application/client";
import { jarConfigurationInputSchema } from "@/modules/plan/application/commands/configure-jar";
import { calculateJarSpentAmount } from "@/modules/plan/application/jar-budget";

const categoryId = "11111111-1111-4111-8111-111111111111";
const secondCategoryId = "22222222-2222-4222-8222-222222222222";

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Essentials",
    kind: JarKind.SPENDING,
    enabled: true,
    planKind: JarPlanKind.FIXED,
    fixedAmount: 15_000_000,
    categoryIds: [categoryId, secondCategoryId],
    confirmReassignCategoryIds: [],
    ...overrides,
  };
}

describe("Jar V2 configuration validation", () => {
  it("accepts a fixed Jar with multiple categories", () => {
    const result = jarConfigurationInputSchema.safeParse(validInput());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fixedAmount).toBe(15_000_000);
      expect(result.data.categoryIds).toHaveLength(2);
    }
  });

  it("accepts a percentage Jar, including decimal percentages", () => {
    const result = jarConfigurationInputSchema.safeParse(
      validInput({
        planKind: JarPlanKind.PERCENT,
        percent: 7.5,
        fixedAmount: undefined,
      }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts a disabled Jar without changing its allocation semantics", () => {
    const result = jarConfigurationInputSchema.safeParse(
      validInput({ enabled: false }),
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.enabled).toBe(false);
  });

  it.each([
    ["empty name", { name: "   " }],
    ["negative fixed amount", { fixedAmount: -1 }],
    ["percentage over 100", { planKind: JarPlanKind.PERCENT, percent: 100.1 }],
    ["missing fixed amount", { fixedAmount: undefined }],
    ["invalid category id", { categoryIds: ["not-a-uuid"] }],
  ])("rejects %s", (_label, overrides) => {
    expect(jarConfigurationInputSchema.safeParse(validInput(overrides)).success).toBe(false);
  });

  it("requires explicit confirmation for a category reassignment payload", () => {
    const result = jarConfigurationInputSchema.safeParse(
      validInput({
        confirmReassignCategoryIds: ["33333333-3333-4333-8333-333333333333"],
      }),
    );
    expect(result.success).toBe(false);
  });
});

describe("Jar category historical integrity", () => {
  it("continues to calculate historical spending from the frozen transaction Jar id", () => {
    const transactions = [
      { id: "tx-old", type: "expense", amount: 1_000, jar_id: "old-jar" },
      { id: "tx-new", type: "expense", amount: 2_000, jar_id: "new-jar" },
    ];
    expect(calculateJarSpentAmount("old-jar", transactions)).toBe(1_000);
    expect(calculateJarSpentAmount("new-jar", transactions)).toBe(2_000);
  });
});
