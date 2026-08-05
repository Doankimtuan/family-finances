import { describe, expect, it } from "vitest";
import {
  buildAmortizationSchedule,
  buildFixedMonthlySchedule,
  buildRateSegmentsFromStrategy,
  buildReducingBalanceSchedule,
  computeEarlyPayoffAmount,
  normalizeTermToMonths,
  recomputeUpcomingSchedule,
  simulateLoanPreview,
} from "@/modules/ledger/application/loan-amortization";
import {
  LoanInterestStrategy,
  LoanRepaymentMethod,
  LoanTermUnit,
} from "@/modules/ledger/application/ledger-constants";

describe("loan amortization engine", () => {
  it("normalizes years to months", () => {
    expect(normalizeTermToMonths(5, LoanTermUnit.YEARS)).toBe(60);
    expect(normalizeTermToMonths(24, LoanTermUnit.MONTHS)).toBe(24);
  });

  it("builds interest-free fixed schedule that sums to principal", () => {
    const schedule = buildFixedMonthlySchedule({
      principal: 12_000_000,
      annualRatePct: 0,
      termMonths: 12,
      firstPaymentDate: "2026-09-01",
    });
    expect(schedule.entries).toHaveLength(12);
    expect(schedule.totalInterest).toBe(0);
    expect(schedule.entries.reduce((sum, e) => sum + e.principalDue, 0)).toBe(
      12_000_000,
    );
    expect(schedule.entries[11]?.remainingBalanceAfter).toBe(0);
    expect(schedule.endDate).toBe("2027-08-01");
  });

  it("builds fixed monthly schedule for 200M @ 9% / 60 months", () => {
    const schedule = buildFixedMonthlySchedule({
      principal: 200_000_000,
      annualRatePct: 9,
      termMonths: 60,
      firstPaymentDate: "2026-09-01",
    });
    expect(schedule.entries).toHaveLength(60);
    expect(schedule.monthlyPayment).toBeGreaterThan(3_000_000);
    expect(schedule.monthlyPayment).toBeLessThan(5_000_000);
    expect(schedule.totalInterest).toBeGreaterThan(0);
    expect(schedule.entries.reduce((sum, e) => sum + e.principalDue, 0)).toBe(
      200_000_000,
    );
    expect(schedule.entries[0]?.interestDue).toBeGreaterThan(
      schedule.entries[59]?.interestDue ?? 0,
    );
    expect(schedule.entries[59]?.remainingBalanceAfter).toBe(0);
  });

  it("reducing balance has declining total payments", () => {
    const schedule = buildReducingBalanceSchedule({
      principal: 12_000_000,
      annualRatePct: 12,
      termMonths: 12,
      firstPaymentDate: "2026-01-15",
    });
    expect(schedule.entries[0]!.totalDue).toBeGreaterThan(
      schedule.entries[11]!.totalDue,
    );
    expect(schedule.entries.reduce((sum, e) => sum + e.principalDue, 0)).toBe(
      12_000_000,
    );
  });

  it("fixed and reducing diverge for same inputs", () => {
    const fixed = buildAmortizationSchedule({
      principal: 100_000_000,
      annualRatePct: 10,
      termMonths: 36,
      firstPaymentDate: "2026-02-01",
      repaymentMethod: LoanRepaymentMethod.FIXED_MONTHLY,
      rateSegments: [],
    });
    const reducing = buildAmortizationSchedule({
      principal: 100_000_000,
      annualRatePct: 10,
      termMonths: 36,
      firstPaymentDate: "2026-02-01",
      repaymentMethod: LoanRepaymentMethod.REDUCING_BALANCE,
      rateSegments: [],
    });
    expect(fixed.monthlyPayment).not.toBe(reducing.monthlyPayment);
    expect(fixed.totalInterest).not.toBe(reducing.totalInterest);
  });

  it("promo fixed→floating steps monthly payment after change", () => {
    const segments = buildRateSegmentsFromStrategy({
      interestStrategy: LoanInterestStrategy.PROMO_FIXED_TO_FLOATING,
      firstPaymentDate: "2026-01-01",
      annualInterestRate: 0,
      promoFixedRate: 5,
      promoFixedMonths: 12,
      promoFloatingRate: 12,
    });
    const schedule = buildAmortizationSchedule({
      principal: 120_000_000,
      termMonths: 24,
      firstPaymentDate: "2026-01-01",
      repaymentMethod: LoanRepaymentMethod.FIXED_MONTHLY,
      rateSegments: segments,
    });
    expect(schedule.changeAfterMonths).toBe(12);
    expect(schedule.rateChangeDate).toBe("2027-01-01");
    expect(schedule.monthlyPaymentAfterChange).not.toBeNull();
    expect(schedule.monthlyPaymentAfterChange).not.toBe(
      schedule.monthlyPayment,
    );
    expect(schedule.entries[0]?.annualRatePct).toBe(5);
    expect(schedule.entries[12]?.annualRatePct).toBe(12);
  });

  it("promo reducing-balance preview uses first period vs first post-switch period", () => {
    const preview = simulateLoanPreview({
      principal: 1_000_000_000,
      annualInterestRate: 0,
      termValue: 15,
      termUnit: LoanTermUnit.YEARS,
      repaymentMethod: LoanRepaymentMethod.REDUCING_BALANCE,
      firstPaymentDate: "2026-08-21",
      interestStrategy: LoanInterestStrategy.PROMO_FIXED_TO_FLOATING,
      promoFixedRate: 8,
      promoFixedMonths: 12,
      promoFloatingRate: 11,
    });
    expect(preview).not.toBeNull();
    expect(preview!.changeAfterMonths).toBe(12);
    expect(preview!.rateChangeDate).toBe("2027-08-21");
    // round(1e9/180)=5_555_556; month-1 interest on full principal at 8%.
    expect(preview!.monthlyPayment).toBe(12_222_223);
    // After 12 slices, remaining 933_333_328 × 11%/12 → installment steps up.
    expect(preview!.monthlyPaymentAfterChange).toBe(14_111_112);
    expect(preview!.monthlyPaymentAfterChange).toBeGreaterThan(
      preview!.monthlyPayment,
    );
    // Total interest stays near ~800.5M (not EMI-scale ~1B+).
    expect(preview!.totalInterest).toBeGreaterThan(800_000_000);
    expect(preview!.totalInterest).toBeLessThan(801_000_000);
    expect(preview!.totalRepayment).toBe(
      1_000_000_000 + preview!.totalInterest,
    );
  });

  it("reducing-balance schedule never charges interest on original principal after promo", () => {
    const segments = buildRateSegmentsFromStrategy({
      interestStrategy: LoanInterestStrategy.PROMO_FIXED_TO_FLOATING,
      firstPaymentDate: "2026-08-21",
      annualInterestRate: 0,
      promoFixedRate: 8,
      promoFixedMonths: 12,
      promoFloatingRate: 11,
    });
    const schedule = buildAmortizationSchedule({
      principal: 1_000_000_000,
      termMonths: 180,
      firstPaymentDate: "2026-08-21",
      repaymentMethod: LoanRepaymentMethod.REDUCING_BALANCE,
      rateSegments: segments,
    });
    const slice = Math.round(1_000_000_000 / 180);
    expect(schedule.entries[0]?.principalDue).toBe(slice);
    expect(schedule.entries[0]?.interestDue).toBe(6_666_667);
    expect(schedule.entries[12]?.principalDue).toBe(slice);
    expect(schedule.entries[12]?.interestDue).toBe(8_555_556);
    expect(schedule.entries[12]?.totalDue).toBe(14_111_112);
    // Guard against the false "17,222,222" pattern (slice + interest on full P at 14%).
    expect(schedule.entries[12]?.totalDue).not.toBe(17_222_222);
    expect(schedule.entries.reduce((sum, e) => sum + e.principalDue, 0)).toBe(
      1_000_000_000,
    );
  });

  it("recomputeUpcomingSchedule renumbers sequences and preserves paid offset", () => {
    const rebuilt = recomputeUpcomingSchedule({
      remainingPrincipal: 50_000_000,
      remainingTermMonths: 10,
      nextPaymentDate: "2027-01-01",
      repaymentMethod: LoanRepaymentMethod.FIXED_MONTHLY,
      rateSegments: [{ effectiveFrom: "2027-01-01", annualRatePct: 8 }],
      sequenceStart: 13,
    });
    expect(rebuilt.entries[0]?.sequence).toBe(13);
    expect(rebuilt.entries).toHaveLength(10);
  });

  it("simulateLoanPreview returns null for invalid term", () => {
    expect(
      simulateLoanPreview({
        principal: 1_000_000,
        annualInterestRate: 9,
        termValue: 0,
        termUnit: LoanTermUnit.MONTHS,
        repaymentMethod: LoanRepaymentMethod.FIXED_MONTHLY,
        firstPaymentDate: "2026-09-01",
        interestStrategy: LoanInterestStrategy.FIXED,
      }),
    ).toBeNull();
  });

  it("simulateLoanPreview exposes promo dual payment", () => {
    const preview = simulateLoanPreview({
      principal: 100_000_000,
      annualInterestRate: 0,
      termValue: 24,
      termUnit: LoanTermUnit.MONTHS,
      repaymentMethod: LoanRepaymentMethod.FIXED_MONTHLY,
      firstPaymentDate: "2026-09-01",
      interestStrategy: LoanInterestStrategy.PROMO_FIXED_TO_FLOATING,
      promoFixedRate: 6,
      promoFixedMonths: 6,
      promoFloatingRate: 10,
    });
    expect(preview).not.toBeNull();
    expect(preview!.changeAfterMonths).toBe(6);
    expect(preview!.monthlyPaymentAfterChange).toBeGreaterThan(0);
  });

  it("computes early payoff amount", () => {
    expect(computeEarlyPayoffAmount(10_000_000, 500_000)).toBe(10_500_000);
  });
});
