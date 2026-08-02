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
  createAccount,
  createAccountInputSchema,
} from "@/modules/ledger/application/commands/create-account";
import { mapAccountRow } from "@/modules/ledger/application/account-types";
import { getRealPosition } from "@/modules/ledger/application/queries/get-real-position";

describe("createAccountInputSchema", () => {
  it("accepts cash account defaults", () => {
    expect(createAccountInputSchema.safeParse({ name: "Cash" }).success).toBe(
      true,
    );
  });

  it("rejects blank names", () => {
    expect(createAccountInputSchema.safeParse({ name: " " }).success).toBe(
      false,
    );
  });
});

describe("mapAccountRow", () => {
  it("maps opening_balance to ledger balance", () => {
    expect(
      mapAccountRow({
        id: "a1",
        name: "Cash",
        type: "cash",
        opening_balance: "150000",
        is_archived: false,
      }),
    ).toEqual({
      id: "a1",
      name: "Cash",
      type: "cash",
      balance: 150000,
      isArchived: false,
    });
  });
});

describe("createAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no_membership when gate fails", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: "no_membership",
    });

    await expect(createAccount({ name: "Cash" })).resolves.toEqual({
      ok: false,
      code: "no_membership",
    });
  });

  it("inserts account for allowed membership", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: "acc-1" }, error: null }),
          }),
        }),
      }),
    } as never);

    await expect(createAccount({ name: "Wallet" })).resolves.toEqual({
      ok: true,
      accountId: "acc-1",
    });
  });
});

describe("getRealPosition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sums active account balances", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: (table: string) => {
        if (table === "households") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { base_currency: "VND" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "transactions") {
          return {
            select: () => ({
              eq: () => ({
                eq: async () => ({ data: [], error: null }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: async () => ({
                  data: [
                    {
                      id: "a1",
                      name: "Cash",
                      type: "cash",
                      opening_balance: 100,
                      is_archived: false,
                    },
                    {
                      id: "a2",
                      name: "Bank",
                      type: "checking",
                      opening_balance: 50,
                      is_archived: false,
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      },
    } as never);

    await expect(getRealPosition()).resolves.toEqual({
      householdId: "h1",
      currency: "VND",
      totalBalance: 150,
      accounts: [
        {
          id: "a1",
          name: "Cash",
          type: "cash",
          balance: 100,
          isArchived: false,
        },
        {
          id: "a2",
          name: "Bank",
          type: "checking",
          balance: 50,
          isArchived: false,
        },
      ],
    });
  });
});
