import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { syncAction, routerMock } = vi.hoisted(() => {
  const syncAction = vi.fn();
  const refresh = vi.fn();
  return { syncAction, refresh, routerMock: { refresh } };
});

vi.mock("@/app/[locale]/(product)/money/savings/savings-actions", () => ({
  syncSavingsLifecycleAction: syncAction,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

import { SavingsLifecycleSync } from "@/app/[locale]/(product)/money/savings/savings-lifecycle-sync";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

const { refresh } = routerMock;

describe("SavingsLifecycleSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncs once on mount and refreshes when the sync changed data", async () => {
    syncAction.mockResolvedValue({
      status: "success",
      migratedCount: 1,
      maturedCount: 0,
      cascadeCount: 2,
    });

    const { rerender } = render(<SavingsLifecycleSync />);
    await waitFor(() => expect(syncAction).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));

    rerender(<SavingsLifecycleSync />);
    await act(async () => {});
    expect(syncAction).toHaveBeenCalledTimes(1);
  });

  it("does not refresh when the sync found nothing to change", async () => {
    syncAction.mockResolvedValue({
      status: "success",
      migratedCount: 0,
      maturedCount: 0,
      cascadeCount: 0,
    });

    render(<SavingsLifecycleSync />);
    await waitFor(() => expect(syncAction).toHaveBeenCalledTimes(1));
    await act(async () => {});

    expect(refresh).not.toHaveBeenCalled();
  });

  it("swallows typed sync failures without refreshing", async () => {
    syncAction.mockResolvedValue({
      status: "error",
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });

    render(<SavingsLifecycleSync />);
    await waitFor(() => expect(syncAction).toHaveBeenCalledTimes(1));
    await act(async () => {});

    expect(refresh).not.toHaveBeenCalled();
  });
});
