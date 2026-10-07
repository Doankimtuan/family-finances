import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requestCache = vi.hoisted(() => {
  let generation = 0;
  return {
    beginRequest: () => {
      generation += 1;
    },
    wrap<Args extends unknown[], Result>(fn: (...args: Args) => Result) {
      const store = new Map<string, Result>();
      let seenGeneration = -1;
      return (...args: Args): Result => {
        if (seenGeneration !== generation) {
          store.clear();
          seenGeneration = generation;
        }
        const key = JSON.stringify(args);
        if (!store.has(key)) {
          store.set(key, fn(...args));
        }
        return store.get(key) as Result;
      };
    },
  };
});

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: requestCache.wrap,
  };
});

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

vi.mock("@/modules/tenancy/application/get-home-household-context", () => ({
  getHomeHouseholdContext: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/list-active-membership-ids", () => ({
  listActiveMembershipIds: vi.fn(async () => new Set<string>()),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { getHomeHouseholdContext } from "@/modules/tenancy/application/get-home-household-context";
import { getPlanPulse } from "@/modules/plan/application/queries/get-plan-pulse";
import { getRealPosition } from "@/modules/ledger/application/queries/get-real-position";
import { getTransactionReadResult } from "@/modules/ledger/application/queries/get-transaction";
import {
  AccountType,
  DEFAULT_CURRENCY,
  TransactionLedgerType,
  TransactionReadStatus,
  TransactionStatus,
} from "@/modules/ledger/application/ledger-constants";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";

function pulseClient() {
  return {
    from: (table: string) => {
      if (table === "households") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  base_currency: "VND",
                  month_close_mode: "assisted",
                  income_allocate_mode: "suggest",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            order: async () => ({ data: [], error: null }),
          }),
        }),
      };
    },
  };
}

function positionClient(householdCurrency = "VND") {
  const rpc = vi.fn(async () => ({
    data: [
      {
        account_id: "a1",
        account_name: "Cash",
        account_type: "cash",
        opening_balance: 100,
        is_archived: false,
        financial_scope: "household",
        owner_membership_id: null,
        owner_membership_is_active: true,
        balance: 100,
      },
    ],
    error: null,
  }));
  return {
    rpc,
    from: (table: string) => {
      if (table === "households") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { base_currency: householdCurrency },
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
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
    },
  };
}

