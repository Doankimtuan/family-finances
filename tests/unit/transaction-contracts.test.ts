import { describe, expect, it } from "vitest";
import {
  TransactionDirection,
  TransactionStatus,
  LEDGER_ACTION_ERROR_CODE,
} from "@/modules/ledger/application/ledger-constants";
import {
  isCategoryJarMapped,
  requiresJarMapping,
} from "@/modules/ledger/application/category-jar-policy";
import { createCategoryInputSchema } from "@/modules/ledger/application/commands/create-category";
import {
  resolveRefundedStatus,
  jarCapacityRestoredByRefund,
  isRefundableStatus,
} from "@/modules/ledger/application/refund-policy";
import {
  buildCorrectionChain,
  correctionChainNetImpact,
  oppositeDirection,
  signedAmount,
} from "@/modules/ledger/application/correction-policy";
import {
  countsTowardMonthlyIncome,
  sumMonthlyIncome,
  jarCapacityDelta,
  sumJarCapacity,
} from "@/modules/ledger/application/income-exclusion-policy";
import { applyTransactionDeltas } from "@/modules/ledger/application/transaction-types";
import { AccountType } from "@/modules/ledger/application/ledger-constants";

describe("category ↔ jar policy", () => {
  const jarId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  it("allows household income categories without jar mapping", () => {
    expect(
      requiresJarMapping({
        isSystem: false,
        kind: TransactionDirection.INCOME,
      }),
    ).toBe(false);
    expect(
      isCategoryJarMapped({
        isSystem: false,
        kind: TransactionDirection.INCOME,
        jarId: null,
      }),
    ).toBe(true);
    expect(
      createCategoryInputSchema.safeParse({
        name: "Salary",
        kind: TransactionDirection.INCOME,
      }).success,
    ).toBe(true);
    expect(
      createCategoryInputSchema.safeParse({
        name: "Salary",
        kind: TransactionDirection.INCOME,
        jarId: null,
      }).success,
    ).toBe(true);
  });

  it("still requires a jar for household expense categories", () => {
    expect(
      requiresJarMapping({
        isSystem: false,
        kind: TransactionDirection.EXPENSE,
      }),
    ).toBe(true);
    expect(
      isCategoryJarMapped({
        isSystem: false,
        kind: TransactionDirection.EXPENSE,
        jarId: null,
      }),
    ).toBe(false);
    expect(
      createCategoryInputSchema.safeParse({
        name: "Pet Grooming",
        kind: TransactionDirection.EXPENSE,
      }).success,
    ).toBe(false);
    expect(
      createCategoryInputSchema.safeParse({
        name: "Pet Grooming",
        kind: TransactionDirection.EXPENSE,
        jarId,
      }).success,
    ).toBe(true);
  });

  it("exposes category_unmapped ledger error code", () => {
    expect(LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED).toBe(
      "category_unmapped",
    );
  });
});

