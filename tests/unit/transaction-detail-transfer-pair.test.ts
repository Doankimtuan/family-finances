import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertMoneyActionAllowed: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("react", () => ({ cache: (fn: (...args: never[]) => unknown) => fn }));
vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: mocks.assertMoneyActionAllowed,
}));
vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import {
  getTransactionActivity,
  getTransactionReadResult,
} from "@/modules/ledger/application/queries/get-transaction";
import {
  createTransactionActivities,
  TransactionActivityKind,
  TransactionActivityTone,
} from "@/modules/ledger/application/transaction-activity";
import {
  AccountType,
  DEFAULT_CURRENCY,
  TransactionLedgerType,
  TransactionReadStatus,
  TransactionStatus,
} from "@/modules/ledger/application/ledger-constants";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { SavingsEventKind } from "@/modules/savings/application/savings-constants";
import {
  TransactionTagColorKey,
  TransactionTagIconKey,
} from "@/modules/ledger/application/transaction-constants";
import { MONEY_ACTION_DENIED_REASON } from "@/modules/tenancy/application/tenancy-constants";

const DETAIL_ROWS_MIGRATION = readFileSync(
  "supabase/migrations/20261007033708_transaction_detail_rows.sql",
  "utf8",
);

const SOURCE_ROW = {
  id: "transfer-out-id",
  account_id: "source-account-id",
  type: TransactionLedgerType.TRANSFER_OUT,
  amount: 100,
  currency: DEFAULT_CURRENCY,
  transaction_date: "2026-10-01",
  note: null,
  category_id: null,
  jar_id: null,
  status: TransactionStatus.POSTED,
  transfer_group_id: "transfer-group-id",
  loan_payment_id: null,
  savings_event_kind: null,
  reverses_transaction_id: null,
  corrects_transaction_id: null,
  is_reversal: false,
  created_at: "2026-10-01T00:00:00.000Z",
  accounts: {
    name: "Source account",
    type: AccountType.CASH,
    financial_scope: FINANCIAL_SCOPE.HOUSEHOLD,
  },
  categories: null,
  jars: null,
  transaction_tag_assignments: [],
};

const DESTINATION_ROW = {
  ...SOURCE_ROW,
  id: "transfer-in-id",
  account_id: "destination-account-id",
  type: TransactionLedgerType.TRANSFER_IN,
  accounts: {
    name: "Destination account",
    type: AccountType.CASH,
    financial_scope: FINANCIAL_SCOPE.HOUSEHOLD,
  },
};

function transactionClient(
  selectedRow: object | null,
  pairRows: readonly object[],
) {
  const query = {
    select: () => query,
    eq: () => query,
    in: async () => ({ data: pairRows, error: null }),
    maybeSingle: async () => ({ data: selectedRow, error: null }),
  };
  return { from: vi.fn(() => query) };
}

