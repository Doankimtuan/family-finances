import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  PRODUCT_ACTION_ERROR_CODE,
  SUPABASE_POSTGRES_ERROR_CODE,
} from "@/modules/tenancy/application/tenancy-constants";

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(() => ({
    url: "https://example.supabase.co",
    key: "key",
    isConfigured: true,
  })),
}));

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

vi.mock("@/modules/plan/application/queries/get-current-jar-budgets", () => ({
  collectCurrentPeriodSnapshotInserts: vi.fn(),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { collectCurrentPeriodSnapshotInserts } from "@/modules/plan/application/queries/get-current-jar-budgets";
import { ensureJarPeriodRuleSnapshots } from "@/modules/plan/application/commands/ensure-jar-period-snapshots";
import { currentPeriodMonth } from "@/modules/plan/application/ritual-period";
import {
  JarPlanKind,
  JarRolloverMode,
} from "@/modules/plan/application/jar-types";
import { QualifyingIncomeSource } from "@/modules/plan/application/plan-constants";

const SNAPSHOT_ROW = {
  household_id: "h1",
  jar_id: "jar-1",
  period_month: currentPeriodMonth(),
  jar_name: "Needs",
  plan_kind: JarPlanKind.FIXED,
  percent_bps: 0,
  fixed_amount: 15_000_000,
  rollover_mode: JarRolloverMode.CARRY,
  qualifying_income: 20_000_000,
  qualifying_income_source: QualifyingIncomeSource.CONFIGURED,
  rule_budget: 15_000_000,
  rollover_credit: 0,
};

describe("ensureJarPeriodRuleSnapshots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
      membershipId: "m1",
    });
  });

  it("upserts with ON CONFLICT DO NOTHING and treats unique races as success", async () => {
    vi.mocked(collectCurrentPeriodSnapshotInserts).mockResolvedValue({
      householdId: "h1",
      periodMonth: currentPeriodMonth(),
      rows: [SNAPSHOT_ROW],
    });
    const upsert = vi.fn(async () => ({
      error: { code: SUPABASE_POSTGRES_ERROR_CODE.UNIQUE_VIOLATION },
    }));
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: () => ({ upsert }),
    } as never);

    await expect(ensureJarPeriodRuleSnapshots()).resolves.toEqual({
      ok: true,
      written: 1,
    });
    expect(upsert).toHaveBeenCalledWith([SNAPSHOT_ROW], {
      onConflict: "jar_id,period_month",
      ignoreDuplicates: true,
    });
  });

  it("logs and returns UNKNOWN when insert fails for a non-unique reason", async () => {
    vi.mocked(collectCurrentPeriodSnapshotInserts).mockResolvedValue({
      householdId: "h1",
      periodMonth: currentPeriodMonth(),
      rows: [SNAPSHOT_ROW],
    });
    const upsert = vi.fn(async () => ({
      error: { code: "42501", message: "permission denied" },
    }));
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: () => ({ upsert }),
    } as never);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(ensureJarPeriodRuleSnapshots()).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("jar budget GET is a pure read", () => {
  it("does not insert or upsert snapshots from the GET module", () => {
    const source = readFileSync(
      "modules/plan/application/queries/get-current-jar-budgets.ts",
      "utf8",
    );
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".upsert(");
    expect(source).toContain("Promise.all");
  });
});

describe("snapshot persistence owners", () => {
  it("is invoked from jar and ritual write paths, not GET", () => {
    const writers = [
      "modules/plan/application/commands/configure-jar.ts",
      "modules/plan/application/commands/upsert-jar-plan.ts",
      "modules/plan/application/commands/set-jar-state.ts",
      "modules/plan/application/commands/month-ritual.ts",
    ];
    for (const file of writers) {
      expect(readFileSync(file, "utf8")).toContain(
        "ensureJarPeriodRuleSnapshots()",
      );
    }
    expect(
      readFileSync(
        "modules/plan/application/queries/get-current-jar-budgets.ts",
        "utf8",
      ),
    ).not.toContain("ensureJarPeriodRuleSnapshots()");
  });
});
