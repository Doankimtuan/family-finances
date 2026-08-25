import { describe, expect, it } from "vitest";
import { getLoanDueState } from "@/modules/ledger/application/loan-due-state";
import { LoanDueState } from "@/modules/ledger/application/loan-constants";

describe("Loan due states", () => {
  it.each([
    [null, LoanDueState.NONE],
    ["2026-08-20", LoanDueState.OVERDUE],
    ["2026-08-21", LoanDueState.DUE_TODAY],
    ["2026-08-27", LoanDueState.DUE_SOON],
    ["2026-08-29", LoanDueState.UPCOMING],
  ])("classifies %s", (date, expected) => {
    expect(getLoanDueState(date, "2026-08-21")).toBe(expected);
  });
});
