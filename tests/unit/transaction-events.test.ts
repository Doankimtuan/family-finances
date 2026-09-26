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

    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "household",
      userId: "user",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn(() => query),
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
  });

  it("applies note, category, and jar filters before returning a complete transfer", async () => {
    const source = transactionRow({
      id: "transfer-out",
      account_id: "account-source",
      type: TransactionLedgerType.TRANSFER_OUT,
      amount: "250",
      note: "Lunch refund",
      category_id: "category-id",
      jar_id: "jar-id",
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
              data: queryIndex === 0 ? [source] : [source, destination],
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
      q: "  LUNCH  ",
      categoryIds: ["category-id", "category-id-2"],
      jarIds: ["jar-id", "jar-id-2"],
      limit: 10,
    });

    expect(queryCalls[0]?.ilike).toHaveBeenCalledWith("note", "%  LUNCH  %");
    expect(queryCalls[0]?.in).toHaveBeenCalledWith("category_id", [
      "category-id",
      "category-id-2",
    ]);
    expect(queryCalls[0]?.in).toHaveBeenCalledWith("jar_id", [
      "jar-id",
      "jar-id-2",
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
