import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/savings/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/savings/application")>();
  return {
    ...actual,
    detectMaturedSavings: vi.fn(),
    backfillLegacySavingsAccounts: vi.fn(),
  };
});

import {
  detectMaturedSavings,
  backfillLegacySavingsAccounts,
} from "@/modules/savings/application";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { syncSavingsLifecycleAction } from "@/app/[locale]/(product)/money/savings/savings-actions";

describe("syncSavingsLifecycleAction", () => {
  beforeEach(() => vi.clearAllMocks());

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
    ).toBeLessThan(
      vi.mocked(detectMaturedSavings).mock.invocationCallOrder[0],
    );
  });

  it("still detects maturity when the legacy backfill cannot run", async () => {
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
      status: "success",
      migratedCount: 0,
      maturedCount: 0,
      cascadeCount: 0,
    });
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
  });
});
