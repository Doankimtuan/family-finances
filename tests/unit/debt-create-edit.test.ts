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
import { updateDebt } from "@/modules/ledger/application/commands/debt-commands";
import {
  createDebtFormSchema,
  updateDebtFormSchema,
} from "@/modules/ledger/application/commands/debt.schemas";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

const DEBT_ID = "a50e8400-e29b-41d4-a716-446655440000";

describe("Debt create/edit contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-1",
      householdId: "household-1",
    });
  });

  it("keeps creation principal-only and validates the money-moved account rule", () => {
    const result = createDebtFormSchema.safeParse({
      counterparty: "Friend",
      direction: "borrowed",
      creationMode: "money_moved",
      principalAmount: 100_000,
      startDate: "2026-08-20",
      accountId: null,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(
      result.error.issues.some((issue) => issue.path[0] === "accountId"),
    ).toBe(true);
  });

  it("allows only descriptive edit fields", () => {
    const result = updateDebtFormSchema.safeParse({
      counterparty: "Updated friend",
      dueDate: "2026-09-01",
      note: "Updated note",
      principalAmount: 1,
      direction: "lent",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("principalAmount");
      expect(result.data).not.toHaveProperty("direction");
    }
  });

  it("updates metadata without touching financial history", async () => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      update: vi.fn(() => query),
      maybeSingle: vi
        .fn()
        .mockResolvedValueOnce({
          data: { start_date: "2026-08-01" },
          error: null,
        })
        .mockResolvedValueOnce({ data: { id: DEBT_ID }, error: null }),
    };
    const supabase = { from: vi.fn(() => query) };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    await expect(
      updateDebt({
        debtId: DEBT_ID,
        counterparty: "Updated friend",
        dueDate: "2026-09-01",
        note: "Updated note",
      }),
    ).resolves.toMatchObject({ ok: true, debtId: DEBT_ID });

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Updated friend",
        creditor: "Updated friend",
        due_date: "2026-09-01",
        note: "Updated note",
      }),
    );
    const patch = query.update.mock.calls[0][0] as Record<string, unknown>;
    expect(patch).not.toHaveProperty("principal_amount");
    expect(patch).not.toHaveProperty("direction");
    expect(patch).not.toHaveProperty("status");
    expect(patch).not.toHaveProperty("origin_transaction_id");
  });

  it("rejects a due date before the persisted start date", async () => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      update: vi.fn(() => query),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { start_date: "2026-08-20" },
        error: null,
      }),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn(() => query),
    } as never);

    await expect(
      updateDebt({
        debtId: DEBT_ID,
        counterparty: "Friend",
        dueDate: "2026-08-19",
      }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
    expect(query.update).not.toHaveBeenCalled();
  });
});
