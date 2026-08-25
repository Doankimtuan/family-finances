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
import { MONEY_ACTION_DENIED_REASON } from "@/modules/tenancy/application/tenancy-constants";
import { refundTransaction } from "@/modules/ledger/application/commands/refund-transaction";
import { correctTransaction } from "@/modules/ledger/application/commands/correct-transaction";
import { createCategory } from "@/modules/ledger/application/commands/create-category";
import {
  LEDGER_ACTION_ERROR_CODE,
  TransactionDirection,
  TransactionStatus,
} from "@/modules/ledger/application/ledger-constants";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

const ORIGINAL_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const JAR_ID = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const ACCOUNT_ID = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("Sprint 1 integration — refund / correct / category RPCs", () => {
  beforeEach(() => {
    vi.mocked(assertMoneyActionAllowed).mockReset();
    vi.mocked(createSupabaseServerClient).mockReset();
  });

  it("createCategory rejects unmapped jar at the boundary", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "h1",
      userId: "u1",
    } as never);

    const result = await createCategory({
      name: "Pet Grooming",
      kind: TransactionDirection.EXPENSE,
      jarId: undefined as never,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED);
    }
  });

  it("refundTransaction maps RPC capacity restoration (AC-TRN-01)", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "h1",
      userId: "u1",
    } as never);

    const rpc = vi.fn().mockResolvedValue({
      data: {
        refund_transaction_id: "r1",
        original_transaction_id: ORIGINAL_ID,
        original_status: TransactionStatus.PARTIALLY_REFUNDED,
        jar_id: JAR_ID,
        capacity_restored: 50,
      },
      error: null,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc,
    } as never);

    const result = await refundTransaction({
      originalTransactionId: ORIGINAL_ID,
      amount: 50,
      accountId: ACCOUNT_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.capacityRestored).toBe(50);
      expect(result.jarId).toBe(JAR_ID);
      expect(result.originalStatus).toBe(TransactionStatus.PARTIALLY_REFUNDED);
    }
    expect(rpc).toHaveBeenCalledWith(
      "refund_transaction",
      expect.objectContaining({
        p_original_transaction_id: ORIGINAL_ID,
        p_amount: 50,
      }),
    );
  });

  it("correctTransaction returns 3-way ids (AC-TRN-02)", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "h1",
      userId: "u1",
    } as never);

    const rpc = vi.fn().mockResolvedValue({
      data: {
        original_transaction_id: ORIGINAL_ID,
        reversal_transaction_id: "rev1",
        correction_transaction_id: "cor1",
      },
      error: null,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc,
    } as never);

    const result = await correctTransaction({
      originalTransactionId: ORIGINAL_ID,
      amount: 10,
      type: TransactionDirection.EXPENSE,
      accountId: ACCOUNT_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reversalTransactionId).toBe("rev1");
      expect(result.correctionTransactionId).toBe("cor1");
    }
  });

  it("refundTransaction fails closed without membership", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: MONEY_ACTION_DENIED_REASON.UNAUTHENTICATED,
    } as never);

    const result = await refundTransaction({
      originalTransactionId: ORIGINAL_ID,
      amount: 50,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED);
    }
  });
});
