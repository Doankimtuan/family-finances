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
});
