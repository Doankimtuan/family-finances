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
  MONEY_ACTION_DENIED_REASON,
  PRODUCT_ACTION_ERROR_CODE,
} from "@/modules/tenancy/application/tenancy-constants";
import {
  updateTransaction,
  updateTransactionInputSchema,
  deleteTransaction,
} from "@/modules/ledger/application/commands/update-transaction";
import { mapTransactionRow } from "@/modules/ledger/application/transaction-types";
import {
  LEDGER_ACTION_ERROR_CODE,
  TransactionDirection,
} from "@/modules/ledger/application/ledger-constants";

const accountId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const transactionId = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

describe("updateTransactionInputSchema", () => {
  it("requires positive amount and direction", () => {
    expect(
      updateTransactionInputSchema.safeParse({
        transactionId,
        accountId,
        type: TransactionDirection.INCOME,
        amount: 1000,
      }).success,
    ).toBe(true);
    expect(
      updateTransactionInputSchema.safeParse({
        transactionId,
        accountId,
        type: TransactionDirection.INCOME,
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
        type: TransactionDirection.EXPENSE,
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

  it("marks linked refund legs as isReversal", () => {
    const mapped = mapTransactionRow({
      id: transactionId,
      account_id: accountId,
      type: TransactionDirection.INCOME,
      amount: 50,
      currency: "VND",
      transaction_date: "2026-08-02",
      note: null,
      category_id: null,
      jar_id: "j1",
      reverses_transaction_id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      is_reversal: true,
      created_at: "2026-08-02T00:00:00Z",
    });
    expect(mapped.isReversal).toBe(true);
    expect(mapped.reversesTransactionId).toBe(
      "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    );
  });
});

describe("updateTransaction / deleteTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks update without membership", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: MONEY_ACTION_DENIED_REASON.NO_MEMBERSHIP,
    });
    await expect(
      updateTransaction({
        transactionId,
        accountId,
        type: TransactionDirection.EXPENSE,
        amount: 20,
      }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP,
    });
  });

  it("blocks in-place update under BR-02 immutability", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    const rpc = vi.fn();
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc,
    } as never);

    await expect(
      updateTransaction({
        transactionId,
        accountId,
        type: TransactionDirection.EXPENSE,
        amount: 20,
      }),
    ).resolves.toEqual({
      ok: false,
      code: LEDGER_ACTION_ERROR_CODE.IMMUTABLE,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("blocks hard delete under BR-02 immutability", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });

    await expect(deleteTransaction({ transactionId })).resolves.toEqual({
      ok: false,
      code: LEDGER_ACTION_ERROR_CODE.IMMUTABLE,
    });
  });
});
