import { describe, expect, it } from "vitest";
import {
  allocateCreditCardInstallments,
  buildCreditCardInstallmentPreview,
  buildCreditCardInstallmentViewModel,
  isStructurallyEligibleCardPurchase,
  roundVndPercentage,
} from "@/modules/ledger/application/credit-card-installments";
import {
  CreditCardInstallmentCalculationSource,
  CreditCardInstallmentFeeTiming,
  CreditCardInstallmentFeeType,
  CreditCardInstallmentOrigin,
  CreditCardInstallmentProgram,
  CreditCardInstallmentScheduleStatus,
  CreditCardInstallmentStatus,
} from "@/modules/ledger/application/ledger-constants";

const zeroFeeInput = {
  principal: 1_000_000,
  termCount: 3,
  firstExpectedDate: "2026-09-15",
  program: CreditCardInstallmentProgram.ZERO_INTEREST_ZERO_FEE,
  calculationSource: CreditCardInstallmentCalculationSource.DERIVED,
  conversionFeeType: CreditCardInstallmentFeeType.NONE,
  feeTiming: CreditCardInstallmentFeeTiming.FIRST_EXPECTED_PERIOD,
};

describe("transaction-linked card installment calculations", () => {
  it("allocates indivisible VND remainder to the final expected period", () => {
    const allocations = allocateCreditCardInstallments(1_000_000, 3);
    expect(allocations).toEqual([333_333, 333_333, 333_334]);
    expect(allocations.reduce((sum, amount) => sum + amount, 0)).toBe(
      1_000_000,
    );
    expect(allocateCreditCardInstallments(0, 3)).toEqual([]);
    expect(allocateCreditCardInstallments(1_000, 0)).toEqual([]);
  });

  it("models true 0% and 0 fee without extra repayment", () => {
    const preview = buildCreditCardInstallmentPreview(zeroFeeInput);
    expect(preview).not.toBeNull();
    expect(preview?.conversionFeeAmount).toBe(0);
    expect(preview?.interestAmount).toBe(0);
    expect(preview?.totalExtraCost).toBe(0);
    expect(preview?.totalRepayment).toBe(1_000_000);
    expect(preview?.schedule.map((row) => row.totalAmount)).toEqual([
      333_333, 333_333, 333_334,
    ]);
  });

  it("keeps a 0% conversion fee visible as a separate extra cost", () => {
    const preview = buildCreditCardInstallmentPreview({
      ...zeroFeeInput,
      program: CreditCardInstallmentProgram.ZERO_INTEREST_WITH_CONVERSION_FEE,
      conversionFeeType: CreditCardInstallmentFeeType.FIXED,
      conversionFeeFixedAmount: 120_000,
    });
    expect(preview?.conversionFeeAmount).toBe(120_000);
    expect(preview?.interestAmount).toBe(0);
    expect(preview?.totalExtraCost).toBe(120_000);
    expect(preview?.totalRepayment).toBe(1_120_000);
    expect(preview?.schedule[0]?.conversionFeeAmount).toBe(120_000);
  });

  it("rounds percentage conversion fees safely in VND and reconciles spread fees", () => {
    expect(roundVndPercentage(1_000_001, 250)).toBe(25_000);
    const preview = buildCreditCardInstallmentPreview({
      ...zeroFeeInput,
      termCount: 6,
      program: CreditCardInstallmentProgram.ZERO_INTEREST_WITH_CONVERSION_FEE,
      conversionFeeType: CreditCardInstallmentFeeType.PERCENTAGE,
      conversionFeeRateBps: 250,
      feeTiming: CreditCardInstallmentFeeTiming.SPREAD_ACROSS_PERIODS,
    });
    expect(preview?.conversionFeeAmount).toBe(25_000);
    expect(
      preview?.schedule.reduce((sum, row) => sum + row.conversionFeeAmount, 0),
    ).toBe(25_000);
  });

  it("supports flat interest and bank-quoted repayment without issuer policy rules", () => {
    const interestPreview = buildCreditCardInstallmentPreview({
      ...zeroFeeInput,
      program:
        CreditCardInstallmentProgram.FLAT_INTEREST_WITHOUT_CONVERSION_FEE,
      flatInterestRateBps: 100,
    });
    expect(interestPreview?.interestAmount).toBe(30_000);
    expect(interestPreview?.totalRepayment).toBe(1_030_000);

    const quotedPreview = buildCreditCardInstallmentPreview({
      ...zeroFeeInput,
      program: CreditCardInstallmentProgram.BANK_QUOTED,
      calculationSource: CreditCardInstallmentCalculationSource.BANK_QUOTED,
      quotedTotalRepayment: 1_080_000,
    });
    expect(quotedPreview?.interestAmount).toBe(80_000);
    expect(quotedPreview?.totalRepayment).toBe(1_080_000);
  });

  it("derives tracking progress only from explicitly confirmed expected periods", () => {
    const preview = buildCreditCardInstallmentPreview(zeroFeeInput)!;
    const installment = {
      id: "plan-1",
      cardAccountId: "card-1",
      sourceTransactionId: "tx-1",
      origin: CreditCardInstallmentOrigin.POST_PURCHASE,
      description: "Laptop",
      principal: preview.principal,
      termCount: 3,
      firstExpectedDate: "2026-09-15",
      program: CreditCardInstallmentProgram.ZERO_INTEREST_ZERO_FEE,
      calculationSource: CreditCardInstallmentCalculationSource.DERIVED,
      conversionFeeType: CreditCardInstallmentFeeType.NONE,
      conversionFeeRateBps: null,
      conversionFeeAmount: 0,
      feeTiming: CreditCardInstallmentFeeTiming.FIRST_EXPECTED_PERIOD,
      flatInterestRateBps: null,
      totalInterestAmount: 0,
      quotedTotalRepayment: null,
      status: CreditCardInstallmentStatus.ACTIVE,
      note: null,
      schedule: preview.schedule.map((row, index) => ({
        ...row,
        status:
          index === 0
            ? CreditCardInstallmentScheduleStatus.CONFIRMED
            : CreditCardInstallmentScheduleStatus.EXPECTED,
        confirmedAt: index === 0 ? "2026-09-16T00:00:00.000Z" : null,
      })),
    };
    const viewModel = buildCreditCardInstallmentViewModel(installment);
    expect(viewModel.confirmedTerms).toBe(1);
    expect(viewModel.progressPercent).toBe(33);
    expect(viewModel.paidAmount).toBe(333_333);
    expect(viewModel.remainingAmount).toBe(666_667);
    expect(viewModel.nextExpected?.installmentNumber).toBe(2);
  });

  it("limits product eligibility to untracked, positive expense purchases without corrections", () => {
    expect(
      isStructurallyEligibleCardPurchase({
        amount: 1_000_000,
        transactionType: "expense",
        hasRefundOrCorrection: false,
        alreadyTracked: false,
      }),
    ).toBe(true);
    expect(
      isStructurallyEligibleCardPurchase({
        amount: 1_000_000,
        transactionType: "income",
        hasRefundOrCorrection: false,
        alreadyTracked: false,
      }),
    ).toBe(false);
    expect(
      isStructurallyEligibleCardPurchase({
        amount: 1_000_000,
        transactionType: "expense",
        hasRefundOrCorrection: true,
        alreadyTracked: false,
      }),
    ).toBe(false);
    expect(
      isStructurallyEligibleCardPurchase({
        amount: 1_000_000,
        transactionType: "expense",
        hasRefundOrCorrection: false,
        alreadyTracked: true,
      }),
    ).toBe(false);
  });
});
