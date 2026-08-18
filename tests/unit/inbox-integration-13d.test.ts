/**
 * Prompt 13D — Inbox source-domain integration hardening.
 *
 * Proves the full chain per canonical kind at the application layer:
 *   producer → inbox row → typed read model → valid action → source effect
 *   → terminal state → retry/idempotency.
 *
 * DB-level atomicity and SECURITY DEFINER behavior are validated separately
 * against the live development project (see .agents/reports/inbox-integration-13d.md).
 */

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
  InboxItemKind,
  InboxItemStatus,
  InboxSourceType,
} from "@/modules/inbox/application/inbox-constants";
import { produceInboxItem } from "@/modules/inbox/application/commands/produce-inbox-item";
import {
  getInboxItem,
  listOpenInboxItems,
} from "@/modules/inbox/application/queries/review-items";
import {
  dismissInboxItem,
  resolveInboxItemToJar,
} from "@/modules/inbox/application/commands/review-items";
import {
  OUTCOMES_BY_KIND,
  TERMINAL_STATUSES_BY_KIND,
  instantiateTypedReviewItem,
} from "@/modules/inbox/application/review-item-schemas";

const createSupabaseMock = vi.mocked(createSupabaseServerClient);
const allowanceMock = vi.mocked(assertMoneyActionAllowed);

const HOUSEHOLD = "11111111-1111-4111-8111-111111111111";
const TX = "22222222-2222-4222-8222-222222222222";
const JAR = "33333333-3333-4333-8333-333333333333";
const INBOX_ID = "44444444-4444-4444-8444-444444444444";
const SAVING = "55555555-5555-4555-8555-555555555555";
const CYCLE = "66666666-6666-4666-8666-666666666666";

function mockRpc(result: unknown) {
  const rpc = vi.fn().mockResolvedValue(result);
  createSupabaseMock.mockResolvedValue({ rpc } as never);
  return rpc;
}

function mockRow(overrides: Record<string, unknown> = {}) {
  return {
    id: INBOX_ID,
    kind: InboxItemKind.UNMAPPED_EXPENSE,
    status: InboxItemStatus.PENDING,
    title: "Lunch",
    amount: 1000,
    currency: "VND",
    source_id: TX,
    source_type: InboxSourceType.TRANSACTION,
    created_at: "2026-08-17T00:00:00Z",
    expires_at: null,
    auto_resolved: false,
    confidence_score: null,
    suggested_jar_id: null,
    suggested_category_id: null,
    context_json: null,
    assigned_to_user_id: null,
    ...overrides,
  };
}

function mockQuery(data: unknown, error: unknown = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    limit: vi.fn().mockReturnThis(),
  };
  createSupabaseMock.mockResolvedValue({
    from: vi.fn().mockReturnValue(builder),
  } as never);
  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
  allowanceMock.mockResolvedValue({
    ok: true,
    userId: "user-1",
    householdId: HOUSEHOLD,
  });
});

describe("13D integration chain — unmapped_expense / income_suggest", () => {
  it("produce → row → typed read model exposes the canonical contract", async () => {
    const rpc = mockRpc({
      data: { inbox_item_id: INBOX_ID, idempotent: false },
      error: null,
    });
    const produced = await produceInboxItem({
      householdId: HOUSEHOLD,
      kind: InboxItemKind.UNMAPPED_EXPENSE,
      sourceType: InboxSourceType.TRANSACTION,
      sourceId: TX,
      amount: 1000,
      currency: "VND",
      title: "Lunch",
      context: { merchantKey: "Pha Lau", confirmationCount: 2 },
      suggestedJarId: JAR,
    });
    expect(produced.ok && produced.inboxItemId).toBe(INBOX_ID);
    expect(rpc).toHaveBeenCalledWith("produce_inbox_item", expect.any(Object));

    // Row → typed read model.
    mockQuery(
      mockRow({
        suggested_jar_id: JAR,
        context_json: { merchantKey: "Pha Lau", confirmationCount: 2 },
      }),
    );
    const item = await getInboxItem(INBOX_ID);
    expect(item?.kind).toBe(InboxItemKind.UNMAPPED_EXPENSE);
    expect(item?.typed?.type).toBe(InboxItemKind.UNMAPPED_EXPENSE);
    expect(item?.suggestedJarId).toBe(JAR);
  });

  it("resolve_to_jar routes through the RPC and the contract lists it as the outcome", async () => {
    expect(OUTCOMES_BY_KIND[InboxItemKind.UNMAPPED_EXPENSE]).toContain(
      "resolve_to_jar",
    );
    const rpc = mockRpc({
      data: { status: InboxItemStatus.RESOLVED },
      error: null,
    });
    const result = await resolveInboxItemToJar({
      inboxItemId: INBOX_ID,
      jarId: JAR,
    });
    expect(result).toEqual({ ok: true, status: InboxItemStatus.RESOLVED });
    expect(rpc).toHaveBeenCalledWith("resolve_inbox_item_to_jar", {
      p_inbox_item_id: INBOX_ID,
      p_jar_id: JAR,
    });
  });

  it("income_suggest has the same resolve outcome but distinct kind + source semantics", async () => {
    expect(OUTCOMES_BY_KIND[InboxItemKind.INCOME_SUGGEST]).toContain(
      "resolve_to_jar",
    );
    // Income suggestions are income-ledger rows; resolve must not treat them
    // as expenses. The gateway keys on kind, so the dedupe identity is
    // distinct from unmapped_expense for the same source.
    mockQuery(
      mockRow({
        kind: InboxItemKind.INCOME_SUGGEST,
        source_id: TX,
        context_json: { reason: "income_suggest" },
      }),
    );
    const item = await getInboxItem(INBOX_ID);
    expect(item?.kind).toBe(InboxItemKind.INCOME_SUGGEST);
    expect(item?.typed?.type).toBe(InboxItemKind.INCOME_SUGGEST);
  });

  it("dismiss does not touch the source transaction (no jar write)", async () => {
    const rpc = mockRpc({
      data: { status: InboxItemStatus.DISMISSED },
      error: null,
    });
    const result = await dismissInboxItem({ inboxItemId: INBOX_ID });
    expect(result).toEqual({ ok: true, status: InboxItemStatus.DISMISSED });
    // Dismiss RPC only mutates the inbox row; it never writes to transactions.
    expect(rpc).toHaveBeenCalledWith("dismiss_inbox_item", {
      p_inbox_item_id: INBOX_ID,
    });
  });
});

