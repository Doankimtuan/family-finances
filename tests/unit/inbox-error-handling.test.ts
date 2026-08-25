import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  acknowledgeInboxItem,
  autoResolveInboxItem,
  dismissInboxItem,
  resolveInboxItemToJar,
} from "@/modules/inbox/application/commands/review-items";
import {
  classifyInboxRpcError,
  logInboxFailure,
} from "@/modules/inbox/application/inbox-error";
import {
  INBOX_ERROR_CODE,
  INBOX_OPERATION,
  InboxItemKind,
  InboxItemStatus,
  InboxSourceType,
  EmiAckAction,
} from "@/modules/inbox/application/inbox-constants";
import {
  countOpenInboxItems,
  listOpenInboxItems,
} from "@/modules/inbox/application/queries/review-items";
import { runInboxStalenessWorker } from "@/modules/inbox/application/workers/resolve-stale-inbox-items";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

const INBOX_ITEM_ID = "550e8400-e29b-41d4-a716-446655440000";
const JAR_ID = "650e8400-e29b-41d4-a716-446655440000";

function mockAllowance(): void {
  vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
    ok: true,
    userId: "user-1",
    householdId: "household-1",
  });
}

function mockRpc(result: unknown): ReturnType<typeof vi.fn> {
  const rpc = vi.fn().mockResolvedValue(result);
  vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc } as never);
  return rpc;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Inbox RPC error classification", () => {
  it("prefers structured codes over legacy text", () => {
    expect(
      classifyInboxRpcError({
        details: INBOX_ERROR_CODE.ITEM_NOT_FOUND,
        message: "Invalid jar",
      }),
    ).toBe(INBOX_ERROR_CODE.ITEM_NOT_FOUND);
  });

  it("keeps legacy domain mapping at the Inbox boundary", () => {
    expect(classifyInboxRpcError({ message: "Inbox item not found" })).toBe(
      INBOX_ERROR_CODE.ITEM_NOT_FOUND,
    );
    expect(classifyInboxRpcError({ message: "Invalid EMI action" })).toBe(
      INBOX_ERROR_CODE.INVALID_ACTION,
    );
    expect(classifyInboxRpcError({ message: "Forbidden" })).toBe(
      INBOX_ERROR_CODE.PERMISSION_DENIED,
    );
    expect(classifyInboxRpcError({ message: "Item is a stale item" })).toBe(
      INBOX_ERROR_CODE.STALE_ITEM,
    );
  });
});

describe("Inbox command Results", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAllowance();
  });

  it("preserves not-found and permission failures", async () => {
    mockRpc({ data: null, error: { message: "Inbox item not found" } });
    await expect(
      dismissInboxItem({ inboxItemId: INBOX_ITEM_ID }),
    ).resolves.toEqual({
      ok: false,
      code: INBOX_ERROR_CODE.ITEM_NOT_FOUND,
    });

    mockRpc({ data: null, error: { message: "Forbidden" } });
    await expect(
      acknowledgeInboxItem({
        inboxItemId: INBOX_ITEM_ID,
        action: EmiAckAction.CELEBRATE,
      }),
    ).resolves.toEqual({
      ok: false,
      code: INBOX_ERROR_CODE.PERMISSION_DENIED,
    });
  });

  it("preserves invalid transition and invalid target failures", async () => {
    mockRpc({ data: null, error: { message: "Item cannot be acknowledged" } });
    await expect(
      acknowledgeInboxItem({
        inboxItemId: INBOX_ITEM_ID,
        action: EmiAckAction.CELEBRATE,
      }),
    ).resolves.toEqual({
      ok: false,
      code: INBOX_ERROR_CODE.INVALID_TRANSITION,
    });

    mockRpc({ data: null, error: { message: "Invalid jar" } });
    await expect(
      resolveInboxItemToJar({ inboxItemId: INBOX_ITEM_ID, jarId: JAR_ID }),
    ).resolves.toEqual({
      ok: false,
      code: INBOX_ERROR_CODE.INVALID_JAR,
    });
  });

  it("keeps already completed transitions idempotent", async () => {
    mockRpc({ data: { status: InboxItemStatus.DISMISSED }, error: null });
    await expect(
      dismissInboxItem({ inboxItemId: INBOX_ITEM_ID }),
    ).resolves.toEqual({
      ok: true,
      status: InboxItemStatus.DISMISSED,
    });
  });

  it("maps auto-resolution eligibility failures without a pre-read", async () => {
    const rpc = mockRpc({
      data: null,
      error: { message: "Confidence below auto-resolve threshold" },
    });

    await expect(
      autoResolveInboxItem({ inboxItemId: INBOX_ITEM_ID }),
    ).resolves.toEqual({
      ok: false,
      code: INBOX_ERROR_CODE.AUTO_RESOLVE_NOT_ELIGIBLE,
    });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("logs unexpected command failures with safe context", async () => {
    const thrown = new Error("database unavailable");
    vi.mocked(createSupabaseServerClient).mockRejectedValueOnce(thrown);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(
      dismissInboxItem({ inboxItemId: INBOX_ITEM_ID }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: INBOX_OPERATION.DISMISS,
        error: thrown,
        context: expect.objectContaining({
          householdId: "household-1",
          inboxItemId: INBOX_ITEM_ID,
        }),
      }),
    );
  });
});

