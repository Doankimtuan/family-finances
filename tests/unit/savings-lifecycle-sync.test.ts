import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePathMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/modules/savings/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/savings/application")>();
  return {
    ...actual,
    detectMaturedSavings: vi.fn(),
    backfillLegacySavingsAccounts: vi.fn(),
    executeSavingsMaturityWorkflow: vi.fn(),
  };
});

import {
  detectMaturedSavings,
  backfillLegacySavingsAccounts,
  executeSavingsMaturityWorkflow,
} from "@/modules/savings/application";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { APP_ROUTE } from "@/modules/tenancy/application/app-path";
import { SavingsMaturityAckAction } from "@/modules/inbox/application/inbox-constants";
import {
  acknowledgeSavingsMaturityAction,
  syncSavingsLifecycleAction,
} from "@/app/[locale]/(product)/money/savings/savings-actions";

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

describe("syncSavingsLifecycleAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-id",
      householdId: "household-id",
      membershipId: "membership-id",
    });
  });

  it("refreshes maturity before a confirmed rollover action", async () => {
    vi.mocked(detectMaturedSavings).mockResolvedValue({
      ok: true,
      maturedCount: 1,
      cascadeCount: 0,
    });
    vi.mocked(executeSavingsMaturityWorkflow).mockResolvedValue({
      status: "success",
    });

    await expect(
      acknowledgeSavingsMaturityAction({
        inboxItemId: "inbox-id",
        action: SavingsMaturityAckAction.CONFIRM_CONFIGURED,
        cycleId: "cycle-id",
        savingId: "saving-id",
      }),
    ).resolves.toEqual({ status: "success" });
    expect(detectMaturedSavings).toHaveBeenCalledTimes(1);
    expect(executeSavingsMaturityWorkflow).toHaveBeenCalledTimes(1);
  });

  it("runs legacy backfill before maturity detection and reports counts", async () => {
    vi.mocked(backfillLegacySavingsAccounts).mockResolvedValue({
      ok: true,
      migratedCount: 2,
    });
    vi.mocked(detectMaturedSavings).mockResolvedValue({
      ok: true,
      maturedCount: 1,
      cascadeCount: 3,
    });

    const result = await syncSavingsLifecycleAction();

    expect(result).toEqual({
      status: "success",
      migratedCount: 2,
      maturedCount: 1,
      cascadeCount: 3,
    });
    expect(
      vi.mocked(backfillLegacySavingsAccounts).mock.invocationCallOrder[0],
    ).toBeLessThan(vi.mocked(detectMaturedSavings).mock.invocationCallOrder[0]);
    expect(revalidatePathMock).toHaveBeenCalledWith(
      APP_ROUTE.MONEY_TRANSACTIONS,
      "page",
    );
  });

  it("surfaces a legacy backfill failure before detection", async () => {
    vi.mocked(backfillLegacySavingsAccounts).mockResolvedValue({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
    vi.mocked(detectMaturedSavings).mockResolvedValue({
      ok: true,
      maturedCount: 0,
      cascadeCount: 0,
    });

    const result = await syncSavingsLifecycleAction();

    expect(result).toEqual({
      status: "error",
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
    expect(vi.mocked(detectMaturedSavings)).not.toHaveBeenCalled();
  });

  it("surfaces detection failures as a typed error state", async () => {
    vi.mocked(backfillLegacySavingsAccounts).mockResolvedValue({
      ok: true,
      migratedCount: 1,
    });
    vi.mocked(detectMaturedSavings).mockResolvedValue({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });

    const result = await syncSavingsLifecycleAction();

    expect(result).toEqual({
      status: "error",
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
