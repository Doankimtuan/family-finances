import { beforeEach, describe, expect, it, vi } from "vitest";

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
  createDebt,
  recordDebtPayment,
} from "@/modules/ledger/application/commands/debt-commands";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

const ACCOUNT_ID = "750e8400-e29b-41d4-a716-446655440000";
const DEBT_ID = "a50e8400-e29b-41d4-a716-446655440000";
const TRANSACTION_ID = "850e8400-e29b-41d4-a716-446655440000";

function createSupabaseMock(accountType: string) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: { type: accountType },
    error: null,
  });
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle,
  };
  const rpc = vi.fn().mockResolvedValue({
    data: {
      ok: true,
      debtId: DEBT_ID,
      transactionId: TRANSACTION_ID,
      amount: 50_000,
      remainingAmount: 50_000,
      completed: false,
      idempotentReplay: false,
    },
    error: null,
  });
  return { from: vi.fn(() => query), rpc };
}

describe("Debt account eligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-1",
      householdId: "household-1",
    });
  });

  it("allows a liquid account for money-moved creation", async () => {
    const supabase = createSupabaseMock("cash");
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    await expect(
      createDebt({
        name: "Friend debt",
        counterparty: "Friend",
        direction: "borrowed",
        creationMode: "money_moved",
        principalAmount: 100_000,
        startDate: "2026-08-20",
        accountId: ACCOUNT_ID,
        idempotencyKey: "debt-create:test",
      }),
    ).resolves.toMatchObject({ ok: true, debtId: DEBT_ID });
    expect(supabase.rpc).toHaveBeenCalled();
  });

  it.each(["credit_card", "savings_product"])(
    "rejects %s before the Debt RPC",
    async (accountType) => {
      const supabase = createSupabaseMock(accountType);
      vi.mocked(createSupabaseServerClient).mockResolvedValue(
        supabase as never,
      );

      await expect(
        createDebt({
          name: "Friend debt",
          counterparty: "Friend",
          direction: "borrowed",
          creationMode: "money_moved",
          principalAmount: 100_000,
          startDate: "2026-08-20",
          accountId: ACCOUNT_ID,
          idempotencyKey: `debt-create:${accountType}`,
        }),
      ).resolves.toEqual({
        ok: false,
        code: PRODUCT_ACTION_ERROR_CODE.INVALID,
      });
      expect(supabase.rpc).not.toHaveBeenCalled();
    },
  );

  it("rejects a savings product for debt payment before the RPC", async () => {
    const supabase = createSupabaseMock("savings_product");
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    await expect(
      recordDebtPayment({
        debtId: DEBT_ID,
        accountId: ACCOUNT_ID,
        amount: 50_000,
        effectiveDate: "2026-08-20",
        idempotencyKey: "debt-payment:test",
      }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("allows a liquid account for debt payment", async () => {
    const supabase = createSupabaseMock("checking");
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    await expect(
      recordDebtPayment({
        debtId: DEBT_ID,
        accountId: ACCOUNT_ID,
        amount: 50_000,
        effectiveDate: "2026-08-20",
        idempotencyKey: "debt-payment:liquid",
      }),
    ).resolves.toMatchObject({ ok: true, debtId: DEBT_ID });
    expect(supabase.rpc).toHaveBeenCalled();
  });

  it("rejects a credit card for debt payment before the RPC", async () => {
    const supabase = createSupabaseMock("credit_card");
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    await expect(
      recordDebtPayment({
        debtId: DEBT_ID,
        accountId: ACCOUNT_ID,
        amount: 50_000,
        effectiveDate: "2026-08-20",
        idempotencyKey: "debt-payment:card",
      }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