describe("ST-E01-002 refund linkage (AC-TRN-01)", () => {
  const jarId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  it("marks partial then full refund status", () => {
    expect(resolveRefundedStatus(150, 0, 50)).toBe(
      TransactionStatus.PARTIALLY_REFUNDED,
    );
    expect(resolveRefundedStatus(150, 50, 100)).toBe(
      TransactionStatus.FULLY_REFUNDED,
    );
  });

  it("restores jar capacity by refund amount without income inflation", () => {
    expect(jarCapacityRestoredByRefund(50)).toBe(50);
    expect(jarCapacityRestoredByRefund(0)).toBe(0);

    // GWT: expense 150 + refund 50 → capacity −100; monthly income unchanged
    const legs = [
      {
        type: TransactionDirection.EXPENSE,
        amount: 150,
        jarId,
        isReversal: false,
      },
      {
        type: TransactionDirection.INCOME,
        amount: 50,
        jarId,
        isReversal: true,
        reversesTransactionId: "orig",
      },
      {
        type: TransactionDirection.INCOME,
        amount: 2000,
        jarId: null,
        isReversal: false,
      },
    ];
    expect(sumJarCapacity(legs)).toBe(-100);
    expect(sumMonthlyIncome(legs)).toBe(2000);
    expect(
      countsTowardMonthlyIncome({
        type: TransactionDirection.INCOME,
        amount: 50,
        isReversal: true,
        reversesTransactionId: "orig",
      }),
    ).toBe(false);
  });

  it("only posted or partially refunded expenses are refundable", () => {
    expect(isRefundableStatus(TransactionStatus.POSTED)).toBe(true);
    expect(isRefundableStatus(TransactionStatus.PARTIALLY_REFUNDED)).toBe(true);
    expect(isRefundableStatus(TransactionStatus.FULLY_REFUNDED)).toBe(false);
    expect(isRefundableStatus(TransactionStatus.REVERSED)).toBe(false);
  });

  it("refund income still restores account cash while excluded from income", () => {
    const accounts = applyTransactionDeltas(
      [
        {
          id: "a1",
          name: "Cash",
          type: AccountType.CASH,
          balance: 0,
          isArchived: false,
        },
      ],
      [
        {
          accountId: "a1",
          type: TransactionDirection.EXPENSE,
          amount: 150,
        },
        {
          accountId: "a1",
          type: TransactionDirection.INCOME,
          amount: 50,
        },
      ],
    );
    expect(accounts[0]?.balance).toBe(-100);
    expect(
      jarCapacityDelta({
        type: TransactionDirection.INCOME,
        amount: 50,
        jarId,
      }),
    ).toBe(50);
  });
});

describe("ST-E01-003 3-way correction (AC-TRN-02)", () => {
  const originalId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  it("builds Original Reversed + reversal + correction legs", () => {
    const chain = buildCorrectionChain({
      originalId,
      originalAmount: 100,
      originalType: TransactionDirection.EXPENSE,
      correctionAmount: 10,
      correctionType: TransactionDirection.EXPENSE,
    });

    expect(chain.originalStatus).toBe(TransactionStatus.REVERSED);
    expect(chain.reversal).toMatchObject({
      type: TransactionDirection.INCOME,
      amount: 100,
      reversesTransactionId: originalId,
      status: TransactionStatus.POSTED,
    });
    expect(chain.correction).toMatchObject({
      type: TransactionDirection.EXPENSE,
      amount: 10,
      correctsTransactionId: originalId,
      status: TransactionStatus.POSTED,
    });
  });

  it("net impact of correcting 100 expense to 10 is +90", () => {
    // Original −100; reversal +100; correction −10 → net legs +90 vs voiding original
    expect(
      correctionChainNetImpact({
        originalId,
        originalAmount: 100,
        originalType: TransactionDirection.EXPENSE,
        correctionAmount: 10,
        correctionType: TransactionDirection.EXPENSE,
      }),
    ).toBe(90);

    expect(oppositeDirection(TransactionDirection.EXPENSE)).toBe(
      TransactionDirection.INCOME,
    );
    expect(signedAmount(TransactionDirection.EXPENSE, 100)).toBe(-100);
  });

  it("reversal income is excluded from monthly income totals", () => {
    const chain = buildCorrectionChain({
      originalId,
      originalAmount: 100,
      originalType: TransactionDirection.EXPENSE,
      correctionAmount: 10,
      correctionType: TransactionDirection.EXPENSE,
    });
    expect(
      countsTowardMonthlyIncome({
        type: chain.reversal.type,
        amount: chain.reversal.amount,
        isReversal: true,
        reversesTransactionId: chain.reversal.reversesTransactionId,
      }),
    ).toBe(false);
    expect(
      sumMonthlyIncome([
        {
          type: TransactionDirection.INCOME,
          amount: 500,
          isReversal: false,
        },
        {
          type: chain.reversal.type,
          amount: chain.reversal.amount,
          isReversal: true,
          reversesTransactionId: originalId,
        },
      ]),
    ).toBe(500);
  });
});

describe("BR-02 immutability error code", () => {
  it("exposes immutable ledger error code", () => {
    expect(LEDGER_ACTION_ERROR_CODE.IMMUTABLE).toBe("immutable");
  });
});
