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
  updateTransaction,
  updateTransactionInputSchema,
  deleteTransaction,
} from "@/modules/ledger/application/commands/update-transaction";
import { mapTransactionRow } from "@/modules/ledger/application/transaction-types";

const accountId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const transactionId = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

describe("updateTransactionInputSchema", () => {
  it("requires positive amount and direction", () => {
    expect(
      updateTransactionInputSchema.safeParse({
        transactionId,
        accountId,
        type: "income",
        amount: 1000,
      }).success,
    ).toBe(true);
    expect(
      updateTransactionInputSchema.safeParse({
        transactionId,
        accountId,
        type: "income",
        amount: 0,
      }).success,
    ).toBe(false);
  });
});

describe("mapTransactionRow jar name", () => {
  it("includes jarName when joined", () => {
    expect(
      mapTransactionRow({
        id: transactionId,
        account_id: accountId,
        type: "expense",
        amount: 10,
        currency: "VND",
        transaction_date: "2026-08-02",
        note: null,
        category_id: null,
        jar_id: "j1",
        created_at: "2026-08-02T00:00:00Z",
        jars: { name: "Needs" },
      }).jarName,
    ).toBe("Needs");
  });
});

describe("updateTransaction / deleteTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks update without membership", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: "no_membership",
    });
    await expect(
      updateTransaction({
        transactionId,
        accountId,
        type: "expense",
        amount: 20,
      }),
    ).resolves.toEqual({ ok: false, code: "no_membership" });
  });

  it("calls update_transaction rpc", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: async () => ({
        data: { transaction_id: transactionId },
        error: null,
      }),
    } as never);

    await expect(
      updateTransaction({
        transactionId,
        accountId,
        type: "expense",
        amount: 20,
      }),
    ).resolves.toEqual({ ok: true, transactionId });
  });

  it("calls delete_transaction rpc", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: async () => ({
        data: { transaction_id: transactionId, deleted: true },
        error: null,
      }),
    } as never);

    await expect(deleteTransaction({ transactionId })).resolves.toEqual({
      ok: true,
      transactionId,
    });
  });
});
