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
  createAccount,
  createAccountInputSchema,
} from "@/modules/ledger/application/commands/create-account";
import {
  archiveAccount,
  archiveAccountInputSchema,
} from "@/modules/ledger/application/commands/archive-account";
import {
  updateAccount,
  updateAccountInputSchema,
} from "@/modules/ledger/application/commands/update-account";
import {
  accountHealthFromBalance,
  AccountHealthSignal,
} from "@/modules/ledger/application/account-health";
import { mapAccountRow } from "@/modules/ledger/application/account-types";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";
import { getRealPosition } from "@/modules/ledger/application/queries/get-real-position";
import { AccountType } from "@/modules/ledger/application/ledger-constants";

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

  it("rejects negative opening balance", () => {
    expect(
      createAccountInputSchema.safeParse({
        name: "Cash",
        openingBalance: -1,
      }).success,
    ).toBe(false);
  });
});

describe("archiveAccountInputSchema", () => {
  it("requires uuid accountId", () => {
    expect(
      archiveAccountInputSchema.safeParse({ accountId: "not-uuid" }).success,
    ).toBe(false);
    expect(
      archiveAccountInputSchema.safeParse({
        accountId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      }).success,
    ).toBe(true);
  });
});

describe("updateAccountInputSchema", () => {
  it("accepts rename + type", () => {
    expect(
      updateAccountInputSchema.safeParse({
        accountId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        name: "Wallet",
        type: AccountType.EWALLET,
      }).success,
    ).toBe(true);
  });

  it("rejects blank name", () => {
    expect(
      updateAccountInputSchema.safeParse({
        accountId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        name: " ",
        type: AccountType.CASH,
      }).success,
    ).toBe(false);
  });
});

describe("accountHealthFromBalance", () => {
  it("signals zero vs ok", () => {
    expect(accountHealthFromBalance(0)).toBe(AccountHealthSignal.ZERO);
    expect(accountHealthFromBalance(1)).toBe(AccountHealthSignal.OK);
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
      financialScope: "household",
      ownerMembershipId: null,
      isPersonal: false,
      isOwnedByMe: false,
      canMutate: true,
      ownerStatus: OWNER_STATUS.ACTIVE,
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
      reason: MONEY_ACTION_DENIED_REASON.NO_MEMBERSHIP,
    });

    await expect(createAccount({ name: "Cash" })).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP,
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

  it("persists opening balance without creating a transaction", async () => {
    const insert = vi.fn(() => ({
      select: () => ({
        single: async () => ({ data: { id: "acc-1" }, error: null }),
      }),
    }));
    const from = vi.fn((table: string) => {
      if (table === "accounts") return { insert };
      throw new Error(`Unexpected table: ${table}`);
    });
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ from } as never);

    await expect(
      createAccount({ name: "VCB", openingBalance: 50_000_000 }),
    ).resolves.toEqual({ ok: true, accountId: "acc-1" });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ opening_balance: 50_000_000 }),
    );
    expect(from).not.toHaveBeenCalledWith("transactions");
  });
});

describe("archiveAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("archives active account", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: async () => ({
                    data: { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    } as never);

    await expect(
      archiveAccount({
        accountId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      }),
    ).resolves.toEqual({ ok: true });
  });

  it("returns invalid when account missing", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
      }),
    } as never);

    await expect(
      archiveAccount({
        accountId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
  });
});

describe("updateAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates name and type", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: async () => ({
                    data: { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    } as never);

    await expect(
      updateAccount({
        accountId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        name: "Bank",
        type: AccountType.CHECKING,
      }),
    ).resolves.toEqual({ ok: true });
  });
});

describe("getRealPosition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sums active liquid account balances and excludes savings products", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: async () => ({
        data: [
          { account_id: "a1", balance: 100 },
          { account_id: "a2", balance: 50 },
        ],
        error: null,
      }),
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
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: () => ({
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
                      {
                        id: "a3",
                        name: "Term deposit",
                        type: "savings_product",
                        opening_balance: 500,
                        is_archived: false,
                      },
                    ],
                    error: null,
                  }),
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
          financialScope: "household",
          ownerMembershipId: null,
          isPersonal: false,
          isOwnedByMe: false,
          canMutate: true,
          ownerStatus: OWNER_STATUS.ACTIVE,
        },
        {
          id: "a2",
          name: "Bank",
          type: "checking",
          balance: 50,
          isArchived: false,
          financialScope: "household",
          ownerMembershipId: null,
          isPersonal: false,
          isOwnedByMe: false,
          canMutate: true,
          ownerStatus: OWNER_STATUS.ACTIVE,
        },
      ],
    });
  });
});
