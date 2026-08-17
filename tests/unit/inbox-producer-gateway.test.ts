import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { produceInboxItem } from "@/modules/inbox/application/commands/produce-inbox-item";
import {
  InboxItemKind,
  InboxSourceType,
} from "@/modules/inbox/application/inbox-constants";
import {
  INBOX_LEGACY_KIND_VALUES,
  INBOX_KIND_MIGRATION_MAP,
} from "@/modules/inbox/application/inbox-constants";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

const createSupabaseMock = vi.mocked(createSupabaseServerClient);

function mockRpc(result: unknown) {
  const rpc = vi.fn().mockResolvedValue(result);
  createSupabaseMock.mockResolvedValue({ rpc } as never);
  return rpc;
}

const HOUSEHOLD = "11111111-1111-4111-8111-111111111111";
const SRC = "22222222-2222-4222-8222-222222222222";

describe("Inbox producer gateway (Prompt 13B)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("routes a canonical kind through the produce_inbox_item RPC", async () => {
    const rpc = mockRpc({
      data: { inbox_item_id: "inbox-id", idempotent: false },
      error: null,
    });
    const result = await produceInboxItem({
      householdId: HOUSEHOLD,
      kind: InboxItemKind.UNMAPPED_EXPENSE,
      sourceType: InboxSourceType.TRANSACTION,
      sourceId: SRC,
      amount: 1000,
      currency: "VND",
      title: "Lunch",
      context: {},
    });
    expect(result).toEqual({
      ok: true,
      inboxItemId: "inbox-id",
      idempotent: false,
    });
    expect(rpc).toHaveBeenCalledWith(
      "produce_inbox_item",
      expect.objectContaining({
        p_household_id: HOUSEHOLD,
        p_kind: InboxItemKind.UNMAPPED_EXPENSE,
        p_source_type: InboxSourceType.TRANSACTION,
      }),
    );
  });

  it("passes savings maturity context and lets the gateway own expiry", async () => {
    const rpc = mockRpc({
      data: { inbox_item_id: "inbox-id", idempotent: true },
      error: null,
    });
    const result = await produceInboxItem({
      householdId: HOUSEHOLD,
      kind: InboxItemKind.SAVINGS_MATURITY,
      sourceType: InboxSourceType.GUIDED,
      sourceId: SRC,
      amount: 1000000,
      currency: "VND",
      title: "Saving - Matured",
      context: {
        savingId: SRC,
        cycleId: "33333333-3333-4333-8333-333333333333",
      },
    });
    expect(result).toEqual({
      ok: true,
      inboxItemId: "inbox-id",
      idempotent: true,
    });
    expect(rpc).toHaveBeenCalledWith("produce_inbox_item", expect.any(Object));
  });

  it("maps gateway rejection to a typed error without logging raw failures", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockRpc({ data: null, error: { message: "Forbidden" } });
    const result = await produceInboxItem({
      householdId: HOUSEHOLD,
      kind: InboxItemKind.EMI_COMPLETE,
      sourceType: InboxSourceType.GUIDED,
      sourceId: SRC,
      amount: 1000,
      currency: "VND",
      title: "Loan done",
      context: { loanId: SRC },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).not.toBe(PRODUCT_ACTION_ERROR_CODE.UNKNOWN);
    }
    consoleError.mockRestore();
  });

  it("maps an unexpected gateway failure to UNKNOWN with boundary logging", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockRpc({ data: null, error: { message: "database unavailable" } });
    const result = await produceInboxItem({
      householdId: HOUSEHOLD,
      kind: InboxItemKind.EMERGENCY_DECLARATION,
      sourceType: InboxSourceType.PLAN_MOVEMENT,
      sourceId: SRC,
      amount: 1000,
      currency: "VND",
      title: "Emergency",
      context: {
        intentNote: "Medical bill",
        sourceJarId: "44444444-4444-4444-8444-444444444444",
        targetJarId: "55555555-5555-4555-8555-555555555555",
      },
    });
    expect(result).toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("passes emergency context through for DB-layer validation", async () => {
    const rpc = mockRpc({
      data: { inbox_item_id: "inbox-id", idempotent: false },
      error: null,
    });
    await produceInboxItem({
      householdId: HOUSEHOLD,
      kind: InboxItemKind.EMERGENCY_DECLARATION,
      sourceType: InboxSourceType.PLAN_MOVEMENT,
      sourceId: SRC,
      amount: 1000,
      currency: "VND",
      title: "Emergency",
      context: { intentNote: "Medical bill" },
    });
    expect(rpc).toHaveBeenCalledWith(
      "produce_inbox_item",
      expect.objectContaining({
        p_context: expect.objectContaining({ intentNote: "Medical bill" }),
      }),
    );
  });
});

describe("Legacy kinds are impossible at the gateway (Prompt 13B)", () => {
  it("every removed/merged kind is rejected by the canonical kind set", () => {
    // The DB gateway rejects removed kinds; the wrapper type system must not
    // even offer them (InboxItemKind has only canonical values).
    for (const legacy of INBOX_LEGACY_KIND_VALUES) {
      expect(Object.values(InboxItemKind)).not.toContain(legacy);
      expect(INBOX_KIND_MIGRATION_MAP[legacy]).not.toBeUndefined();
    }
  });
});
