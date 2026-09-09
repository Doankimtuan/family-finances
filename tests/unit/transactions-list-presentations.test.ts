import { describe, expect, it } from "vitest";
import {
  createTransactionActivities,
  TRANSACTION_CURSOR_QUERY_PARAM,
  TRANSACTION_TAG_FILTER_QUERY_PARAM,
  TRANSACTION_TYPE_QUERY_PARAM,
  TransactionActivityKind,
  TransactionActivityTone,
  TransactionFilterType,
  TransactionLedgerType,
  TransactionStatus,
  type LedgerTransaction,
} from "@/modules/ledger/application";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { todayIsoDate } from "@/shared/utils/iso-date";
import {
  activityStatusMeta,
  activitySubtitle,
  activityTitle,
  amountAriaToneKey,
  dateGroupLabel,
  groupActivities,
  transactionsListHref,
} from "@/app/[locale]/(product)/money/transactions/transactions-list-presentations";

const KIND_LABELS: Record<TransactionActivityKind, string> = {
  [TransactionActivityKind.INCOME]: "Income",
  [TransactionActivityKind.EXPENSE]: "Expense",
  [TransactionActivityKind.TRANSFER]: "Transfer",
  [TransactionActivityKind.REFUND]: "Refund",
  [TransactionActivityKind.LIABILITY_PAYMENT]: "Liability payment",
  [TransactionActivityKind.LOAN_INTEREST]: "Loan interest",
  [TransactionActivityKind.DEBT_BORROWING]: "Borrowed money",
  [TransactionActivityKind.DEBT_LENDING]: "Money lent",
  [TransactionActivityKind.DEBT_RECEIPT]: "Debt receipt",
  [TransactionActivityKind.SAVINGS]: "Savings",
  [TransactionActivityKind.INVESTMENT]: "Investment",
  [TransactionActivityKind.OTHER]: "Other",
};

function row(overrides: Partial<LedgerTransaction> = {}): LedgerTransaction {
  return {
    id: "transaction-id",
    accountId: "account-id",
    accountName: "Cash",
    type: TransactionLedgerType.EXPENSE,
    amount: 85_000,
    currency: "VND",
    transactionDate: todayIsoDate(),
    note: "Coffee shop",
    categoryId: "category-id",
    categoryName: "Food",
    jarId: null,
    jarName: null,
    status: TransactionStatus.POSTED,
    transferGroupId: null,
    loanPaymentId: null,
    reversesTransactionId: null,
    correctsTransactionId: null,
    isReversal: false,
    createdAt: `${todayIsoDate()}T08:00:00.000Z`,
    ...overrides,
  };
}

const tCatalog = (key: string) => key;

describe("transactions list presentation", () => {
  it("prioritizes merchant/note then category and account", () => {
    const [activity] = createTransactionActivities([row()]);
    const title = activityTitle(activity, KIND_LABELS, tCatalog);

    expect(title).toBe("Coffee shop");
    expect(activitySubtitle(activity, title, KIND_LABELS, tCatalog)).toBe(
      "tags.food · accounts.cash",
    );
  });

  it("groups consecutive activities by effective date", () => {
    const today = todayIsoDate();
    const [first] = createTransactionActivities([
      row({ id: "one", transactionDate: today }),
    ]);
    const [second] = createTransactionActivities([
      row({
        id: "two",
        transactionDate: "2020-01-02",
        createdAt: "2020-01-02T00:00:00.000Z",
      }),
    ]);
    const [third] = createTransactionActivities([
      row({
        id: "three",
        transactionDate: "2020-01-02",
        createdAt: "2020-01-02T01:00:00.000Z",
      }),
    ]);

    expect(groupActivities([first, second, third])).toEqual([
      { date: today, activities: [first] },
      { date: "2020-01-02", activities: [second, third] },
    ]);
  });

  it("uses localized today/yesterday labels without hardcoded locale copy", () => {
    const today = todayIsoDate();
    const labels = { today: "Hôm nay", yesterday: "Hôm qua" };

    expect(dateGroupLabel(today, "vi", labels)).toBe("Hôm nay");
  });

  it("keeps posted status off the row meta and exposes movement aria keys", () => {
    const [posted] = createTransactionActivities([row()]);
    const [pending] = createTransactionActivities([
      row({
        id: "pending",
        status: TransactionStatus.PENDING_MAPPING,
      }),
    ]);

    expect(activityStatusMeta(posted, () => "Recorded")).toBe("");
    expect(activityStatusMeta(pending, (status) => `status.${status}`)).toBe(
      `status.${TransactionStatus.PENDING_MAPPING}`,
    );
    expect(amountAriaToneKey(TransactionActivityTone.DEBIT)).toBe(
      "amountAria.debit",
    );
    expect(amountAriaToneKey(TransactionActivityTone.CREDIT)).toBe(
      "amountAria.credit",
    );
  });

  it("preserves existing filter query params", () => {
    expect(
      transactionsListHref(
        TransactionFilterType.EXPENSE,
        ["tag-1"],
        "cursor-1",
      ),
    ).toBe(
      `${APP_PATH.MONEY_TRANSACTIONS}?${TRANSACTION_TYPE_QUERY_PARAM}=${TransactionFilterType.EXPENSE}&${TRANSACTION_TAG_FILTER_QUERY_PARAM}=tag-1&${TRANSACTION_CURSOR_QUERY_PARAM}=cursor-1`,
    );
  });
});
