import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTransactionActivities,
  TransactionActivityBreakdownKind,
  TransactionLedgerType,
  TransactionStatus,
  type LedgerTransaction,
} from "@/modules/ledger/application";

const queryPath = join(
  process.cwd(),
  "modules/ledger/application/queries/get-transaction.ts",
);
const detailPath = join(
  process.cwd(),
  "app/[locale]/(product)/money/transactions/[id]/page.tsx",
);

function loanRow(
  index: number,
  type: LedgerTransaction["type"],
): LedgerTransaction {
  return {
    id: `${type}-${index}`,
    accountId: "account-id",
    accountName: "Cash",
    type,
    amount: type === TransactionLedgerType.LIABILITY_PAYMENT ? 900 : 100,
    currency: "VND",
    transactionDate: "2026-08-24",
    note: null,
    categoryId: null,
    categoryName: null,
    jarId: null,
    jarName: null,
    status: TransactionStatus.POSTED,
    transferGroupId: null,
    loanPaymentId: `payment-${index}`,
    reversesTransactionId: null,
    correctsTransactionId: null,
    isReversal: false,
    createdAt: `2026-08-24T00:00:${String(index).padStart(2, "0")}.000Z`,
  };
}

describe("transaction event pagination query shape", () => {
  it("uses bounded keyset reads instead of the removed full-history call", () => {
    const source = readFileSync(queryPath, "utf8");

    expect(source).toContain(".limit(limit)");
    expect(source).toContain("cursorPredicate(cursor)");
    expect(source).toContain("TRANSACTION_EVENT_PAGE_LOOKAHEAD_MULTIPLIER");
    expect(source).not.toContain("limit: null");
  });

  it("keeps grouped loan events whole inside a bounded lookahead fixture", () => {
    const history = Array.from({ length: 1_000 }, (_, index) => [
      loanRow(index, TransactionLedgerType.LIABILITY_PAYMENT),
      loanRow(index, TransactionLedgerType.LOAN_INTEREST),
    ]).flat();
    const boundedRows = history.slice(0, 52);
    const activities = createTransactionActivities(boundedRows);

    expect(activities).toHaveLength(26);
    expect(
      activities.every(
        (activity) =>
          activity.breakdown.kind ===
          TransactionActivityBreakdownKind.LOAN_PAYMENT,
      ),
    ).toBe(true);
    expect(
      activities.flatMap((activity) => activity.relatedTransactionIds),
    ).toHaveLength(52);
  });

  it("keeps the Loan breakdown on a privacy-aware detail surface", () => {
    const source = readFileSync(detailPath, "utf8");

    expect(source).toContain('data-testid="loan-payment-breakdown"');
    expect(source).toContain("detailPage.loanBreakdown.principal");
    expect(source).toContain("detailPage.loanBreakdown.interest");
    expect(source).toContain("<FinancialValue>");
  });
});
