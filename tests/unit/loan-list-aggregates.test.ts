import { describe, expect, it } from "vitest";
import { foldLoanListAggregates } from "@/modules/ledger/application/queries/list-money-products";
import { readFileSync } from "node:fs";

describe("listLoans aggregate batching", () => {
  it("folds payments and upcoming schedule rows per loan without per-id queries", () => {
    const result = foldLoanListAggregates({
      loanIds: ["loan-a", "loan-b", "loan-c"],
      payments: [
        { loan_id: "loan-a", principal_paid: 100, interest_paid: 10 },
        { loan_id: "loan-a", principal_paid: "50", interest_paid: "5" },
        { loan_id: "loan-b", principal_paid: 20, interest_paid: 2 },
      ],
      scheduleRows: [
        { loan_id: "loan-a", total_due: 300, sequence: 2 },
        { loan_id: "loan-a", total_due: 200, sequence: 1 },
        { loan_id: "loan-b", total_due: 80, sequence: 4 },
      ],
    });

    expect(result.get("loan-a")).toEqual({
      principalPaid: 150,
      interestPaid: 15,
      remainingPayments: 2,
      nextPaymentAmount: 200,
    });
    expect(result.get("loan-b")).toEqual({
      principalPaid: 20,
      interestPaid: 2,
      remainingPayments: 1,
      nextPaymentAmount: 80,
    });
    expect(result.get("loan-c")).toEqual({
      principalPaid: 0,
      interestPaid: 0,
      remainingPayments: 0,
      nextPaymentAmount: null,
    });
  });

  it("loads list aggregates with two household-scoped queries instead of per-loan N+1", () => {
    const source = readFileSync(
      "modules/ledger/application/queries/list-money-products.ts",
      "utf8",
    );
    expect(source).toContain("loadLoanAggregatesByIds");
    expect(source).toContain('.in("loan_id", loanIds)');
    expect(source).not.toMatch(
      /return Promise\.all\(\s*\(data \?\? \[\]\)\.map\(async \(row\) => \{/,
    );
  });
});
