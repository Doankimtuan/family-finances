import { describe, expect, it, vi, beforeEach } from "vitest";

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

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  recordTransaction,
  recordTransactionInputSchema,
} from "@/modules/ledger/application/commands/record-transaction";
import {
  applyTransactionDeltas,
  mapTransactionRow,
} from "@/modules/ledger/application/transaction-types";

describe("recordTransactionInputSchema", () => {
  const accountId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  it("requires positive whole amount and direction", () => {
    expect(
      recordTransactionInputSchema.safeParse({
        accountId,
        type: "expense",
        amount: 50000,
      }).success,
    ).toBe(true);
    expect(
      recordTransactionInputSchema.safeParse({
        accountId,
        type: "expense",
        amount: -1,
      }).success,
    ).toBe(false);
    expect(
      recordTransactionInputSchema.safeParse({
        accountId,
        type: "expense",
        amount: 1.5,
      }).success,
    ).toBe(false);
  });
});

describe("applyTransactionDeltas", () => {
  it("adds income and subtracts expense from opening balances", () => {
    const accounts = applyTransactionDeltas(
      [
        {
          id: "a1",
          name: "Cash",
          type: "cash",
          balance: 100,
          isArchived: false,
        },
      ],
      [
        { accountId: "a1", type: "income", amount: 40 },
        { accountId: "a1", type: "expense", amount: 15 },
      ],
    );
    expect(accounts[0]?.balance).toBe(125);
  });
});

describe("mapTransactionRow", () => {
  it("maps positive magnitude with explicit type", () => {
    expect(
      mapTransactionRow({
        id: "t1",
        account_id: "a1",
        type: "expense",
        amount: "20000",
        currency: "vnd",
        transaction_date: "2026-08-02",
        note: "Lunch",
        category_id: null,
        jar_id: null,
        created_at: "2026-08-02T00:00:00Z",
        accounts: { name: "Cash" },
        categories: null,
      }),
    ).toMatchObject({
      type: "expense",
      amount: 20000,
      accountName: "Cash",
      note: "Lunch",
    });
  });
});

describe("recordTransaction", () => {
  const accountId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const idempotencyKey = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no_membership when gate fails", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: "no_membership",
    });

    await expect(
      recordTransaction({
        accountId,
        type: "expense",
        amount: 10,
      }),
    ).resolves.toEqual({ ok: false, code: "no_membership" });
  });

  it("calls record_transaction rpc when allowed", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: async () => ({
        data: {
          transaction_id: "tx-1",
          inbox_item_id: "inbox-1",
          idempotent: false,
        },
        error: null,
      }),
    } as never);

    await expect(
      recordTransaction({
        accountId,
        type: "expense",
        amount: 25000,
        idempotencyKey,
      }),
    ).resolves.toEqual({
      ok: true,
      transactionId: "tx-1",
      inboxItemId: "inbox-1",
      idempotent: false,
    });
  });
});
