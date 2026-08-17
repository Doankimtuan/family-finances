import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  isGuidedKind,
  isJarResolvableKind,
  mapInboxKind,
  InboxItemKind,
} from "@/modules/inbox/application/inbox-constants";
import {
  acknowledgeInboxItem,
  acknowledgeInboxItemInputSchema,
  dismissInboxItem,
  dismissInboxItemInputSchema,
} from "@/modules/inbox/application/commands/review-items";
import { runInboxStalenessWorker } from "@/modules/inbox/application/workers/resolve-stale-inbox-items";
import { mapInboxRow } from "@/modules/inbox/application/mappers/inbox-item.mapper";

const inboxItemId = "550e8400-e29b-41d4-a716-446655440000";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("inbox kind helpers (ST-E06-002 / Prompt 13A)", () => {
  it("maps canonical storage kinds", () => {
    expect(mapInboxKind("unmapped_expense")).toBe(
      InboxItemKind.UNMAPPED_EXPENSE,
    );
    expect(mapInboxKind("savings_maturity")).toBe(
      InboxItemKind.SAVINGS_MATURITY,
    );
    expect(mapInboxKind("emi_complete")).toBe(InboxItemKind.EMI_COMPLETE);
    expect(isJarResolvableKind(InboxItemKind.UNMAPPED_EXPENSE)).toBe(true);
    expect(isJarResolvableKind(InboxItemKind.SAVINGS_MATURITY)).toBe(false);
    expect(isGuidedKind(InboxItemKind.EMI_COMPLETE)).toBe(true);
  });

  it("merges legacy savings kinds onto the canonical savings_maturity kind", () => {
    expect(mapInboxKind("savings_matured")).toBe(
      InboxItemKind.SAVINGS_MATURITY,
    );
    expect(mapInboxKind("renewal_required")).toBe(
      InboxItemKind.SAVINGS_MATURITY,
    );
  });

  it("maps removed kinds to null so they can never enter the queue", () => {
    expect(mapInboxKind("penalty_warning")).toBeNull();
    expect(mapInboxKind("rate_changed_suggestion")).toBeNull();
    expect(mapInboxKind("package_expired")).toBeNull();
    expect(mapInboxKind("payment_reminder")).toBeNull();
  });
});

describe("dismiss / acknowledge schemas", () => {
  it("requires uuid for dismiss", () => {
    expect(
      dismissInboxItemInputSchema.safeParse({ inboxItemId: "nope" }).success,
    ).toBe(false);
    expect(
      dismissInboxItemInputSchema.safeParse({
        inboxItemId: "550e8400-e29b-41d4-a716-446655440000",
      }).success,
    ).toBe(true);
  });

  it("accepts maturity, early-withdrawal and EMI actions only", () => {
    expect(
      acknowledgeInboxItemInputSchema.safeParse({
        inboxItemId: "550e8400-e29b-41d4-a716-446655440000",
        action: "renew",
      }).success,
    ).toBe(true);
    expect(
      acknowledgeInboxItemInputSchema.safeParse({
        inboxItemId: "550e8400-e29b-41d4-a716-446655440000",
        action: "celebrate",
      }).success,
    ).toBe(true);
    expect(
      acknowledgeInboxItemInputSchema.safeParse({
        inboxItemId: "550e8400-e29b-41d4-a716-446655440000",
        action: "confirm",
      }).success,
    ).toBe(true);
    expect(
      acknowledgeInboxItemInputSchema.safeParse({
        inboxItemId: "550e8400-e29b-41d4-a716-446655440000",
        action: "delete",
      }).success,
    ).toBe(false);
  });
});

describe("review-item command and worker contracts", () => {
  beforeEach(() => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-1",
      householdId: "household-1",
    });
  });

  it("keeps dismiss and acknowledge RPC result shapes stable", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: { status: "dismissed" }, error: null })
      .mockResolvedValueOnce({ data: { status: "acknowledged" }, error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc } as never);

    await expect(dismissInboxItem({ inboxItemId })).resolves.toEqual({
      ok: true,
      status: "dismissed",
    });
    await expect(
      acknowledgeInboxItem({ inboxItemId, action: "celebrate" }),
    ).resolves.toEqual({
      ok: true,
      status: "acknowledged",
      cascadeCancelledCount: 0,
    });
  });

  it("maps the staleness worker count without changing its result contract", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { expired_count: "2" },
      error: null,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc } as never);

    await expect(runInboxStalenessWorker()).resolves.toEqual({
      ok: true,
      expiredCount: 2,
    });
  });
});

describe("inbox item mapper", () => {
  it("preserves display fallback and normalized money fields", () => {
    expect(
      mapInboxRow({
        id: inboxItemId,
        kind: "unmapped_expense",
        status: "pending",
        title: "Unmapped expense",
        amount: "125000",
        currency: "vnd",
        source_id: inboxItemId,
        source_type: "transaction",
        created_at: "2026-08-17T00:00:00Z",
        context_json: { note: "Lunch" },
      }),
    ).toMatchObject({
      displayTitle: "Lunch",
      amount: 125000,
      currency: "VND",
      sourceType: "transaction",
    });
  });

  it("returns null for legacy removed kinds", () => {
    expect(
      mapInboxRow({
        id: inboxItemId,
        kind: "payment_reminder",
        status: "pending",
        title: "Payment due",
        amount: 100,
        currency: "VND",
        source_id: inboxItemId,
        source_type: "guided",
        created_at: "2026-08-17T00:00:00Z",
        context_json: null,
      }),
    ).toBeNull();
  });
});