describe("Inbox queries and staleness worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAllowance();
  });

  it("returns the bounded pending-item count for navigation badges", async () => {
    const countResult = {
      data: null,
      count: 3,
      error: null,
    };
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi
        .fn()
        // First .or() is the canonical-kind filter.
        .mockImplementationOnce(function (this: unknown) {
          return this;
        })
        // Second .or() is the assignee visibility filter — resolves the query.
        .mockResolvedValueOnce(countResult),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn().mockReturnValue(builder),
    } as never);

    await expect(countOpenInboxItems()).resolves.toBe(3);
    expect(builder.select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
  });

  it("logs query failures instead of presenting them as an empty queue", async () => {
    const order = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST000", message: "database unavailable" },
    });
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order,
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn().mockReturnValue(builder),
    } as never);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(listOpenInboxItems()).resolves.toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: INBOX_OPERATION.LIST_OPEN,
        context: expect.objectContaining({ householdId: "household-1" }),
      }),
    );
  });

  it("keeps the row readable when a related query fails", async () => {
    const listOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: INBOX_ITEM_ID,
          kind: InboxItemKind.UNMAPPED_EXPENSE,
          status: InboxItemStatus.PENDING,
          title: "Lunch",
          amount: 100,
          currency: "VND",
          source_id: JAR_ID,
          source_type: InboxSourceType.TRANSACTION,
          created_at: "2026-08-17T00:00:00.000Z",
          context_json: null,
        },
      ],
      error: null,
    });
    const listBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: listOrder,
    };
    const transactionBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST000", message: "transaction lookup failed" },
      }),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi
        .fn()
        .mockReturnValueOnce(listBuilder)
        .mockReturnValueOnce(transactionBuilder),
    } as never);
    await expect(listOpenInboxItems()).resolves.toMatchObject([
      { id: INBOX_ITEM_ID, enrichmentState: "UNAVAILABLE" },
    ]);
  });

  it("fails the atomic worker as a whole and logs the run context", async () => {
    const thrown = new Error("worker unavailable");
    vi.mocked(createSupabaseServerClient).mockRejectedValueOnce(thrown);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(runInboxStalenessWorker()).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: INBOX_OPERATION.STALENESS_WORKER,
        error: thrown,
      }),
    );
  });

  it("rejects malformed worker summaries instead of reporting zero", async () => {
    mockRpc({ data: { expired_count: "not-a-number" }, error: null });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(runInboxStalenessWorker()).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: INBOX_OPERATION.STALENESS_WORKER,
        context: expect.objectContaining({ responseInvalid: true }),
      }),
    );
  });

  it("keeps successful worker counts unchanged", async () => {
    mockRpc({ data: { expired_count: "2" }, error: null });
    await expect(runInboxStalenessWorker()).resolves.toEqual({
      ok: true,
      expiredCount: 2,
    });
  });
});

describe("Inbox failure logging", () => {
  it("does not need a raw Inbox payload to diagnose a failure", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    logInboxFailure(new Error("unexpected"), INBOX_OPERATION.GET_ITEM, {
      householdId: "household-1",
      inboxItemId: INBOX_ITEM_ID,
    });

    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: INBOX_OPERATION.GET_ITEM,
        context: {
          householdId: "household-1",
          inboxItemId: INBOX_ITEM_ID,
        },
      }),
    );
  });
});
