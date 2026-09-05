/**
 * AC contract scenarios for Sprint 1 — executable business semantics that
 * mirror RPC/SQL behavior (category jar policy, AC-TRN-01, AC-TRN-02)
 * including income exclusion and capacity restoration.
 *
 * Live DB smoke was verified against family-finances-2 after migration
 * `sprint1_immutability_income_exclusion` (update_transaction fail-closed,
 * is_reversal column + trigger). Full Playwright E2E remains optional when
 * E2E credentials are available.
 */
import { describe, expect, it } from "vitest";
import {
  TransactionDirection,
  TransactionStatus,
} from "@/modules/ledger/application/ledger-constants";
import { createCategoryInputSchema } from "@/modules/ledger/application/commands/create-category";
import {
  resolveRefundedStatus,
  jarCapacityRestoredByRefund,
} from "@/modules/ledger/application/refund-policy";
import {
  buildCorrectionChain,
  correctionChainNetImpact,
  signedAmount,
} from "@/modules/ledger/application/correction-policy";
import {
  countsTowardMonthlyIncome,
  sumMonthlyIncome,
  sumJarCapacity,
} from "@/modules/ledger/application/income-exclusion-policy";
import { applyTransactionDeltas } from "@/modules/ledger/application/transaction-types";
import { AccountType } from "@/modules/ledger/application/ledger-constants";

describe("category jar policy", () => {
  it("allows income without jarId and keeps expense jarId required", () => {
    expect(
      createCategoryInputSchema.safeParse({
        name: "Salary",
        kind: TransactionDirection.INCOME,
      }).success,
    ).toBe(true);

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
        jarId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      }).success,
    ).toBe(true);
  });
});

describe("AC-TRN-01 GWT — refund $50 of $150", () => {
  const jarId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const originalId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  it("stores linkage fields, partial status, capacity +50, income excluded", () => {
    expect(resolveRefundedStatus(150, 0, 50)).toBe(
      TransactionStatus.PARTIALLY_REFUNDED,
    );
    expect(jarCapacityRestoredByRefund(50)).toBe(50);

    const ledgerAfter = [
      {
        type: TransactionDirection.EXPENSE,
        amount: 150,
        jarId,
        reversesTransactionId: null as string | null,
        isReversal: false,
      },
      {
        type: TransactionDirection.INCOME,
        amount: 50,
        jarId,
        reversesTransactionId: originalId,
        isReversal: true,
      },
    ];

    expect(sumJarCapacity(ledgerAfter)).toBe(-100);
    expect(sumMonthlyIncome(ledgerAfter)).toBe(0);
    expect(
      countsTowardMonthlyIncome({
        type: TransactionDirection.INCOME,
        amount: 50,
        isReversal: true,
        reversesTransactionId: originalId,
      }),
    ).toBe(false);

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
        { accountId: "a1", type: TransactionDirection.EXPENSE, amount: 150 },
        { accountId: "a1", type: TransactionDirection.INCOME, amount: 50 },
      ],
    );
    // Cash position still reflects merchant refund
    expect(accounts[0]?.balance).toBe(-100);
  });
});

describe("AC-TRN-02 GWT — correct $100 expense to $10", () => {
  const originalId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  it("creates reversed + reversal + correction; permanent net +90 new legs", () => {
    const chain = buildCorrectionChain({
      originalId,
      originalAmount: 100,
      originalType: TransactionDirection.EXPENSE,
      correctionAmount: 10,
      correctionType: TransactionDirection.EXPENSE,
    });

    expect(chain.originalStatus).toBe(TransactionStatus.REVERSED);
    expect(chain.reversal.reversesTransactionId).toBe(originalId);
    expect(chain.correction.correctsTransactionId).toBe(originalId);
    expect(
      correctionChainNetImpact({
        originalId,
        originalAmount: 100,
        originalType: TransactionDirection.EXPENSE,
        correctionAmount: 10,
        correctionType: TransactionDirection.EXPENSE,
      }),
    ).toBe(90);

    // Account cash with all three permanent rows:
    // original −100 + reversal +100 + correction −10 = −10
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
        { accountId: "a1", type: TransactionDirection.EXPENSE, amount: 100 },
        {
          accountId: "a1",
          type: chain.reversal.type,
          amount: chain.reversal.amount,
        },
        {
          accountId: "a1",
          type: chain.correction.type,
          amount: chain.correction.amount,
        },
      ],
    );
    expect(accounts[0]?.balance).toBe(-10);
    expect(
      signedAmount(TransactionDirection.EXPENSE, 100) +
        signedAmount(chain.reversal.type, chain.reversal.amount) +
        signedAmount(chain.correction.type, chain.correction.amount),
    ).toBe(-10);
  });
});
