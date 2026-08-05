import { describe, expect, it } from "vitest";
import {
  mapLiabilityRow,
  mapSavingsRow,
  mapLoanRow,
  LiabilityStatus,
  SavingsProductStatus,
} from "@/modules/ledger/application/money-product-types";
import {
  LoanStatus,
  LoanType,
  LoanRepaymentMethod,
  LoanTermUnit,
  LoanInterestStrategy,
} from "@/modules/ledger/application/ledger-constants";
import { createLoanInputSchema } from "@/modules/ledger/application/commands/money-products";

describe("money product mappers (ST-E04-004 + Loan amortization)", () => {
  it("maps liability remaining without inventing bank balance labels", () => {
    const debt = mapLiabilityRow({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Loan",
      creditor: "Bank",
      principal_amount: "10000000",
      remaining_amount: "4000000",
      currency: "vnd",
      due_day: 15,
      note: null,
      is_archived: false,
    });
    expect(debt.remainingAmount).toBe(4_000_000);
    expect(debt.status).toBe(LiabilityStatus.OPEN);
  });

  it("flags savings maturity when due", () => {
    const item = mapSavingsRow({
      id: "22222222-2222-2222-2222-222222222222",
      name: "Term",
      principal_amount: 5_000_000,
      currency: "VND",
      maturity_date: "2020-01-01",
      status: "active",
      note: null,
    });
    expect(item.isMaturityDue).toBe(true);
    expect(item.status).toBe(SavingsProductStatus.ACTIVE);
  });

  it("marks loan complete when remaining principal is zero", () => {
    const loan = mapLoanRow({
      id: "33333333-3333-3333-3333-333333333333",
      name: "Phone",
      lender: "Home Credit",
      loan_type: LoanType.STORE_FINANCING,
      principal: 12_000_000,
      remaining_principal: 0,
      annual_interest_rate: null,
      start_date: "2026-01-01",
      expected_end_date: "2026-12-01",
      repayment_frequency: "monthly",
      repayment_method: LoanRepaymentMethod.FIXED_MONTHLY,
      term_months: 12,
      monthly_payment: 1_000_000,
      total_interest: 0,
      total_repayment: 12_000_000,
      next_payment_date: null,
      currency: "VND",
      status: "active",
      note: null,
      due_day: 1,
    });
    expect(loan.status).toBe(LoanStatus.COMPLETED);
    expect(loan.remainingPayments).toBe(0);
    expect(loan.progress).toBe(1);
    expect(loan.lender).toBe("Home Credit");
  });

  it("create loan schema requires promo fields for promo strategy", () => {
    const rejected = createLoanInputSchema.safeParse({
      name: "Home loan",
      principal: 100_000_000,
      interestStrategy: LoanInterestStrategy.PROMO_FIXED_TO_FLOATING,
      repaymentMethod: LoanRepaymentMethod.FIXED_MONTHLY,
      termValue: 5,
      termUnit: LoanTermUnit.YEARS,
      loanType: LoanType.HOME,
      startDate: "2026-08-01",
    });
    expect(rejected.success).toBe(false);

    const parsed = createLoanInputSchema.safeParse({
      name: "Home loan",
      principal: 100_000_000,
      annualInterestRate: 9,
      interestStrategy: LoanInterestStrategy.FIXED,
      repaymentMethod: LoanRepaymentMethod.FIXED_MONTHLY,
      termValue: 5,
      termUnit: LoanTermUnit.YEARS,
      loanType: LoanType.HOME,
      startDate: "2026-08-01",
      cardLabel: "Visa",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(
        Object.prototype.hasOwnProperty.call(parsed.data, "cardLabel"),
      ).toBe(false);
      expect(
        Object.prototype.hasOwnProperty.call(parsed.data, "monthlyPayment"),
      ).toBe(false);
      expect(parsed.data.loanType).toBe(LoanType.HOME);
      expect(parsed.data.interestStrategy).toBe(LoanInterestStrategy.FIXED);
    }
  });

  it("maps interest-bearing active loan progress", () => {
    const loan = mapLoanRow(
      {
        id: "44444444-4444-4444-4444-444444444444",
        name: "Motorbike",
        lender: "Bank",
        loan_type: LoanType.VEHICLE,
        principal: 40_000_000,
        remaining_principal: 30_000_000,
        annual_interest_rate: 12,
        start_date: "2026-01-01",
        expected_end_date: null,
        repayment_frequency: "monthly",
        repayment_method: LoanRepaymentMethod.REDUCING_BALANCE,
        term_months: 20,
        monthly_payment: 2_000_000,
        total_interest: 5_000_000,
        total_repayment: 45_000_000,
        next_payment_date: "2026-09-01",
        currency: "VND",
        status: "active",
        note: null,
        due_day: 1,
      },
      {
        remainingPayments: 15,
        principalPaid: 10_000_000,
        interestPaid: 500_000,
      },
    );
    expect(loan.status).toBe(LoanStatus.ACTIVE);
    expect(loan.remainingPayments).toBe(15);
    expect(loan.annualInterestRate).toBe(12);
    expect(loan.repaymentMethod).toBe(LoanRepaymentMethod.REDUCING_BALANCE);
    expect(loan.progress).toBeCloseTo(0.25);
    expect(loan.interestPaid).toBe(500_000);
  });
});
