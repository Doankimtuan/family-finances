import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));
vi.mock("@/modules/savings/application/savings-provider-registry", () => ({
  listProviderPackages: vi.fn(),
  resolvePackageSnapshot: vi.fn(),
}));
vi.mock("@/modules/savings/application/queries/list-savings", () => ({
  getSaving: vi.fn(),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  confirmEarlyWithdrawal,
  createSaving,
  detectMaturedSavings,
  renewSaving,
  settleSaving,
  updateRenewalPolicy,
} from "@/modules/savings/application";
import {
  classifySavingsRpcError,
  classifyLegacySavingsRpcError,
} from "@/modules/savings/application/savings-error";
import { resolvePackageSnapshot } from "@/modules/savings/application/savings-provider-registry";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import {
  CycleStatus,
  RenewalPolicy,
  SAVINGS_RPC,
  SettlementRule,
  SettlementAction,
} from "@/modules/savings/application/savings-constants";

const householdId = "11111111-1111-1111-1111-111111111111";
const cycleId = "22222222-2222-2222-2222-222222222222";

function supabaseWithCycleLookup(rpc: ReturnType<typeof vi.fn>) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return { from: vi.fn().mockReturnValue(query), rpc };
}

describe("Savings command error boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "33333333-3333-3333-3333-333333333333",
      householdId,
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("prefers structured RPC metadata over legacy text", () => {
    expect(
      classifySavingsRpcError({
        code: PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP,
        message: "Cycle must be matured to settle",
      }),
    ).toBe(PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP);
    expect(classifyLegacySavingsRpcError({ message: "Forbidden" })).toBe(
      PRODUCT_ACTION_ERROR_CODE.INVALID,
    );
  });

  it("preserves the expected maturity-state failure code", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Cycle must be matured to settle" },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      supabaseWithCycleLookup(rpc) as never,
    );

    await expect(settleSaving({ cycleId })).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
  });

  it("keeps command validation failures typed and local", async () => {
    await expect(
      createSaving({
        fundingAccountId: "invalid",
        settlementAccountId: "invalid",
        providerId: "invalid",
        packageId: "invalid",
        principal: 0,
      }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
    await expect(
      confirmEarlyWithdrawal({
        savingId: "invalid",
        cycleId: "invalid",
      }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
    await expect(
      renewSaving({
        cycleId: "invalid",
        action: SettlementAction.ROLL_PRINCIPAL_INTEREST,
      }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
    await expect(
      updateRenewalPolicy({
        savingId: "invalid",
        renewalPolicy: RenewalPolicy.ALWAYS_ASK,
      }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
  });

  it("renews legacy cycles from the product snapshot package id", async () => {
    const packageId = "44444444-4444-4444-4444-444444444444";
    const legacyCycleId = "22222222-2222-4222-8222-222222222222";
    const providerId = "55555555-5555-5555-5555-555555555555";
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          ok: true,
          savingId: "saving-id",
          cycleId: "next-cycle-id",
          principal: 1200,
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { ok: true }, error: null });
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: legacyCycleId,
          saving_id: "saving-id",
          package_snapshot: { packageName: "Tikop 1 tháng" },
          locked_rate: 6.4,
          status: CycleStatus.MATURED,
          savings: {
            household_id: householdId,
            product_snapshot: { packageId },
            provider_id: providerId,
            product_name: "Tikop 1 tháng",
            renewal_policy: RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED,
          },
        },
        error: null,
      }),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn().mockReturnValue(query),
      rpc,
    } as never);
    vi.mocked(resolvePackageSnapshot).mockResolvedValue({
      packageSnapshot: {
        packageId,
        packageName: "Tikop 1 tháng",
        durationDays: 30,
        annualInterestRate: 6.4,
        settlementRules: [SettlementRule.ROLL_PRINCIPAL_INTEREST],
        penaltyRules: [],
        renewableAvailable: true,
        minAmount: null,
        maxAmount: null,
      },
      providerId,
      productName: "Tikop",
    });

    const result = await renewSaving({
      cycleId: legacyCycleId,
      action: SettlementAction.ROLL_PRINCIPAL_INTEREST,
    });
    expect(result).toEqual({
      ok: true,
      savingId: "saving-id",
      cycleId: "next-cycle-id",
      principal: 1200,
    });
    expect(rpc).toHaveBeenCalledWith(
      SAVINGS_RPC.RENEW,
      expect.objectContaining({ p_target_package_id: packageId }),
    );
  });

  it("logs unexpected maturity RPC failures and returns UNKNOWN", async () => {
    const rawMessage = "private savings database detail";
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: rawMessage },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc } as never);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await detectMaturedSavings();

    expect(result).toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
    expect(JSON.stringify(result)).not.toContain(rawMessage);
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: SAVINGS_RPC.DETECT_MATURED,
        context: { householdId },
      }),
    );
  });

  it("logs thrown infrastructure failures without changing the public code", async () => {
    const thrown = new Error("savings provider unavailable");
    vi.mocked(createSupabaseServerClient).mockRejectedValueOnce(thrown);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(detectMaturedSavings()).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({ error: thrown }),
    );
  });

  it("keeps successful maturity counts unchanged", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: { maturedCount: 2 },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { cascadeCount: 3 },
        error: null,
      });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc } as never);

    await expect(detectMaturedSavings()).resolves.toEqual({
      ok: true,
      maturedCount: 2,
      cascadeCount: 3,
    });
  });
});
