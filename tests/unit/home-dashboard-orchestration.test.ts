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

vi.mock("@/modules/ledger/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/ledger/application")>();
  return {
    ...actual,
    getRealPosition: vi.fn(),
  };
});

vi.mock("@/modules/plan/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/plan/application")>();
  return {
    ...actual,
    getPlanPulse: vi.fn(),
  };
});

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { getRealPosition } from "@/modules/ledger/application";
import { getPlanPulse } from "@/modules/plan/application";
import { getHomeDashboard } from "@/modules/home/application/get-home-dashboard";
import { getHomeSavingsSummary } from "@/modules/home/application/home-product-summary-adapters";
import {
  HomeDashboardReadStatus,
  HomeProductReadStatus,
} from "@/modules/home/application/home-constants";
import {
  InboxItemKind,
  InboxItemStatus,
  InboxSourceType,
} from "@/modules/inbox/application/inbox-constants";
import { IncomeAllocateMode } from "@/modules/tenancy/application/household-policy-constants";
import { DEFAULT_CURRENCY } from "@/modules/shared-kernel/currency";

const HOUSEHOLD_ID = "household-1";
const MEMBERSHIP_ID = "membership-1";
const USER_ID = "user-1";
const INBOX_ITEMS_TABLE = "inbox_items";
const TRANSACTIONS_TABLE = "transactions";
const SAVINGS_TABLE = "savings";
const SAVING_CYCLES_TABLE = "saving_cycles";
const LOANS_TABLE = "loans";
const LIABILITIES_TABLE = "liabilities";

type QueryResult = { data: unknown; error: unknown };

