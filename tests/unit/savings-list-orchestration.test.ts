import { readFileSync } from "node:fs";
import { join } from "node:path";
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

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/list-active-membership-ids", () => ({
  listActiveMembershipIds: vi.fn(async () => new Set<string>()),
}));

vi.mock("@/modules/savings/application/savings-provider-registry", () => ({
  listProviderPackages: vi.fn(async () => []),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { listActiveMembershipIds } from "@/modules/tenancy/application/list-active-membership-ids";
import { listProviderPackages } from "@/modules/savings/application/savings-provider-registry";
import { listSavings } from "@/modules/savings/application/queries/list-savings";
import {
  CycleStatus,
  InterestCalcMethod,
  PenaltyStrategy,
  RenewalPolicy,
  SAVINGS_RPC,
  SavingStatus,
  SavingType,
  SettlementRule,
} from "@/modules/savings/application/savings-constants";
import { computeAccruedInterest } from "@/modules/savings/application/savings-interest";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { MONEY_ACTION_DENIED_REASON } from "@/modules/tenancy/application/tenancy-constants";

const HOUSEHOLD_ID = "household-1";
const OTHER_HOUSEHOLD_ID = "household-2";
const MEMBERSHIP_ID = "membership-1";
const USER_ID = "user-1";
const SAVINGS_TABLE = "savings";
const SAVING_CYCLES_TABLE = "saving_cycles";
const SAVING_CYCLES_SAVING_FK = "saving_cycles_saving_id_fkey";
const SAVINGS_LIST_QUERY_FILE = join(
  process.cwd(),
  "modules/savings/application/queries/list-savings.ts",
);

const LIFECYCLE_RPC_VALUES = [
  SAVINGS_RPC.BACKFILL_LEGACY,
  SAVINGS_RPC.DETECT_MATURED,
  SAVINGS_RPC.ENQUEUE_MATURITY_CASCADE,
] as const;

type QueryResult = { data: unknown; error: unknown };

function thenableQuery(result: Promise<QueryResult>) {
  const query: Record<string, unknown> = {};
  const self = () => query;
  for (const method of ["select", "eq", "neq", "in", "or", "gt", "order"]) {
    query[method] = vi.fn(self);
  }
  query.then = (
    resolve: (value: QueryResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => result.then(resolve, reject);
  return query;
}

function productSnapshot(input?: {
  settlementRule?: (typeof SettlementRule)[keyof typeof SettlementRule];
  packageId?: string;
}) {
  return {
    providerId: "provider-1",
    productName: "Term deposit",
    packageName: "90 Days",
    packageId: input?.packageId ?? "package-1",
    depositTermDays: 90,
    annualInterestRate: 4.5,
    interestCalculationMethod: InterestCalcMethod.SIMPLE,
    settlementRule:
      input?.settlementRule ?? SettlementRule.ROLL_PRINCIPAL_INTEREST,
    penaltyStrategy: PenaltyStrategy.NO_INTEREST,
    providerRules: {},
  };
}

function cycleRow(input: {
  id: string;
  savingId: string;
  cycleNumber: number;
  status: (typeof CycleStatus)[keyof typeof CycleStatus];
  startDate?: string;
  endDate?: string;
  principal?: number;
  lockedRate?: number;
  accruedInterest?: number;
  createdAt?: string;
}) {
  return {
    id: input.id,
    saving_id: input.savingId,
    cycle_number: input.cycleNumber,
    start_date: input.startDate ?? "2026-01-01",
    end_date: input.endDate ?? "2026-04-01",
    principal: input.principal ?? 10_000_000,
    locked_rate: input.lockedRate ?? 4.5,
    package_snapshot: {
      packageName: "90 Days",
      durationDays: 90,
      annualInterestRate: 4.5,
      interestCalculationMethod: InterestCalcMethod.SIMPLE,
      settlementRules: [SettlementRule.ROLL_PRINCIPAL_INTEREST],
      penaltyRules: [],
      renewableAvailable: true,
      minAmount: null,
      maxAmount: null,
    },
    accrued_interest: input.accruedInterest ?? 0,
    settlement_result: null,
    renewal_decision: null,
    status: input.status,
    funding_transaction_id: null,
    settlement_transaction_id: null,
    previous_cycle_id: null,
    next_cycle_id: null,
    created_at: input.createdAt ?? "2026-01-01T00:00:00.000Z",
  };
}

function savingRow(input: {
  id: string;
  status: (typeof SavingStatus)[keyof typeof SavingStatus];
  createdAt?: string;
  householdId?: string;
  ownerMembershipId?: string | null;
  cycles?: ReturnType<typeof cycleRow>[] | null;
  settlementRule?: (typeof SettlementRule)[keyof typeof SettlementRule];
}) {
  return {
    id: input.id,
    household_id: input.householdId ?? HOUSEHOLD_ID,
    status: input.status,
    funding_account_id: "funding-1",
    settlement_account_id: "settlement-1",
    provider_id: "provider-1",
    product_name: "Term deposit",
    product_snapshot: productSnapshot({
      settlementRule: input.settlementRule,
    }),
    renewal_policy: RenewalPolicy.ALWAYS_ASK,
    renewal_config: null,
    maturity_instruction: null,
    created_at: input.createdAt ?? "2026-06-01T00:00:00.000Z",
    financial_scope: FINANCIAL_SCOPE.HOUSEHOLD,
    owner_membership_id: input.ownerMembershipId ?? null,
    funding_accounts: { name: "Cash" },
    settlement_accounts: { name: "Bank" },
    saving_providers: {
      display_name: "Vietcombank",
      provider_key: "vcb",
      saving_type: SavingType.BANK_DEPOSIT,
    },
    saving_cycles: input.cycles ?? [],
  };
}

function createListClient(input: {
  savingRows?: unknown[] | null;
  savingError?: unknown;
  onTable?: (table: string) => void;
}) {
  const savingsQuery = thenableQuery(
    Promise.resolve({
      data: input.savingError ? null : (input.savingRows ?? []),
      error: input.savingError ?? null,
    }),
  );
  const rpc = vi.fn();
  const client = {
    from: vi.fn((table: string) => {
      input.onTable?.(table);
      if (table === SAVINGS_TABLE) return savingsQuery;
      throw new Error(`unexpected table ${table}`);
    }),
    rpc,
  };
  return { client, savingsQuery, rpc };
}

async function listWithRows(
  rows: unknown[] | null,
  extra?: { savingError?: unknown },
) {
  const tables: string[] = [];
  const { client, savingsQuery, rpc } = createListClient({
    savingRows: rows,
    savingError: extra?.savingError,
    onTable: (table) => tables.push(table),
  });
  vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);
  const result = await listSavings();
  return { result, tables, savingsQuery, rpc };
}

describe("Savings list read orchestration", () => {
  beforeEach(() => {
    requestCache.beginRequest();
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: USER_ID,
      householdId: HOUSEHOLD_ID,
      membershipId: MEMBERSHIP_ID,
    });
    vi.mocked(listActiveMembershipIds).mockResolvedValue(new Set());
    vi.mocked(listProviderPackages).mockResolvedValue([]);
  });

  it("loads savings and nested cycles in one PostgREST select", async () => {
    const { result, tables, savingsQuery, rpc } = await listWithRows([
      savingRow({
        id: "saving-active",
        status: SavingStatus.ACTIVE,
        cycles: [
          cycleRow({
            id: "cycle-active",
            savingId: "saving-active",
            cycleNumber: 1,
            status: CycleStatus.ACTIVE,
          }),
        ],
      }),
    ]);

    expect(tables).toEqual([SAVINGS_TABLE]);
    expect(savingsQuery.select).toHaveBeenCalledWith(
      expect.stringContaining(
        `${SAVING_CYCLES_TABLE}!${SAVING_CYCLES_SAVING_FK}`,
      ),
    );
    expect(savingsQuery.eq).toHaveBeenCalledWith("household_id", HOUSEHOLD_ID);
    expect(rpc).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result?.[0]?.id).toBe("saving-active");
    expect(result?.[0]?.latestCycle?.id).toBe("cycle-active");
  });

  it("returns an empty list without a follow-up cycles request", async () => {
    const { result, tables, rpc } = await listWithRows([]);

    expect(result).toEqual([]);
    expect(tables).toEqual([SAVINGS_TABLE]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("keeps latestCycle null when a saving has no nested cycles", async () => {
    const { result } = await listWithRows([
      savingRow({
        id: "saving-bare",
        status: SavingStatus.ACTIVE,
        cycles: [],
      }),
    ]);

    expect(result).toHaveLength(1);
    expect(result?.[0]?.latestCycle).toBeNull();
    expect(result?.[0]?.status).toBe(SavingStatus.ACTIVE);
  });

  it("combines multiple savings with their own nested cycles", async () => {
    const { result, tables } = await listWithRows([
      savingRow({
        id: "saving-newer",
        status: SavingStatus.ACTIVE,
        createdAt: "2026-06-02T00:00:00.000Z",
        cycles: [
          cycleRow({
            id: "cycle-newer",
            savingId: "saving-newer",
            cycleNumber: 1,
            status: CycleStatus.ACTIVE,
            principal: 20_000_000,
          }),
        ],
      }),
      savingRow({
        id: "saving-older",
        status: SavingStatus.MATURED,
        createdAt: "2026-05-01T00:00:00.000Z",
        settlementRule: SettlementRule.ROLL_PRINCIPAL_INTEREST,
        cycles: [
          cycleRow({
            id: "cycle-older",
            savingId: "saving-older",
            cycleNumber: 1,
            status: CycleStatus.MATURED,
            principal: 8_000_000,
          }),
        ],
      }),
    ]);

    expect(tables).toEqual([SAVINGS_TABLE]);
    expect(result?.map((saving) => saving.id)).toEqual([
      "saving-newer",
      "saving-older",
    ]);
    expect(result?.[0]?.latestCycle?.id).toBe("cycle-newer");
    expect(result?.[0]?.latestCycle?.principal).toBe(20_000_000);
    expect(result?.[1]?.latestCycle?.id).toBe("cycle-older");
    expect(result?.[1]?.status).toBe(SavingStatus.MATURED);
    expect(result?.[1]?.maturityActionRequired).toBe(true);
  });

  it("prefers the active cycle over an older rolled cycle", async () => {
    const { result } = await listWithRows([
      savingRow({
        id: "saving-rolled",
        status: SavingStatus.ACTIVE,
        cycles: [
          cycleRow({
            id: "cycle-rolled",
            savingId: "saving-rolled",
            cycleNumber: 1,
            status: CycleStatus.ROLLED,
            createdAt: "2025-10-01T00:00:00.000Z",
          }),
          cycleRow({
            id: "cycle-current",
            savingId: "saving-rolled",
            cycleNumber: 2,
            status: CycleStatus.ACTIVE,
            createdAt: "2026-01-01T00:00:00.000Z",
          }),
        ],
      }),
    ]);

    expect(result?.[0]?.latestCycle?.id).toBe("cycle-current");
    expect(result?.[0]?.latestCycle?.status).toBe(CycleStatus.ACTIVE);
  });

  it("uses the newest matured cycle when no active cycle exists", async () => {
    const { result } = await listWithRows([
      savingRow({
        id: "saving-matured",
        status: SavingStatus.MATURED,
        cycles: [
          cycleRow({
            id: "cycle-first",
            savingId: "saving-matured",
            cycleNumber: 1,
            status: CycleStatus.ROLLED,
          }),
          cycleRow({
            id: "cycle-matured",
            savingId: "saving-matured",
            cycleNumber: 2,
            status: CycleStatus.MATURED,
          }),
        ],
      }),
    ]);

    expect(result?.[0]?.latestCycle?.id).toBe("cycle-matured");
    expect(result?.[0]?.latestCycle?.status).toBe(CycleStatus.MATURED);
  });

  it("still attaches an early-closed cycle for a closed saving", async () => {
    const { result } = await listWithRows([
      savingRow({
        id: "saving-closed",
        status: SavingStatus.EARLY_CLOSED,
        settlementRule: SettlementRule.WITHDRAW_EVERYTHING,
        cycles: [
          cycleRow({
            id: "cycle-early",
            savingId: "saving-closed",
            cycleNumber: 1,
            status: CycleStatus.EARLY_CLOSED,
          }),
        ],
      }),
    ]);

    expect(result?.[0]?.status).toBe(SavingStatus.EARLY_CLOSED);
    expect(result?.[0]?.latestCycle?.id).toBe("cycle-early");
    expect(result?.[0]?.latestCycle?.status).toBe(CycleStatus.EARLY_CLOSED);
  });

  it("recomputes accrued interest for the current active cycle", async () => {
    const active = cycleRow({
      id: "cycle-interest",
      savingId: "saving-interest",
      cycleNumber: 1,
      status: CycleStatus.ACTIVE,
      principal: 10_000_000,
      lockedRate: 4.5,
      accruedInterest: 1,
    });
    const { result } = await listWithRows([
      savingRow({
        id: "saving-interest",
        status: SavingStatus.ACTIVE,
        cycles: [active],
      }),
    ]);

    const expected = computeAccruedInterest({
      principal: 10_000_000,
      annualRate: 4.5,
      startDate: active.start_date,
      endDate: active.end_date,
      method: InterestCalcMethod.SIMPLE,
    }).totalInterest;
    expect(result?.[0]?.latestCycle?.accruedInterest).toBe(expected);
    expect(result?.[0]?.latestCycle?.accruedInterest).not.toBe(1);
  });

  it("returns null when the combined savings read fails", async () => {
    const { result, tables, rpc } = await listWithRows(null, {
      savingError: { code: "PGRST301", message: "read failed" },
    });

    expect(result).toBeNull();
    expect(tables).toEqual([SAVINGS_TABLE]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not query when money action is denied", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: MONEY_ACTION_DENIED_REASON.NO_MEMBERSHIP,
    });
    const from = vi.fn();
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from,
      rpc: vi.fn(),
    } as never);

    await expect(listSavings()).resolves.toBeNull();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("scopes the combined read to the gated household", async () => {
    const { savingsQuery, result } = await listWithRows([
      savingRow({
        id: "saving-scoped",
        status: SavingStatus.ACTIVE,
        householdId: HOUSEHOLD_ID,
        cycles: [
          cycleRow({
            id: "cycle-scoped",
            savingId: "saving-scoped",
            cycleNumber: 1,
            status: CycleStatus.ACTIVE,
          }),
        ],
      }),
    ]);

    expect(savingsQuery.eq).toHaveBeenCalledTimes(1);
    expect(savingsQuery.eq).toHaveBeenCalledWith("household_id", HOUSEHOLD_ID);
    expect(savingsQuery.eq).not.toHaveBeenCalledWith(
      "household_id",
      OTHER_HOUSEHOLD_ID,
    );
    expect(result?.[0]?.householdId).toBe(HOUSEHOLD_ID);
  });

  it("does not invoke lifecycle write RPCs on the list read path", async () => {
    const { rpc } = await listWithRows([
      savingRow({
        id: "saving-safe",
        status: SavingStatus.ACTIVE,
        cycles: [
          cycleRow({
            id: "cycle-safe",
            savingId: "saving-safe",
            cycleNumber: 1,
            status: CycleStatus.ACTIVE,
          }),
        ],
      }),
    ]);

    expect(rpc).not.toHaveBeenCalled();
    for (const name of LIFECYCLE_RPC_VALUES) {
      expect(rpc).not.toHaveBeenCalledWith(name, expect.anything());
    }
  });
});

describe("Savings list query source contract", () => {
  it("embeds saving_cycles on the list select instead of a second table read", () => {
    const source = readFileSync(SAVINGS_LIST_QUERY_FILE, "utf8");
    const listRegion = source.slice(
      source.indexOf("const SAVING_CYCLES_SAVING_FK"),
      source.indexOf("export const listSavings"),
    );

    expect(listRegion).toContain(
      `SAVING_CYCLES_SAVING_FK = "${SAVING_CYCLES_SAVING_FK}"`,
    );
    expect(listRegion).toContain(
      `${SAVING_CYCLES_TABLE}!\${SAVING_CYCLES_SAVING_FK}`,
    );
    expect(listRegion).toContain("SAVING_LIST_SELECT");
    expect(listRegion).not.toContain(`.from("${SAVING_CYCLES_TABLE}")`);
    for (const name of LIFECYCLE_RPC_VALUES) {
      expect(listRegion).not.toContain(name);
    }
  });
});
