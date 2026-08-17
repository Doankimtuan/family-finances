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
  recordTransfer,
  recordTransferInputSchema,
} from "@/modules/ledger/application/commands/record-transfer";
import { applyTransactionDeltas } from "@/modules/ledger/application/transaction-types";
import { TransactionLedgerType } from "@/modules/ledger/application/ledger-constants";

describe("recordTransferInputSchema", () => {
  const source = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const destination = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  it("requires distinct accounts and positive whole amount", () => {
    expect(
      recordTransferInputSchema.safeParse({
        sourceAccountId: source,
        destinationAccountId: destination,
        amount: 1000,
      }).success,
    ).toBe(true);
    expect(
      recordTransferInputSchema.safeParse({
        sourceAccountId: source,
        destinationAccountId: source,
        amount: 1000,
      }).success,
    ).toBe(false);
    expect(
      recordTransferInputSchema.safeParse({
        sourceAccountId: source,
        destinationAccountId: destination,
        amount: -1,
      }).success,
    ).toBe(false);
  });
});

describe("applyTransactionDeltas transfer neutrality", () => {
  it("decreases source and increases destination without net household change", () => {
    const accounts = applyTransactionDeltas(
      [
        {
          id: "a1",
          name: "Cash",
          type: "cash",
          balance: 100_000,
          isArchived: false,
        },
        {
          id: "a2",
          name: "Bank",
          type: "checking",
          balance: 50_000,
          isArchived: false,
        },
      ],
      [
        {
          accountId: "a1",
          type: TransactionLedgerType.TRANSFER_OUT,
          amount: 10_000,
        },
        {
          accountId: "a2",
          type: TransactionLedgerType.TRANSFER_IN,
          amount: 10_000,
        },
      ],
    );
    expect(accounts.find((a) => a.id === "a1")?.balance).toBe(90_000);
    expect(accounts.find((a) => a.id === "a2")?.balance).toBe(60_000);
    const total = accounts.reduce((sum, a) => sum + a.balance, 0);
    expect(total).toBe(150_000);
  });
});

describe("recordTransfer", () => {
  const source = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const destination = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects same-account transfer before RPC", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "h1",
      userId: "u1",
      role: "owner",
    } as never);

    const result = await recordTransfer({
      sourceAccountId: source,
      destinationAccountId: source,
      amount: 1000,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(PRODUCT_ACTION_ERROR_CODE.INVALID);
    }
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns no_membership when gate fails", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: MONEY_ACTION_DENIED_REASON.NO_MEMBERSHIP,
    });

    const result = await recordTransfer({
      sourceAccountId: source,
      destinationAccountId: destination,
      amount: 1000,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP);
    }
  });

  it("maps successful RPC payload to linked legs", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "h1",
      userId: "u1",
      role: "owner",
    } as never);
    const rpc = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        transferGroupId: "g1",
        sourceTransactionId: "t-out",
        destinationTransactionId: "t-in",
        sourceDelta: -5000,
        destinationDelta: 5000,
        idempotentReplay: false,
      },
      error: null,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc,
    } as never);

    const result = await recordTransfer({
      sourceAccountId: source,
      destinationAccountId: destination,
      amount: 5000,
      idempotencyKey: "xfer:test-key-123456",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sourceTransactionId).toBe("t-out");
      expect(result.destinationTransactionId).toBe("t-in");
      expect(result.sourceDelta).toBe(-5000);
      expect(result.destinationDelta).toBe(5000);
    }
    expect(rpc).toHaveBeenCalledOnce();
  });
});
