import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertMoneyActionAllowed: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  getTransactionReadResult: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: mocks.assertMoneyActionAllowed,
}));
vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));
vi.mock("@/modules/ledger/application/queries/get-transaction", () => ({
  getTransactionReadResult: mocks.getTransactionReadResult,
}));

import { getTransactionAuditChain } from "@/modules/ledger/application/queries/get-transaction-audit-chain";
import {
  DEFAULT_CURRENCY,
  TransactionLedgerType,
  TransactionReadStatus,
  TransactionStatus,
} from "@/modules/ledger/application/ledger-constants";
import type { LedgerTransaction } from "@/modules/ledger/application/transaction-types";

const ROOT: LedgerTransaction = {
  id: "transaction-id",
  accountId: "account-id",
  type: TransactionLedgerType.EXPENSE,
  amount: 100,
  currency: DEFAULT_CURRENCY,
  transactionDate: "2026-10-01",
  note: null,
  categoryId: null,
  categoryName: null,
  categoryIconKey: null,
  jarId: null,
  jarName: null,
  tags: [],
  status: TransactionStatus.POSTED,
  transferGroupId: null,
  loanPaymentId: null,
  reversesTransactionId: null,
  correctsTransactionId: null,
  isReversal: false,
  createdAt: "2026-10-01T00:00:00.000Z",
};

function rawAuditRow(
  id: string,
  links: {
    reverses_transaction_id?: string | null;
    corrects_transaction_id?: string | null;
    is_reversal?: boolean;
  } = {},
) {
  return {
    id,
    account_id: ROOT.accountId,
    type: TransactionLedgerType.EXPENSE,
    amount: ROOT.amount,
    currency: DEFAULT_CURRENCY,
    transaction_date: ROOT.transactionDate,
    note: null,
    category_id: null,
    jar_id: null,
    status: TransactionStatus.POSTED,
    transfer_group_id: null,
    savings_event_kind: null,
    reverses_transaction_id: links.reverses_transaction_id ?? null,
    corrects_transaction_id: links.corrects_transaction_id ?? null,
    is_reversal: links.is_reversal ?? false,
    created_at: ROOT.createdAt,
    accounts: { name: "Cash" },
    categories: null,
    jars: null,
  };
}

type MockAuditQuery = {
  select: () => MockAuditQuery;
  eq: (column: string, value: unknown) => MockAuditQuery;
  maybeSingle: () => Promise<{ data: unknown; error: null }>;
  order: () => Promise<{ data: unknown[]; error: null }>;
};

function mockAuditClient({
  original,
  reversals = [],
  corrections = [],
}: {
  original: unknown;
  reversals?: unknown[];
  corrections?: unknown[];
}) {
  const from = vi.fn(() => {
    let relationColumn: string | null = null;
    const query: MockAuditQuery = {
      select: () => query,
      eq: (column) => {
        if (
          column === "reverses_transaction_id" ||
          column === "corrects_transaction_id"
        ) {
          relationColumn = column;
        }
        return query;
      },
      maybeSingle: async () => ({ data: original, error: null }),
      order: async () => ({
        data:
          relationColumn === "reverses_transaction_id"
            ? reversals
            : corrections,
        error: null,
      }),
    };
    return query;
  });
  mocks.createSupabaseServerClient.mockResolvedValue({ from } as never);
  return from;
}

describe("transaction audit-chain read failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertMoneyActionAllowed.mockResolvedValue({
      ok: true,
      userId: "user-id",
      householdId: "household-id",
      membershipId: "membership-id",
    });
    mocks.getTransactionReadResult.mockResolvedValue({
      status: TransactionReadStatus.OK,
      transaction: ROOT,
    });
  });

  it("returns unavailable when a child query fails instead of fabricating empty history", async () => {
    const error = new Error("read failed");
    const query = {
      select: () => query,
      eq: () => query,
      order: async () => ({ data: null, error }),
    };
    const from = vi.fn(() => query);
    mocks.createSupabaseServerClient.mockResolvedValue({ from } as never);

    await expect(getTransactionAuditChain(ROOT.id)).resolves.toBeNull();
    expect(from).toHaveBeenCalledTimes(2);
  });

  it("returns a valid empty chain without reading the base transaction again", async () => {
    const from = mockAuditClient({ original: ROOT });

    await expect(getTransactionAuditChain(ROOT.id)).resolves.toEqual({
      original: ROOT,
      reversals: [],
      corrections: [],
    });
    expect(mocks.getTransactionReadResult).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledTimes(2);
  });

  it("keeps correction links when the original row is read separately", async () => {
    const originalId = "original-transaction-id";
    const correctedRow = rawAuditRow(ROOT.id, {
      corrects_transaction_id: originalId,
    });
    mocks.getTransactionReadResult.mockResolvedValue({
      status: TransactionReadStatus.OK,
      transaction: { ...ROOT, correctsTransactionId: originalId },
    });
    const from = mockAuditClient({
      original: rawAuditRow(originalId),
      corrections: [correctedRow],
    });

    const chain = await getTransactionAuditChain(ROOT.id);

    expect(chain?.original.id).toBe(originalId);
    expect(chain?.corrections.map((row) => row.id)).toEqual([ROOT.id]);
    expect(from).toHaveBeenCalledTimes(3);
  });

  it("keeps reversal links when the original row is read separately", async () => {
    const originalId = "original-transaction-id";
    const reversalRow = rawAuditRow(ROOT.id, {
      reverses_transaction_id: originalId,
      is_reversal: true,
    });
    mocks.getTransactionReadResult.mockResolvedValue({
      status: TransactionReadStatus.OK,
      transaction: {
        ...ROOT,
        reversesTransactionId: originalId,
        isReversal: true,
      },
    });
    const from = mockAuditClient({
      original: rawAuditRow(originalId),
      reversals: [reversalRow],
    });

    const chain = await getTransactionAuditChain(ROOT.id);

    expect(chain?.original.id).toBe(originalId);
    expect(chain?.reversals.map((row) => row.id)).toEqual([ROOT.id]);
    expect(from).toHaveBeenCalledTimes(3);
  });
});