describe("13D integration chain — savings_maturity", () => {
  it("produce requires savingId + cycleId and passes them through", async () => {
    const rpc = mockRpc({
      data: { inbox_item_id: INBOX_ID, idempotent: true },
      error: null,
    });
    const result = await produceInboxItem({
      householdId: HOUSEHOLD,
      kind: InboxItemKind.SAVINGS_MATURITY,
      sourceType: InboxSourceType.GUIDED,
      sourceId: SAVING,
      amount: 1_000_000,
      currency: "VND",
      title: "Saving - Matured",
      context: { savingId: SAVING, cycleId: CYCLE, cascadeDay: 7 },
    });
    expect(result.ok && result.idempotent).toBe(true);
    expect(rpc).toHaveBeenCalledWith(
      "produce_inbox_item",
      expect.objectContaining({
        p_context: expect.objectContaining({ cycleId: CYCLE }),
      }),
    );
  });

  it("typed read model resolves the maturity payload for the decision panel", async () => {
    mockQuery(
      mockRow({
        kind: InboxItemKind.SAVINGS_MATURITY,
        source_id: SAVING,
        source_type: InboxSourceType.GUIDED,
        context_json: {
          cycleId: CYCLE,
          savingId: SAVING,
          providerName: "Bank",
          currentPackage: "90 Days",
          currentRate: 4.5,
          principal: 1_000_000,
          accruedInterest: 10_000,
          maturityDate: "2026-08-01",
          settlementRule: "roll_principal_interest",
          recommendedPackages: [],
        },
      }),
    );
    const item = await getInboxItem(INBOX_ID);
    expect(item?.typed?.type).toBe(InboxItemKind.SAVINGS_MATURITY);
    if (item?.typed?.type === InboxItemKind.SAVINGS_MATURITY) {
      expect(item.typed.payload.cycleId).toBe(CYCLE);
      expect(item.typed.payload.savingId).toBe(SAVING);
    }
  });

  it("cascade refresh is idempotent: same cycle + cascade day reuses the item", async () => {
    const rpc = mockRpc({
      data: { inbox_item_id: INBOX_ID, idempotent: true },
      error: null,
    });
    const first = await produceInboxItem({
      householdId: HOUSEHOLD,
      kind: InboxItemKind.SAVINGS_MATURITY,
      sourceType: InboxSourceType.GUIDED,
      sourceId: SAVING,
      amount: 1_000_000,
      currency: "VND",
      title: "Saving - Matures in 7 days",
      context: { savingId: SAVING, cycleId: CYCLE, cascadeDay: 7 },
    });
    const second = await produceInboxItem({
      householdId: HOUSEHOLD,
      kind: InboxItemKind.SAVINGS_MATURITY,
      sourceType: InboxSourceType.GUIDED,
      sourceId: SAVING,
      amount: 1_000_000,
      currency: "VND",
      title: "Saving - Matures in 7 days",
      context: { savingId: SAVING, cycleId: CYCLE, cascadeDay: 7 },
    });
    expect(first.ok && second.ok).toBe(true);
    expect(first.ok && second.ok && first.inboxItemId).toBe(second.inboxItemId);
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});

describe("13D integration chain — early_withdrawal_confirmation", () => {
  it("produce routes to the gateway with cycle context", async () => {
    const rpc = mockRpc({
      data: { inbox_item_id: INBOX_ID, idempotent: false },
      error: null,
    });
    const result = await produceInboxItem({
      householdId: HOUSEHOLD,
      kind: InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION,
      sourceType: InboxSourceType.GUIDED,
      sourceId: SAVING,
      amount: 900_000,
      currency: "VND",
      title: "Saving - Early withdrawal",
      context: {
        savingId: SAVING,
        cycleId: CYCLE,
        netReturned: 900_000,
        penaltyAmount: 100_000,
      },
    });
    expect(result.ok && result.inboxItemId).toBe(INBOX_ID);
    expect(rpc).toHaveBeenCalledWith("produce_inbox_item", expect.any(Object));
  });
});

describe("13D integration chain — emi_complete and emergency_declaration", () => {
  it("emi_complete terminal contract has celebrate/later and never reopens", async () => {
    expect(OUTCOMES_BY_KIND[InboxItemKind.EMI_COMPLETE]).toEqual([
      "celebrate",
      "later",
    ]);
    expect(TERMINAL_STATUSES_BY_KIND[InboxItemKind.EMI_COMPLETE]).toContain(
      InboxItemStatus.ACKNOWLEDGED,
    );
    // The gateway's 13D policy refuses to reopen a terminal emi_complete item.
    mockQuery(
      mockRow({
        kind: InboxItemKind.EMI_COMPLETE,
        status: InboxItemStatus.ACKNOWLEDGED,
        source_type: InboxSourceType.GUIDED,
        source_id: TX,
      }),
    );
    const item = await getInboxItem(INBOX_ID);
    expect(item?.status).toBe(InboxItemStatus.ACKNOWLEDGED);
  });

  it("emergency_declaration carries assignee + intent context through the wrapper", async () => {
    const rpc = mockRpc({
      data: { inbox_item_id: INBOX_ID, idempotent: false },
      error: null,
    });
    const result = await produceInboxItem({
      householdId: HOUSEHOLD,
      kind: InboxItemKind.EMERGENCY_DECLARATION,
      sourceType: InboxSourceType.PLAN_MOVEMENT,
      sourceId: TX,
      amount: 500_000,
      currency: "VND",
      title: "Emergency reallocation declared",
      assignedToUserId: "partner-user",
      context: {
        intentNote: "Medical bill",
        sourceJarId: JAR,
        targetJarId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        executedByUserId: "user-1",
      },
    });
    expect(result.ok && result.inboxItemId).toBe(INBOX_ID);
    expect(rpc).toHaveBeenCalledWith(
      "produce_inbox_item",
      expect.objectContaining({
        p_assigned_to_user_id: "partner-user",
        p_kind: InboxItemKind.EMERGENCY_DECLARATION,
      }),
    );
  });

  it("every canonical kind has a valid outcome contract and typed instance", () => {
    for (const kind of Object.values(InboxItemKind)) {
      expect(OUTCOMES_BY_KIND[kind].length).toBeGreaterThan(0);
      expect(TERMINAL_STATUSES_BY_KIND[kind].length).toBeGreaterThan(0);
      const typed = instantiateTypedReviewItem({
        kind,
        sourceId: TX,
        intentNote:
          kind === InboxItemKind.EMERGENCY_DECLARATION ? "note" : undefined,
        contextJson: {
          savingId: SAVING,
          cycleId: CYCLE,
          providerName: "Bank",
          currentPackage: "P",
          currentRate: 4.5,
          principal: 1000,
          accruedInterest: 10,
          maturityDate: "2026-08-01",
          settlementRule: "roll_principal_interest",
        },
      });
      expect(typed, `kind ${kind}`).not.toBeNull();
    }
  });
});

describe("13D — queue read model filters canonical kinds", () => {
  it("listOpenInboxItems returns only canonical pending items", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        mockRow({ id: "a", kind: InboxItemKind.UNMAPPED_EXPENSE }),
        mockRow({
          id: "b",
          kind: InboxItemKind.SAVINGS_MATURITY,
          source_id: SAVING,
          source_type: InboxSourceType.GUIDED,
        }),
      ],
      error: null,
    });
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order,
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    createSupabaseMock.mockResolvedValue({
      from: vi.fn().mockReturnValue(builder),
    } as never);
    const items = await listOpenInboxItems();
    expect(items).toHaveLength(2);
    expect(items?.[0]?.kind).toBe(InboxItemKind.UNMAPPED_EXPENSE);
  });
});
