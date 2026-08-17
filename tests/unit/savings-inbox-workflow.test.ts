import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  acknowledgeMock,
  confirmMock,
  settleMock,
  renewMock,
  createSupabaseMock,
} = vi.hoisted(() => ({
  acknowledgeMock: vi.fn(),
  confirmMock: vi.fn(),
  settleMock: vi.fn(),
  renewMock: vi.fn(),
  createSupabaseMock: vi.fn(),
}));

vi.mock("@/modules/inbox/application/commands/review-items", () => ({
  acknowledgeInboxItem: acknowledgeMock,
}));
vi.mock("@/modules/savings/application/commands/early-withdraw", () => ({
  confirmEarlyWithdrawal: confirmMock,
}));
vi.mock("@/modules/savings/application/commands/settle-saving", () => ({
  settleSaving: settleMock,
  renewSaving: renewMock,
}));
vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseMock,
}));

import {
  executeEarlyWithdrawalWorkflow,
  executeSavingsMaturityWorkflow,
} from "@/modules/savings/application/commands/savings-inbox-workflow";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { upsertSavingsEarlyWithdrawalInboxItem } from "@/modules/inbox/application/commands/savings-workflow";

describe("Savings Inbox workflow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps a successful withdrawal when Inbox acknowledgement fails", async () => {
    confirmMock.mockResolvedValue({
      ok: true,
      savingId: "saving-id",
      cycleId: "cycle-id",
      netReturned: 900,
    });
    acknowledgeMock.mockResolvedValue({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });

    await expect(
      executeEarlyWithdrawalWorkflow({
        context: { householdId: "household-id" },
        inboxItemId: "inbox-id",
        action: "confirm",
        savingId: "saving-id",
        cycleId: "cycle-id",
      }),
    ).resolves.toEqual({
      status: "success",
      id: "saving-id",
      netAmount: 900,
    });
  });

  it("keeps a successful settlement when Inbox acknowledgement fails", async () => {
    settleMock.mockResolvedValue({
      ok: true,
      savingId: "saving-id",
      cycleId: "cycle-id",
      netAmount: 1200,
    });
    acknowledgeMock.mockResolvedValue({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });

    await expect(
      executeSavingsMaturityWorkflow({
        context: { householdId: "household-id" },
        inboxItemId: "inbox-id",
        action: "withdraw",
        savingId: "saving-id",
        cycleId: "cycle-id",
      }),
    ).resolves.toEqual({
      status: "success",
      id: "saving-id",
      cycleId: "cycle-id",
      netAmount: 1200,
    });
  });

  it("does not acknowledge Inbox when the Savings mutation fails", async () => {
    settleMock.mockResolvedValue({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });

    await expect(
      executeSavingsMaturityWorkflow({
        context: { householdId: "household-id" },
        inboxItemId: "inbox-id",
        action: "withdraw",
        savingId: "saving-id",
        cycleId: "cycle-id",
      }),
    ).resolves.toEqual({
      status: "error",
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
    expect(acknowledgeMock).not.toHaveBeenCalled();
  });

  it("creates an early-withdrawal item through the producer gateway", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { inbox_item_id: "inbox-id", idempotent: false },
      error: null,
    });
    createSupabaseMock.mockResolvedValue({ rpc } as never);

    await expect(
      upsertSavingsEarlyWithdrawalInboxItem({
        householdId: "household-id",
        savingId: "saving-id",
        amount: 900,
        currency: "VND",
        title: "Savings - Early withdrawal",
        context: {
          savingId: "saving-id",
          cycleId: "cycle-id",
          principal: 1000,
          accruedInterest: 20,
          eligibleInterest: 10,
          penaltyAmount: 5,
          netReturned: 900,
          penaltyStrategy: "simple",
          daysHeld: 10,
          totalTermDays: 30,
          quoteReady: true,
          settlementAccountId: "account-id",
          warnPenalty: true,
          cascadeDay: "early",
        },
      }),
    ).resolves.toEqual({ ok: true, inboxItemId: "inbox-id" });
    expect(rpc).toHaveBeenCalledWith("produce_inbox_item", expect.any(Object));
  });

  it("returns a typed failure when the gateway rejects the request", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Invalid early withdrawal context" },
    });
    createSupabaseMock.mockResolvedValue({ rpc } as never);

    const result = await upsertSavingsEarlyWithdrawalInboxItem({
      householdId: "household-id",
      savingId: "saving-id",
      amount: 900,
      currency: "VND",
      title: "Savings - Early withdrawal",
      context: {
        savingId: "saving-id",
        cycleId: "cycle-id",
        principal: 1000,
        accruedInterest: 20,
        eligibleInterest: 10,
        penaltyAmount: 5,
        netReturned: 900,
        penaltyStrategy: "simple",
        daysHeld: 10,
        totalTermDays: 30,
        quoteReady: true,
        settlementAccountId: "account-id",
        warnPenalty: true,
        cascadeDay: "early",
      },
    });

    expect(result).toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
  });
});