describe("transaction detail transfer pair", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertMoneyActionAllowed.mockResolvedValue({
      ok: true,
      userId: "user-id",
      householdId: "household-id",
      membershipId: "membership-id",
    });
  });

  it("loads one selected row for ordinary Detail", async () => {
    const row = {
      ...SOURCE_ROW,
      id: "ordinary-row",
      type: TransactionLedgerType.EXPENSE,
      amount: 431,
      transaction_date: "2026-10-03",
      note: "Ordinary transaction note",
      category_id: "category-id",
      transfer_group_id: null,
      jar_id: "jar-id",
      accounts: {
        ...SOURCE_ROW.accounts,
        name: "Expense account",
        financial_scope: FINANCIAL_SCOPE.PERSONAL,
      },
      categories: { name: "Groceries", icon_key: null },
      jars: { name: "Household needs" },
      transaction_tag_assignments: [
        {
          tag_id: "assigned-tag-id",
          transaction_tags: {
            id: "assigned-tag-id",
            name: "Assigned tag",
            icon_key: TransactionTagIconKey.BOOKMARK,
            color_key: TransactionTagColorKey.SLATE,
            archived_at: null,
          },
        },
      ],
    };
    const client = transactionClient(row, []);
    mocks.createSupabaseServerClient.mockResolvedValue(client as never);

    const result = await getTransactionReadResult(row.id);

    expect(result.status).toBe(TransactionReadStatus.OK);
    if (result.status === TransactionReadStatus.OK) {
      expect(result.transaction).toMatchObject({
        type: TransactionLedgerType.EXPENSE,
        amount: 431,
        currency: DEFAULT_CURRENCY,
        transactionDate: "2026-10-03",
        accountName: "Expense account",
        accountFinancialScope: FINANCIAL_SCOPE.PERSONAL,
        categoryName: "Groceries",
        jarName: "Household needs",
        note: "Ordinary transaction note",
        status: TransactionStatus.POSTED,
        tags: [
          expect.objectContaining({
            id: "assigned-tag-id",
            name: "Assigned tag",
          }),
        ],
      });
      const [activity] = createTransactionActivities([result.transaction]);
      expect(activity).toMatchObject({
        kind: TransactionActivityKind.EXPENSE,
        tone: TransactionActivityTone.DEBIT,
        canGenericCorrect: true,
        canGenericRefund: true,
      });
    }
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("does not project a one-sided transfer as a detail activity", async () => {
    const client = transactionClient(SOURCE_ROW, [SOURCE_ROW]);
    mocks.createSupabaseServerClient.mockResolvedValue(client as never);

    await expect(getTransactionActivity(SOURCE_ROW.id)).resolves.toBeNull();
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it.each([
    [TransactionLedgerType.TRANSFER_OUT, "source note", "destination note"],
    [TransactionLedgerType.TRANSFER_IN, "source note", "destination note"],
    [TransactionLedgerType.TRANSFER_OUT, null, "destination fallback"],
    [TransactionLedgerType.TRANSFER_IN, null, "destination fallback"],
  ] as const)(
    "projects the complete pair consistently when %s is selected",
    async (selectedType, sourceNote, destinationNote) => {
      const source = { ...SOURCE_ROW, note: sourceNote };
      const destination = { ...DESTINATION_ROW, note: destinationNote };
      const selectedRow =
        selectedType === TransactionLedgerType.TRANSFER_OUT
          ? source
          : destination;
      const client = transactionClient(selectedRow, [destination, source]);
      mocks.createSupabaseServerClient.mockResolvedValue(client as never);

      const activity = await getTransactionActivity(selectedRow.id);

      expect(activity?.kind).toBe(TransactionActivityKind.TRANSFER);
      expect(activity?.sourceAccount).toEqual({
        id: SOURCE_ROW.account_id,
        name: SOURCE_ROW.accounts.name,
      });
      expect(activity?.destinationAccount).toEqual({
        id: DESTINATION_ROW.account_id,
        name: DESTINATION_ROW.accounts.name,
      });
      expect(activity?.currency).toBe(DEFAULT_CURRENCY);
      expect(activity?.effectiveDate).toBe(SOURCE_ROW.transaction_date);
      expect(activity?.status).toBe(TransactionStatus.POSTED);
      expect(activity?.relatedTransactionIds).toEqual([
        SOURCE_ROW.id,
        DESTINATION_ROW.id,
      ]);
      expect(activity?.note).toBe(sourceNote ?? destinationNote);
      expect(client.from).toHaveBeenCalledTimes(2);
    },
  );

  it.each([
    ["missing leg", [SOURCE_ROW]],
    [
      "three rows",
      [SOURCE_ROW, DESTINATION_ROW, { ...SOURCE_ROW, id: "third-row" }],
    ],
    [
      "duplicate type",
      [
        SOURCE_ROW,
        { ...DESTINATION_ROW, type: TransactionLedgerType.TRANSFER_OUT },
      ],
    ],
    ["amount mismatch", [SOURCE_ROW, { ...DESTINATION_ROW, amount: 101 }]],
    [
      "currency mismatch",
      [SOURCE_ROW, { ...DESTINATION_ROW, currency: `${DEFAULT_CURRENCY}X` }],
    ],
    [
      "date mismatch",
      [SOURCE_ROW, { ...DESTINATION_ROW, transaction_date: "2026-10-02" }],
    ],
    [
      "savings-kind mismatch",
      [
        SOURCE_ROW,
        { ...DESTINATION_ROW, savings_event_kind: SavingsEventKind.INTEREST },
      ],
    ],
    [
      "non-posted leg",
      [
        SOURCE_ROW,
        {
          ...DESTINATION_ROW,
          status: TransactionStatus.PENDING_MAPPING,
        },
      ],
    ],
    [
      "same account",
      [SOURCE_ROW, { ...DESTINATION_ROW, account_id: SOURCE_ROW.account_id }],
    ],
    [
      "same transaction row",
      [SOURCE_ROW, { ...DESTINATION_ROW, id: SOURCE_ROW.id }],
    ],
  ] as const)("rejects a malformed transfer pair: %s", async (_case, rows) => {
    const client = transactionClient(SOURCE_ROW, rows);
    mocks.createSupabaseServerClient.mockResolvedValue(client as never);

    await expect(getTransactionActivity(SOURCE_ROW.id)).resolves.toBeNull();
  });

  it("requires the selected row to be present in its pair query", async () => {
    const selected = { ...SOURCE_ROW, id: "other-source-row" };
    const client = transactionClient(selected, [SOURCE_ROW, DESTINATION_ROW]);
    mocks.createSupabaseServerClient.mockResolvedValue(client as never);

    await expect(getTransactionActivity(selected.id)).resolves.toBeNull();
  });

  it("does not read financial data without active membership", async () => {
    mocks.assertMoneyActionAllowed.mockResolvedValue({
      ok: false,
      reason: MONEY_ACTION_DENIED_REASON.NO_MEMBERSHIP,
    });

    const result = await getTransactionReadResult(SOURCE_ROW.id);

    expect(result.status).toBe(TransactionReadStatus.ERROR);
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns not found when the selected transaction is absent", async () => {
    const client = transactionClient(null, []);
    mocks.createSupabaseServerClient.mockResolvedValue(client as never);

    const result = await getTransactionReadResult("unselected-row");

    expect(result.status).toBe(TransactionReadStatus.NOT_FOUND);
    expect(client.from).toHaveBeenCalledTimes(1);
  });
});

describe("transaction detail rows RPC migration contract", () => {
  it("anchors selection, keeps invoker RLS, and grants execute only to authenticated", () => {
    expect(DETAIL_ROWS_MIGRATION).toMatch(
      /returns setof public\.transactions/i,
    );
    expect(DETAIL_ROWS_MIGRATION).toMatch(/security invoker/i);
    expect(DETAIL_ROWS_MIGRATION).toMatch(/set search_path = ''/i);
    expect(DETAIL_ROWS_MIGRATION).toMatch(
      /where transaction_row\.id = p_transaction_id\s+and transaction_row\.household_id = p_household_id/i,
    );
    expect(DETAIL_ROWS_MIGRATION).not.toMatch(/p_transfer_group_id/i);
    expect(DETAIL_ROWS_MIGRATION).toMatch(
      /revoke execute on function public\.get_transaction_detail_rows\(uuid, uuid\) from public/i,
    );
    expect(DETAIL_ROWS_MIGRATION).toMatch(
      /revoke execute on function public\.get_transaction_detail_rows\(uuid, uuid\) from anon/i,
    );
    expect(DETAIL_ROWS_MIGRATION).toMatch(
      /grant execute on function public\.get_transaction_detail_rows\(uuid, uuid\) to authenticated/i,
    );
    expect(DETAIL_ROWS_MIGRATION).not.toMatch(
      /alter table public\.transactions/i,
    );
    expect(DETAIL_ROWS_MIGRATION).not.toMatch(/create policy/i);
  });
});