describe("request-local query cache", () => {
  beforeEach(() => {
    requestCache.beginRequest();
    vi.clearAllMocks();
  });

  it("wraps getPlanPulse, getRealPosition, listCreditCards, and the server client with React cache, not unstable_cache", () => {
    const pulse = readFileSync(
      "modules/plan/application/queries/get-plan-pulse.ts",
      "utf8",
    );
    const position = readFileSync(
      "modules/ledger/application/queries/get-real-position.ts",
      "utf8",
    );
    const cards = readFileSync(
      "modules/ledger/application/queries/list-credit-cards.ts",
      "utf8",
    );
    const transactions = readFileSync(
      "modules/ledger/application/queries/get-transaction.ts",
      "utf8",
    );
    const serverClient = readFileSync(
      "modules/platform/supabase/server.ts",
      "utf8",
    );
    expect(pulse).toContain('import { cache } from "react"');
    expect(pulse).toContain("export const getPlanPulse = cache(loadPlanPulse)");
    expect(pulse).not.toContain("unstable_cache");
    expect(position).toContain('import { cache } from "react"');
    expect(position).toContain(
      "export const getRealPosition = cache(loadRealPosition)",
    );
    expect(position).not.toContain("unstable_cache");
    expect(position).not.toMatch(/loadRealPosition\([^)]*account/i);
    expect(cards).toContain(
      "export const listCreditCards = cache(loadCreditCards)",
    );
    expect(transactions).toContain(
      "export const getTransactionReadResult = cache(loadTransactionReadResult)",
    );
    expect(serverClient).toContain(
      "export const createSupabaseServerClient = cache(",
    );
    expect(serverClient).not.toContain("unstable_cache");
  });

  it("deduplicates getPlanPulse within one request", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
      membershipId: "m1",
    });
    vi.mocked(getHomeHouseholdContext).mockResolvedValue({
      householdId: "h1",
      householdName: "Home",
      locale: "en-VN",
      timezone: "Asia/Ho_Chi_Minh",
      baseCurrency: "VND",
      monthCloseMode: "assisted",
      incomeAllocateMode: "suggest",
      canEdit: true,
    });
    const from = vi.fn((table: string) => pulseClient().from(table));
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ from } as never);

    const [first, second] = await Promise.all([getPlanPulse(), getPlanPulse()]);
    expect(first).toEqual(second);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("does not reuse getPlanPulse across requests", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
      membershipId: "m1",
    });
    vi.mocked(getHomeHouseholdContext).mockResolvedValue({
      householdId: "h1",
      householdName: "Home",
      locale: "en-VN",
      timezone: "Asia/Ho_Chi_Minh",
      baseCurrency: "VND",
      monthCloseMode: "assisted",
      incomeAllocateMode: "suggest",
      canEdit: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      pulseClient() as never,
    );
    await getPlanPulse();
    requestCache.beginRequest();
    await getPlanPulse();
    expect(createSupabaseServerClient).toHaveBeenCalledTimes(2);
  });

  it("deduplicates the authorized transaction base read within one request", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
      membershipId: "m1",
    });
    const row = {
      id: "transaction-id",
      account_id: "account-id",
      type: TransactionLedgerType.EXPENSE,
      amount: 100,
      currency: DEFAULT_CURRENCY,
      transaction_date: "2026-10-01",
      note: null,
      category_id: null,
      jar_id: null,
      status: TransactionStatus.POSTED,
      transfer_group_id: null,
      loan_payment_id: null,
      savings_event_kind: null,
      reverses_transaction_id: null,
      corrects_transaction_id: null,
      is_reversal: false,
      created_at: "2026-10-01T00:00:00.000Z",
      accounts: {
        name: "Cash",
        type: AccountType.CASH,
        financial_scope: FINANCIAL_SCOPE.HOUSEHOLD,
      },
      categories: null,
      jars: null,
      transaction_tag_assignments: [],
    };
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle: async () => ({ data: row, error: null }),
    };
    const from = vi.fn(() => query);
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ from } as never);

    const [first, second] = await Promise.all([
      getTransactionReadResult(row.id),
      getTransactionReadResult(row.id),
    ]);

    expect(first).toEqual(second);
    expect(first.status).toBe(TransactionReadStatus.OK);
    expect(from).toHaveBeenCalledTimes(1);
    expect(assertMoneyActionAllowed).toHaveBeenCalledTimes(1);
  });

  it("deduplicates getRealPosition within one request", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
      membershipId: "m1",
    });
    vi.mocked(getHomeHouseholdContext).mockResolvedValue({
      householdId: "h1",
      householdName: "Home",
      locale: "en-VN",
      timezone: "Asia/Ho_Chi_Minh",
      baseCurrency: "VND",
      monthCloseMode: "assisted",
      incomeAllocateMode: "suggest",
      canEdit: true,
    });
    const client = positionClient();
    const from = vi.fn((table: string) => client.from(table));
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from,
      rpc: client.rpc,
    } as never);

    const [first, second] = await Promise.all([
      getRealPosition(),
      getRealPosition(),
    ]);
    expect(first).toEqual(second);
    expect(first?.totalBalance).toBe(100);
    expect(from).toHaveBeenCalledTimes(0);
    expect(client.rpc).toHaveBeenCalledTimes(1);
  });

  it("does not share getRealPosition across households or requests", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
      membershipId: "m1",
    });
    vi.mocked(getHomeHouseholdContext).mockResolvedValue({
      householdId: "h1",
      householdName: "Home",
      locale: "en-VN",
      timezone: "Asia/Ho_Chi_Minh",
      baseCurrency: "VND",
      monthCloseMode: "assisted",
      incomeAllocateMode: "suggest",
      canEdit: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      positionClient("VND") as never,
    );
    const first = await getRealPosition();
    expect(first?.householdId).toBe("h1");

    requestCache.beginRequest();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u2",
      householdId: "h2",
      membershipId: "m2",
    });
    vi.mocked(getHomeHouseholdContext).mockResolvedValue({
      householdId: "h2",
      householdName: "Home 2",
      locale: "en-VN",
      timezone: "Asia/Ho_Chi_Minh",
      baseCurrency: "USD",
      monthCloseMode: "assisted",
      incomeAllocateMode: "suggest",
      canEdit: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      positionClient("USD") as never,
    );
    const second = await getRealPosition();
    expect(second?.householdId).toBe("h2");
    expect(second?.currency).toBe("USD");
    expect(first?.currency).toBe("VND");
  });
});
