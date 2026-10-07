import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { listTransactionEvents } from "@/modules/ledger/application/queries/get-transaction";
import {
  AccountType,
  TransactionActivityKind,
  TransactionFilterType,
  TransactionLedgerType,
  TransactionStatus,
} from "@/modules/ledger/application";

function transactionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "original",
    account_id: "account-original",
    type: TransactionLedgerType.EXPENSE,
    amount: "100",
    currency: "VND",
    transaction_date: "2026-09-06",
    note: "Lunch",
    category_id: null,
    jar_id: null,
    status: TransactionStatus.POSTED,
    transfer_group_id: null,
    loan_payment_id: null,
    savings_event_kind: null,
    reverses_transaction_id: null,
    corrects_transaction_id: null,
    is_reversal: false,
    created_at: "2026-09-06T00:00:00.000Z",
    accounts: { name: "Cash", type: AccountType.CASH },
    categories: null,
    jars: null,
    transaction_tag_assignments: [],
    ...overrides,
  };
}

function createSupabaseMock(rowsForQuery: (queryIndex: number) => unknown[]) {
  const queryCalls: Array<Record<string, ReturnType<typeof vi.fn>>> = [];
  const supabase = {
    from: vi.fn(() => {
      const queryIndex = queryCalls.length;
      const calls = Object.fromEntries(
        ["select", "eq", "in", "ilike", "or", "order", "limit"].map(
          (method) => [method, vi.fn().mockReturnThis()],
        ),
      ) as Record<string, ReturnType<typeof vi.fn>>;
      queryCalls.push(calls);
      return {
        ...calls,
        then: (resolve: (value: { data: unknown[]; error: null }) => unknown) =>
          resolve({ data: rowsForQuery(queryIndex), error: null }),
      };
    }),
  };
  return { queryCalls, supabase };
}

function transferRows(groupId: string, amount = "100") {
  return [
    transactionRow({
      id: `${groupId}-out`,
      account_id: `${groupId}-source-account`,
      accounts: { name: `${groupId} source account`, type: AccountType.CASH },
      type: TransactionLedgerType.TRANSFER_OUT,
      amount,
      transfer_group_id: groupId,
    }),
    transactionRow({
      id: `${groupId}-in`,
      account_id: `${groupId}-destination-account`,
      accounts: {
        name: `${groupId} destination account`,
        type: AccountType.CASH,
      },
      type: TransactionLedgerType.TRANSFER_IN,
      amount,
      transfer_group_id: groupId,
    }),
  ];
}

