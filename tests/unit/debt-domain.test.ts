import { describe, expect, it } from "vitest";
import {
  buildDebtSummary,
  buildDebtPaymentReview,
  getDebtPaymentReconciliation,
  getDebtDueState,
  getDebtProgress,
  mapDebtRow,
} from "@/modules/ledger/application";
import {
  DebtDirection,
  DebtCreationMode,
  DEFAULT_CURRENCY,
  AccountType,
  DebtDueState,
  DebtStatus,
  TransactionLedgerType,
} from "@/modules/ledger/application/ledger-constants";
import { applyTransactionDeltas } from "@/modules/ledger/application/transaction-types";

const TODAY = "2026-08-13";

function debtRow(overrides: Partial<Parameters<typeof mapDebtRow>[0]> = {}) {
  return {
    id: "debt-id",
    name: "Mai",
    creditor: "Mai",
    principal_amount: 10_000_000,
    remaining_amount: 10_000_000,
    currency: DEFAULT_CURRENCY,
    direction: DebtDirection.BORROWED,
    creation_mode: DebtCreationMode.EXISTING_BALANCE,
    start_date: TODAY,
    due_date: null,
    note: null,
    status: DebtStatus.ACTIVE,
    origin_account_id: null,
    origin_transaction_id: null,
    is_archived: false,
    ...overrides,
  };
}

describe("debt domain", () => {
  it("distinguishes a lent receivable from a borrowed liability", () => {
    const lent = mapDebtRow(debtRow({ direction: DebtDirection.LENT }));
    const borrowed = mapDebtRow(debtRow({ direction: DebtDirection.BORROWED }));
    const summary = buildDebtSummary([lent, borrowed], TODAY);
    expect(summary.totalLent).toBe(10_000_000);
    expect(summary.totalBorrowed).toBe(10_000_000);
  });

  it("calculates partial repayment progress without negative remaining money", () => {
    const progress = getDebtProgress({
      principalAmount: 10_000_000,
      remainingAmount: 7_000_000,
    });
    expect(progress.paidAmount).toBe(3_000_000);
    expect(progress.percent).toBe(30);
  });

  it("reconciles derived paid amount with recorded payments and opening paid amount", () => {
    const debt = mapDebtRow(
      debtRow({
        principal_amount: 1_009_900,
        remaining_amount: 0,
        opening_paid_amount: 10_000,
      }),
    );
    const reconciliation = getDebtPaymentReconciliation(debt, [
      { amount: 999_900 },
    ]);

    expect(reconciliation).toEqual({
      derivedPaidAmount: 1_009_900,
      recordedPaidAmount: 999_900,
      openingPaidAmount: 10_000,
      unallocatedPaidAmount: 0,
      isReconciled: true,
    });
  });

  it("shows at least 1% after any principal payment that is not complete", () => {
    const progress = getDebtProgress({
      principalAmount: 99_990_000,
      remainingAmount: 99_980_000,
    });
    expect(progress.paidAmount).toBe(10_000);
    expect(progress.percent).toBe(1);
  });

  it("derives due status from a real due date and completion state", () => {
    const overdue = mapDebtRow(debtRow({ due_date: "2026-08-12" }));
    const complete = mapDebtRow(
      debtRow({ remaining_amount: 0, status: DebtStatus.COMPLETED }),
    );
    expect(getDebtDueState(overdue, TODAY)).toBe(DebtDueState.OVERDUE);
    expect(getDebtDueState(complete, TODAY)).toBe(DebtDueState.COMPLETED);
  });

  it("keeps principal debt movements out of ordinary income and expense", () => {
    const [account] = applyTransactionDeltas(
      [
        {
          id: "account-id",
          name: "Cash",
          type: AccountType.CASH,
          openingBalance: 0,
          balance: 0,
          isArchived: false,
        },
      ],
      [
        {
          accountId: "account-id",
          type: TransactionLedgerType.DEBT_BORROWING,
          amount: 5_000_000,
        },
        {
          accountId: "account-id",
          type: TransactionLedgerType.DEBT_LENDING,
          amount: 2_000_000,
        },
        {
          accountId: "account-id",
          type: TransactionLedgerType.DEBT_RECEIVABLE_PAYMENT,
          amount: 1_000_000,
        },
      ],
    );
    expect(account.balance).toBe(4_000_000);
  });
  it("prepares a partial repayment review without completing the debt", () => {
    expect(buildDebtPaymentReview(10_000_000, 2_500_000)).toEqual({
      paymentAmount: 2_500_000,
      remainingAfterPayment: 7_500_000,
      completesDebt: false,
    });
  });

  it("marks a repayment review complete when it clears the remaining principal", () => {
    expect(buildDebtPaymentReview(10_000_000, 10_000_000)).toEqual({
      paymentAmount: 10_000_000,
      remainingAfterPayment: 0,
      completesDebt: true,
    });
  });

  it("never produces a negative remaining amount in the repayment review", () => {
    expect(buildDebtPaymentReview(10_000_000, 12_000_000)).toMatchObject({
      remainingAfterPayment: 0,
      completesDebt: true,
    });
  });
});