function thenableQuery(
  result: Promise<QueryResult>,
  onIn?: (column: string) => void,
) {
  const query: Record<string, unknown> = {};
  const self = () => query;
  for (const method of [
    "select",
    "eq",
    "neq",
    "or",
    "gt",
    "gte",
    "lte",
    "limit",
    "order",
  ]) {
    query[method] = vi.fn(self);
  }
  query.in = vi.fn((column: string) => {
    onIn?.(column);
    return query;
  });
  query.then = (
    resolve: (value: QueryResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => result.then(resolve, reject);
  return query;
}

function createHomeClient(input: {
  delayInbox?: Promise<void>;
  delayTransactions?: Promise<void>;
  delaySavings?: Promise<void>;
  inboxRows?: unknown[];
  transactionRows?: unknown[];
  savingRows?: unknown[];
  onTable?: (table: string) => void;
  onTransactionsIn?: (column: string) => void;
}) {
  const inboxRows = input.inboxRows ?? [
    {
      id: "inbox-1",
      kind: InboxItemKind.UNMAPPED_EXPENSE,
      status: InboxItemStatus.PENDING,
      source_id: "tx-1",
      source_type: InboxSourceType.TRANSACTION,
    },
  ];

  return {
    from: vi.fn((table: string) => {
      input.onTable?.(table);
      if (table === INBOX_ITEMS_TABLE) {
        return thenableQuery(
          (input.delayInbox ?? Promise.resolve()).then(() => ({
            data: inboxRows,
            error: null,
          })),
        );
      }
      if (table === TRANSACTIONS_TABLE) {
        return thenableQuery(
          (input.delayTransactions ?? Promise.resolve()).then(() => ({
            data: input.transactionRows ?? [],
            error: null,
          })),
          input.onTransactionsIn,
        );
      }
      if (table === SAVINGS_TABLE) {
        return thenableQuery(
          (input.delaySavings ?? Promise.resolve()).then(() => ({
            data: input.savingRows ?? [],
            error: null,
          })),
        );
      }
      if (
        table === SAVING_CYCLES_TABLE ||
        table === LOANS_TABLE ||
        table === LIABILITIES_TABLE
      ) {
        return thenableQuery(Promise.resolve({ data: [], error: null }));
      }
      return thenableQuery(Promise.resolve({ data: [], error: null }));
    }),
  };
}

describe("Home dashboard domain-query orchestration", () => {
  beforeEach(() => {
    requestCache.beginRequest();
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: USER_ID,
      householdId: HOUSEHOLD_ID,
      membershipId: MEMBERSHIP_ID,
    });
    vi.mocked(getRealPosition).mockResolvedValue({
      householdId: HOUSEHOLD_ID,
      currency: DEFAULT_CURRENCY,
      totalBalance: 1_000_000,
      accounts: [{ id: "account-1" }],
    } as never);
    vi.mocked(getPlanPulse).mockResolvedValue({
      householdId: HOUSEHOLD_ID,
      currency: DEFAULT_CURRENCY,
      incomeAllocateMode: IncomeAllocateMode.OFF,
      activeJars: [{ id: "jar-1" }],
    } as never);
  });

  it("starts date-range transactions and savings before inbox_items resolves", async () => {
    let releaseInbox!: () => void;
    const delayInbox = new Promise<void>((resolve) => {
      releaseInbox = resolve;
    });
    const started = {
      inbox: false,
      transactions: false,
      savings: false,
    };
    const client = createHomeClient({
      delayInbox,
      onTable: (table) => {
        if (table === INBOX_ITEMS_TABLE) started.inbox = true;
        if (table === TRANSACTIONS_TABLE) started.transactions = true;
        if (table === SAVINGS_TABLE) started.savings = true;
      },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const pending = Promise.all([getHomeDashboard(), getHomeSavingsSummary()]);
    await vi.waitFor(() => {
      expect(started.inbox).toBe(true);
      expect(started.transactions).toBe(true);
      expect(started.savings).toBe(true);
    });
    expect(started.transactions && started.savings).toBe(true);

    releaseInbox();
    const [dashboard, savings] = await pending;
    expect(dashboard.status).toBe(HomeDashboardReadStatus.READY);
    expect(savings.status).toBe(HomeProductReadStatus.READY);
  });

  it("does not start enrichment transactions or savings after inbox_items", async () => {
    let releaseInbox!: () => void;
    const delayInbox = new Promise<void>((resolve) => {
      releaseInbox = resolve;
    });
    const tables: string[] = [];
    const transactionInColumns: string[] = [];
    const client = createHomeClient({
      delayInbox,
      onTable: (table) => {
        tables.push(table);
      },
      onTransactionsIn: (column) => {
        transactionInColumns.push(column);
      },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const pending = Promise.all([getHomeDashboard(), getHomeSavingsSummary()]);
    await vi.waitFor(() => {
      expect(tables).toContain(INBOX_ITEMS_TABLE);
      expect(tables).toContain(TRANSACTIONS_TABLE);
      expect(tables).toContain(SAVINGS_TABLE);
    });
    const tablesBeforeInboxResolved = [...tables];
    releaseInbox();
    const [dashboard] = await pending;

    expect(dashboard.status).toBe(HomeDashboardReadStatus.READY);
    if (dashboard.status === HomeDashboardReadStatus.READY) {
      expect(dashboard.dashboard.openInboxCount).toBe(1);
      expect(dashboard.dashboard.canReviewUncategorized).toBe(true);
    }
    expect(tablesBeforeInboxResolved).toContain(TRANSACTIONS_TABLE);
    expect(tables.filter((table) => table === TRANSACTIONS_TABLE)).toHaveLength(
      1,
    );
    expect(tables.filter((table) => table === SAVINGS_TABLE)).toHaveLength(1);
    expect(tables).not.toContain(LOANS_TABLE);
    expect(tables).not.toContain(LIABILITIES_TABLE);
    expect(transactionInColumns).toEqual([]);
  });

  it("keeps Home dashboard counts identical without inbox enrichment", async () => {
    const client = createHomeClient({
      inboxRows: [
        {
          id: "inbox-1",
          kind: InboxItemKind.UNMAPPED_EXPENSE,
          status: InboxItemStatus.PENDING,
          source_id: "tx-1",
          source_type: InboxSourceType.TRANSACTION,
        },
        {
          id: "inbox-2",
          kind: InboxItemKind.SAVINGS_MATURITY,
          status: InboxItemStatus.PENDING,
          source_id: "saving-1",
          source_type: InboxSourceType.GUIDED,
        },
      ],
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const dashboard = await getHomeDashboard();
    expect(dashboard.status).toBe(HomeDashboardReadStatus.READY);
    if (dashboard.status !== HomeDashboardReadStatus.READY) return;
    expect(dashboard.dashboard.openInboxCount).toBe(2);
    expect(dashboard.dashboard.canReviewUncategorized).toBe(true);
    expect(dashboard.dashboard.accountCount).toBe(1);
    expect(dashboard.dashboard.activeJarCount).toBe(1);
  });
});
