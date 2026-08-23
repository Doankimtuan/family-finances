import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  applyTransactionDeltas,
  classifyFinancialEvent,
  FinancialClassification,
  isLoanPaymentAccountType,
  TransactionLedgerType,
  type LedgerAccount,
} from "@/modules/ledger/application";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";

const MIGRATION = readFileSync(
  "supabase/migrations/20260821120000_loans_p0_integrity_gate_11b.sql",
  "utf8",
);

const account: LedgerAccount = {
  id: "cash",
  name: "Cash",
  type: "cash",
  balance: 1_000_000,
  isArchived: false,
  financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
  ownerMembershipId: null,
  isPersonal: false,
  isOwnedByMe: true,
  canMutate: true,
  ownerStatus: OWNER_STATUS.ACTIVE,
};

describe("Loans 11B P0 integrity contract", () => {
  it("keeps investment containers out of Loan payment sources", () => {
    expect(isLoanPaymentAccountType("cash")).toBe(true);
    expect(isLoanPaymentAccountType("brokerage")).toBe(false);
    expect(isLoanPaymentAccountType("savings_product")).toBe(false);
  });
  it("keeps principal neutral and interest as Expense", () => {
    expect(
      classifyFinancialEvent({
        type: TransactionLedgerType.LIABILITY_PAYMENT,
      }),
    ).toMatchObject({
      classification: FinancialClassification.NON_EXPENSE_OUTFLOW,
      countsTowardIncome: false,
      countsTowardExpense: false,
    });
    expect(
      classifyFinancialEvent({ type: TransactionLedgerType.LOAN_INTEREST }),
    ).toMatchObject({
      classification: FinancialClassification.EXPENSE,
      countsTowardIncome: false,
      countsTowardExpense: true,
    });
  });

  it("debits the account by principal plus interest exactly once", () => {
    const [updated] = applyTransactionDeltas(
      [account],
      [
        {
          accountId: "cash",
          type: TransactionLedgerType.LIABILITY_PAYMENT,
          amount: 100_000,
        },
        {
          accountId: "cash",
          type: TransactionLedgerType.LOAN_INTEREST,
          amount: 1_000,
        },
      ],
    );
    expect(updated.balance).toBe(899_000);
  });

  it("requires scoped replay keys and keeps the unchecked RPC private", () => {
    expect(MIGRATION).toContain("loans_household_idempotency_unique");
    expect(MIGRATION).toContain("loan_payments_household_idempotency_unique");
    expect(MIGRATION).toContain("p_idempotency_key text default null");
    expect(MIGRATION).toContain("raise exception 'Idempotency key required'");
    expect(MIGRATION).toContain(
      "revoke all on function public._record_loan_payment_unchecked_11b",
    );
    expect(MIGRATION).toContain(
      "grant execute on function public.record_loan_payment",
    );
  });
});
