import { describe, expect, it } from "vitest";
import {
  applyBillingItemConversion,
  applyFifoSettlement,
  canConvertBillingItemOnMonth,
  computeAvailableCredit,
  computeOutstanding,
  resolveBillingDueDate,
  resolveBillingMonthKey,
  utilizationPercent,
  wouldExceedCreditLimit,
} from "@/modules/ledger/application/credit-card-billing";
import {
  CardBillingItemType,
  CardBillingMonthStatus,
} from "@/modules/ledger/application/ledger-constants";

describe("resolveBillingMonthKey", () => {
  it("keeps month when day is on or before statement day", () => {
    expect(resolveBillingMonthKey("2026-08-20", 25)).toBe("2026-08-01");
  });

  it("rolls to next month after statement day", () => {
    expect(resolveBillingMonthKey("2026-08-26", 25)).toBe("2026-09-01");
  });

  it("rolls year on December", () => {
    expect(resolveBillingMonthKey("2026-12-30", 25)).toBe("2027-01-01");
  });
});

describe("resolveBillingDueDate", () => {
  it("places due in following month when due_day <= statement_day", () => {
    expect(resolveBillingDueDate("2026-08-01", 25, 15)).toBe("2026-09-15");
  });

  it("keeps due in billing month when due_day > statement_day", () => {
    expect(resolveBillingDueDate("2026-08-01", 15, 25)).toBe("2026-08-25");
  });
});

describe("credit limit helpers", () => {
  it("computes outstanding excluding settled", () => {
    expect(
      computeOutstanding([
        {
          statementAmount: 100,
          paidAmount: 40,
          status: CardBillingMonthStatus.PARTIAL,
        },
        {
          statementAmount: 50,
          paidAmount: 50,
          status: CardBillingMonthStatus.SETTLED,
        },
      ]),
    ).toBe(60);
  });

  it("computes available credit", () => {
    expect(computeAvailableCredit(1_000_000, 250_000)).toBe(750_000);
  });

  it("blocks over-limit expenses", () => {
    expect(wouldExceedCreditLimit(100, 80, 30)).toBe(true);
    expect(wouldExceedCreditLimit(100, 80, 20)).toBe(false);
  });

  it("reports truthful utilization boundaries", () => {
    expect(utilizationPercent(100, -25)).toBe(0);
    expect(utilizationPercent(100, 0)).toBe(0);
    expect(utilizationPercent(100, 50)).toBe(50);
    expect(utilizationPercent(100, 100)).toBe(100);
    expect(utilizationPercent(100, 125)).toBe(125);
    expect(utilizationPercent(0, 25)).toBe(0);
  });
});

describe("applyFifoSettlement", () => {
  it("pays oldest months first", () => {
    const result = applyFifoSettlement(
      [
        {
          id: "m1",
          statementAmount: 100,
          paidAmount: 0,
          status: CardBillingMonthStatus.OPEN,
        },
        {
          id: "m2",
          statementAmount: 50,
          paidAmount: 0,
          status: CardBillingMonthStatus.OPEN,
        },
      ],
      120,
    );
    expect(result.months[0]?.status).toBe(CardBillingMonthStatus.SETTLED);
    expect(result.months[0]?.paidAmount).toBe(100);
    expect(result.months[1]?.status).toBe(CardBillingMonthStatus.PARTIAL);
    expect(result.months[1]?.paidAmount).toBe(20);
    expect(result.remainingPayment).toBe(0);
  });

  it("leaves remaining debt after partial payment on a 3M statement", () => {
    const result = applyFifoSettlement(
      [
        {
          id: "m1",
          statementAmount: 3_000_000,
          paidAmount: 0,
          status: CardBillingMonthStatus.OPEN,
        },
      ],
      1_500_000,
    );
    expect(result.months[0]?.status).toBe(CardBillingMonthStatus.PARTIAL);
    expect(result.months[0]?.paidAmount).toBe(1_500_000);
    expect(
      computeOutstanding([
        {
          statementAmount: result.months[0]!.statementAmount,
          paidAmount: result.months[0]!.paidAmount,
          status: result.months[0]!.status,
        },
      ]),
    ).toBe(1_500_000);
    expect(result.remainingPayment).toBe(0);
  });
});

describe("convert after partial payment", () => {
  it("blocks convert when the month already has paid_amount", () => {
    expect(
      canConvertBillingItemOnMonth({
        monthPaidAmount: 1_500_000,
        monthStatus: CardBillingMonthStatus.PARTIAL,
        isPaid: false,
        isConvertedToInstallment: false,
        itemType: CardBillingItemType.STANDARD,
        itemAmount: 3_000_000,
      }),
    ).toBe(false);
  });

  it("allows convert on an unpaid open month", () => {
    expect(
      canConvertBillingItemOnMonth({
        monthPaidAmount: 0,
        monthStatus: CardBillingMonthStatus.OPEN,
        isPaid: false,
        isConvertedToInstallment: false,
        itemType: CardBillingItemType.STANDARD,
        itemAmount: 3_000_000,
      }),
    ).toBe(true);
  });

  it("clamps paid_amount when converting so outstanding cannot go negative-settled", () => {
    const next = applyBillingItemConversion({
      statementAmount: 3_000_000,
      paidAmount: 1_500_000,
      itemAmount: 3_000_000,
    });
    expect(next.statementAmount).toBe(0);
    expect(next.paidAmount).toBe(0);
    expect(next.status).toBe(CardBillingMonthStatus.SETTLED);
    expect(
      computeOutstanding([
        {
          statementAmount: next.statementAmount,
          paidAmount: next.paidAmount,
          status: next.status,
        },
      ]),
    ).toBe(0);
  });
});