describe("listTransactionEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps corrected debit legs visible beside their audit history", async () => {
    const rows = [
      transactionRow({
        id: "correction",
        account_id: "account-corrected",
        corrects_transaction_id: "original",
        created_at: "2026-09-06T00:00:03.000Z",
      }),
      transactionRow({
        id: "reversal",
        type: TransactionLedgerType.INCOME,
        account_id: "account-original",
        status: TransactionStatus.POSTED,
        reverses_transaction_id: "original",
        is_reversal: true,
        note: "Reversal",
        created_at: "2026-09-06T00:00:02.000Z",
      }),
      transactionRow({
        status: TransactionStatus.REVERSED,
        created_at: "2026-09-06T00:00:01.000Z",
      }),
    ];
    const result = { data: rows, error: null };
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: (resolve: (value: typeof result) => unknown) => resolve(result),
    };
    const from = vi.fn(() => query);

    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "household",
      userId: "user",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from,
    } as never);

    const resultSet = await listTransactionEvents({
      type: TransactionFilterType.ALL,
      limit: 10,
    });

    expect(resultSet?.activities.map((activity) => activity.id)).toEqual([
      "correction",
      "reversal",
      "original",
    ]);
    expect(resultSet?.activities[0]).toMatchObject({
      kind: TransactionActivityKind.EXPENSE,
      amount: 100,
    });
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("batches a transfer leg hidden by account and note filters", async () => {
    const source = transactionRow({
      id: "transfer-out",
      account_id: "account-source",
      type: TransactionLedgerType.TRANSFER_OUT,
      amount: "250",
      note: "Lunch refund",
      transfer_group_id: "transfer-group-id",
    });
    const destination = transactionRow({
      id: "transfer-in",
      account_id: "account-destination",
      type: TransactionLedgerType.TRANSFER_IN,
      amount: "250",
      note: null,
      transfer_group_id: "transfer-group-id",
      created_at: "2026-09-06T00:00:01.000Z",
    });
    const { queryCalls, supabase } = createSupabaseMock((queryIndex) =>
      queryIndex === 0 ? [source] : [source, destination],
    );

    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "household",
      userId: "user",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    const resultSet = await listTransactionEvents({
      type: TransactionFilterType.ALL,
      accountId: "account-source",
      q: "  LUNCH  ",
      limit: 10,
    });

    expect(queryCalls[0]?.eq).toHaveBeenCalledWith(
      "account_id",
      "account-source",
    );
    expect(queryCalls[0]?.ilike).toHaveBeenCalledWith("note", "%  LUNCH  %");
    expect(queryCalls).toHaveLength(2);
    expect(queryCalls[1]?.in).toHaveBeenCalledWith("transfer_group_id", [
      "transfer-group-id",
    ]);
    expect(resultSet?.activities).toHaveLength(1);
    expect(resultSet?.activities[0]).toMatchObject({
      id: "transfer-group-id",
      kind: TransactionActivityKind.TRANSFER,
      relatedTransactionIds: ["transfer-out", "transfer-in"],
      sourceAccount: { id: "account-source" },
      destinationAccount: { id: "account-destination" },
    });
  });

  it("skips completion when a transfer filter scan contains a complete pair", async () => {
    const [source, destination] = transferRows("transfer-group-id", "250");
    const { queryCalls, supabase } = createSupabaseMock(() => [
      source,
      destination,
    ]);

    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "household",
      userId: "user",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    const resultSet = await listTransactionEvents({
      type: TransactionFilterType.TRANSFER,
      limit: 10,
    });

    expect(queryCalls).toHaveLength(1);
    expect(resultSet?.activities).toHaveLength(1);
    expect(resultSet?.activities[0]).toMatchObject({
      id: "transfer-group-id",
      kind: TransactionActivityKind.TRANSFER,
      amount: 250,
      currency: "VND",
      effectiveDate: "2026-09-06",
      note: "Lunch",
      status: TransactionStatus.POSTED,
      relatedTransactionIds: ["transfer-group-id-out", "transfer-group-id-in"],
      sourceAccount: {
        id: "transfer-group-id-source-account",
        name: "transfer-group-id source account",
      },
      destinationAccount: {
        id: "transfer-group-id-destination-account",
        name: "transfer-group-id destination account",
      },
      transferGroupId: "transfer-group-id",
      loanPaymentId: null,
      savingsEventKind: null,
    });
    expect(resultSet).toMatchObject({ hasMore: false });
    expect(resultSet?.nextCursor).toBeTruthy();
  });

  it("keeps a transfer split at a raw-page boundary paired across continuation", async () => {
    const source = transactionRow({
      id: "z-source",
      account_id: "account-source",
      type: TransactionLedgerType.TRANSFER_OUT,
      transfer_group_id: "transfer-group-id",
    });
    const destination = transactionRow({
      id: "a-destination",
      account_id: "account-destination",
      type: TransactionLedgerType.TRANSFER_IN,
      transfer_group_id: "transfer-group-id",
    });
    const fillers = ["y-filler", "x-filler", "w-filler"].map((id) =>
      transactionRow({ id }),
    );
    const { queryCalls, supabase } = createSupabaseMock((queryIndex) => {
      switch (queryIndex) {
        case 0:
          return [source, ...fillers];
        case 1:
          return [source, destination];
        case 2:
          return [...fillers, destination];
        default:
          return [source, destination];
      }
    });

    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "household",
      userId: "user",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    const firstPage = await listTransactionEvents({
      type: TransactionFilterType.ALL,
      limit: 1,
    });
    const continuation = await listTransactionEvents({
      type: TransactionFilterType.ALL,
      limit: 1,
      cursor: firstPage?.nextCursor ?? undefined,
    });

    expect(queryCalls[0]?.limit).toHaveBeenCalledWith(4);
    expect(queryCalls[1]?.in).toHaveBeenCalledWith("transfer_group_id", [
      "transfer-group-id",
    ]);
    expect(queryCalls[2]?.or).toHaveBeenCalled();
    expect(queryCalls[3]?.in).toHaveBeenCalledWith("transfer_group_id", [
      "transfer-group-id",
    ]);
    expect(firstPage?.activities.map((activity) => activity.id)).toEqual([
      "transfer-group-id",
    ]);
    expect(firstPage?.hasMore).toBe(true);
    expect(continuation?.activities.map((activity) => activity.id)).toEqual([
      "y-filler",
    ]);
    expect(continuation?.activities).not.toContainEqual(
      expect.objectContaining({ id: "transfer-group-id" }),
    );
  });

  it("batches only incomplete transfer groups when a scan mixes complete and partial pairs", async () => {
    const [completeSource, completeDestination] = transferRows(
      "complete-group",
      "250",
    );
    const [missingSource, missingDestination] = transferRows("missing-group");
    const { queryCalls, supabase } = createSupabaseMock((queryIndex) =>
      queryIndex === 0
        ? [completeSource, completeDestination, missingSource]
        : [missingSource, missingDestination],
    );

    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "household",
      userId: "user",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    const resultSet = await listTransactionEvents({
      type: TransactionFilterType.TRANSFER,
      limit: 10,
    });

    expect(queryCalls).toHaveLength(2);
    expect(queryCalls[1]?.in).toHaveBeenCalledWith("transfer_group_id", [
      "missing-group",
    ]);
    expect(resultSet?.activities.map((activity) => activity.id)).toEqual([
      "missing-group",
      "complete-group",
    ]);
    expect(resultSet).toMatchObject({ hasMore: false });
    expect(resultSet?.nextCursor).toBeTruthy();
  });

  it("falls back to completion for malformed transfer groups", async () => {
    const [source, destination] = transferRows("malformed-group");
    const extraSource = { ...source, id: "extra-transfer-out" };
    const { queryCalls, supabase } = createSupabaseMock(() => [
      source,
      destination,
      extraSource,
    ]);

    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "household",
      userId: "user",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    const resultSet = await listTransactionEvents({
      type: TransactionFilterType.TRANSFER,
      limit: 10,
    });

    expect(queryCalls).toHaveLength(2);
    expect(queryCalls[1]?.in).toHaveBeenCalledWith("transfer_group_id", [
      "malformed-group",
    ]);
    expect(resultSet?.activities[0]?.relatedTransactionIds).toEqual([
      "malformed-group-out",
      "malformed-group-in",
      "extra-transfer-out",
    ]);
  });

  it("keeps principal and interest together for a filtered loan payment", async () => {
    const principal = transactionRow({
      id: "loan-principal",
      type: TransactionLedgerType.LIABILITY_PAYMENT,
      amount: "500",
      note: "Loan installment",
      category_id: "category-id",
      jar_id: "jar-id",
      loan_payment_id: "loan-payment-id",
    });
    const interest = transactionRow({
      id: "loan-interest",
      type: TransactionLedgerType.LOAN_INTEREST,
      amount: "20",
      note: null,
      loan_payment_id: "loan-payment-id",
      created_at: "2026-09-06T00:00:01.000Z",
    });
    const queryCalls: Array<Record<string, ReturnType<typeof vi.fn>>> = [];
    const supabase = {
      from: vi.fn(() => {
        const queryIndex = queryCalls.length;
        const calls = Object.fromEntries(
          ["select", "eq", "in", "ilike", "or", "order", "limit"].map(
            (method) => [method, vi.fn().mockReturnThis()],
          ),
        ) as Record<string, ReturnType<typeof vi.fn>>;
        const query = {
          ...calls,
          then: (
            resolve: (value: { data: unknown[]; error: null }) => unknown,
          ) =>
            resolve({
              data: queryIndex === 0 ? [principal] : [principal, interest],
              error: null,
            }),
        };
        queryCalls.push(calls);
        return query;
      }),
    };

    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "household",
      userId: "user",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    const resultSet = await listTransactionEvents({
      type: TransactionFilterType.ALL,
      categoryId: "category-id",
      jarId: "jar-id",
      limit: 10,
    });

    expect(queryCalls[1]?.in).toHaveBeenCalledWith("loan_payment_id", [
      "loan-payment-id",
    ]);
    expect(resultSet?.activities).toHaveLength(1);
    expect(resultSet?.activities[0]).toMatchObject({
      id: "loan-payment-id",
      kind: TransactionActivityKind.LIABILITY_PAYMENT,
      relatedTransactionIds: ["loan-principal", "loan-interest"],
      breakdown: { principalAmount: 500, interestAmount: 20 },
    });
  });
});
