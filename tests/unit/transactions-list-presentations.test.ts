import { describe, expect, it } from "vitest";
import { formatDate } from "@/shared/i18n/formatters";
import { summarizeTransactionActivities } from "@/modules/ledger/application/transaction-activity-summary";
import {
  createTransactionActivities,
  TRANSACTION_CURSOR_QUERY_PARAM,
  TRANSACTION_CATEGORY_QUERY_PARAM,
  TRANSACTION_JAR_QUERY_PARAM,
  TRANSACTION_SEARCH_QUERY_PARAM,
  TRANSACTION_TAG_FILTER_QUERY_PARAM,
  TRANSACTION_TYPE_QUERY_PARAM,
  TransactionActivityKind,
  TransactionActivityTone,
  TransactionFilterType,
  TransactionLedgerType,
  TransactionStatus,
  TransactionActivityBreakdownKind,
  type LedgerTransaction,
} from "@/modules/ledger/application";
import { APP_API_PATH, APP_PATH } from "@/modules/tenancy/application/app-path";
import { todayIsoDate } from "@/shared/utils/iso-date";
import {
  activityStatusMeta,
  activitySubtitle,
  activityTitle,
  amountAriaToneKey,
  dateGroupLabel,
  groupActivities,
  transactionsListHref,
  transactionsEventsHref,
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

describe("complete transaction date summaries", () => {
  it("keeps currencies separate and excludes internal transfers", () => {
    const activities = createTransactionActivities([
      row({ id: "expense", amount: 120_000 }),
      row({
        id: "income",
        type: TransactionLedgerType.INCOME,
        amount: 280_000,
      }),
      row({ id: "usd", currency: "USD", amount: 25 }),
      row({
        id: "out",
        type: TransactionLedgerType.TRANSFER_OUT,
        amount: 500_000,
        transferGroupId: "transfer",
      }),
      row({
        id: "in",
        type: TransactionLedgerType.TRANSFER_IN,
        amount: 500_000,
        transferGroupId: "transfer",
      }),
    ]);
    const totals = summarizeTransactionActivities(activities);
    expect(totals).toHaveLength(2);
    expect(totals).toEqual(
      expect.arrayContaining([
        { currency: "VND", income: 280_000, expense: 120_000 },
        { currency: "USD", income: 0, expense: 25 },
      ]),
    );
  });
  it("counts only the expense contribution of a combined loan payment", () => {
    const [activity] = createTransactionActivities([row()]);
    expect(
      summarizeTransactionActivities([
        {
          ...activity,
          amount: 1_100_000,
          breakdown: {
            kind: TransactionActivityBreakdownKind.LOAN_PAYMENT,
            totalPaid: 1_100_000,
            principalAmount: 1_000_000,
            interestAmount: 100_000,
            expenseContribution: 100_000,
            neutralContribution: 1_000_000,
          },
        },
      ]),
    ).toEqual([{ currency: "VND", income: 0, expense: 100_000 }]);
  });
});

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

    expect(dateGroupLabel(today, "vi", labels)).toBe(
      `Hôm nay, ${formatDate(new Date(`${today}T00:00:00Z`), "vi", { month: "long", day: "numeric" })}`,
    );
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

  it("keeps pagination cursors out of transaction-list URLs", () => {
    const href = transactionsListHref(TransactionFilterType.EXPENSE, ["tag-1"]);

    expect(href).toBe(
      `${APP_PATH.MONEY_TRANSACTIONS}?${TRANSACTION_TYPE_QUERY_PARAM}=${TransactionFilterType.EXPENSE}&${TRANSACTION_TAG_FILTER_QUERY_PARAM}=tag-1`,
    );
    expect(href).not.toContain(`${TRANSACTION_CURSOR_QUERY_PARAM}=`);
  });

  it("keeps search filters in the list URL and sends cursors only to the page API", () => {
    const filters = {
      q: "Lunch",
      categoryIds: ["category-id", "category-id-2"],
      jarIds: ["jar-id", "jar-id-2"],
    };
    const listHref = transactionsListHref(
      TransactionFilterType.ALL,
      [],
      filters,
    );
    const eventsHref = transactionsEventsHref(
      TransactionFilterType.ALL,
      [],
      "cursor-1",
      filters,
    );

    expect(listHref).toBe(
      `${APP_PATH.MONEY_TRANSACTIONS}?${TRANSACTION_SEARCH_QUERY_PARAM}=Lunch&${TRANSACTION_CATEGORY_QUERY_PARAM}=category-id%2Ccategory-id-2&${TRANSACTION_JAR_QUERY_PARAM}=jar-id%2Cjar-id-2`,
    );
    expect(eventsHref).toBe(
      `${APP_API_PATH.TRANSACTION_EVENTS}?${TRANSACTION_SEARCH_QUERY_PARAM}=Lunch&${TRANSACTION_CATEGORY_QUERY_PARAM}=category-id%2Ccategory-id-2&${TRANSACTION_JAR_QUERY_PARAM}=jar-id%2Cjar-id-2&${TRANSACTION_CURSOR_QUERY_PARAM}=cursor-1`,
    );
    expect(listHref).not.toContain(`${TRANSACTION_CURSOR_QUERY_PARAM}=`);
  });
});
