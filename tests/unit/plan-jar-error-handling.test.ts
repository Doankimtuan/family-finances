import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/modules/plan/application/assert-plan-unlocked", () => ({
  assertPlanPeriodUnlocked: vi.fn(),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { assertPlanPeriodUnlocked } from "@/modules/plan/application/assert-plan-unlocked";
import {
  createJar,
  updateJarConfiguration,
} from "@/modules/plan/application/commands/configure-jar";
import { renameJar } from "@/modules/plan/application/commands/rename-jar";
import { setJarState } from "@/modules/plan/application/commands/set-jar-state";
import { upsertJarPlan } from "@/modules/plan/application/commands/upsert-jar-plan";
import { PLAN_OPERATION } from "@/modules/plan/application/plan-constants";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

const JAR_ID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_CONFIGURATION = {
  name: "Essentials",
  kind: "spending" as const,
  enabled: true,
  planKind: "fixed" as const,
  fixedAmount: 1_000,
  categoryIds: [],
  confirmReassignCategoryIds: [],
};

describe("Plan/Jar unexpected error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-1",
      householdId: "household-1",
    });
    vi.mocked(assertPlanPeriodUnlocked).mockResolvedValue({ ok: true });
  });

  it.each([
    [
      "create Jar",
      () => createJar(VALID_CONFIGURATION),
      PLAN_OPERATION.CONFIGURE_JAR,
    ],
    [
      "update Jar configuration",
      () => updateJarConfiguration(JAR_ID, VALID_CONFIGURATION),
      PLAN_OPERATION.CONFIGURE_JAR,
    ],
    [
      "rename Jar",
      () => renameJar({ jarId: JAR_ID, name: "Updated" }),
      PLAN_OPERATION.RENAME_JAR,
    ],
    [
      "set Jar state",
      () => setJarState({ jarId: JAR_ID, state: "paused" }),
      PLAN_OPERATION.SET_JAR_STATE,
    ],
    [
      "upsert Jar plan",
      () =>
        upsertJarPlan({ jarId: JAR_ID, planKind: "fixed", fixedAmount: 1_000 }),
      PLAN_OPERATION.UPSERT_JAR_PLAN,
    ],
  ])(
    "logs and safely maps an unexpected %s failure",
    async (_name, run, operation) => {
      const thrown = new Error("database unavailable");
      vi.mocked(createSupabaseServerClient).mockRejectedValueOnce(thrown);
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const result = await run();

      expect(result).toEqual({
        ok: false,
        code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
      });
      expect(JSON.stringify(result)).not.toContain("database unavailable");
      expect(consoleError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation,
          error: thrown,
          context: expect.objectContaining({
            householdId: "household-1",
          }),
        }),
      );
      consoleError.mockRestore();
    },
  );
});
