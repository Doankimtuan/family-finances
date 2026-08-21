import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(() => ({
    url: "https://example.supabase.co",
    key: "key",
    isConfigured: true,
  })),
}));

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  classifyCardRpcError,
  classifyDebtRpcError,
  classifyInstallmentRpcError,
  classifyLiabilityRpcError,
  classifyLoanRpcError,
  LEDGER_OPERATION,
} from "@/modules/ledger/application/ledger-error";
import {
  createLoan,
  recordLoanPayment,
} from "@/modules/ledger/application/commands/loans";
import { settleCard } from "@/modules/ledger/application/commands/settle-card";
import { registerCreditCardInstallment } from "@/modules/ledger/application/commands/register-credit-card-installment";
import { stopCreditCardInstallmentTracking } from "@/modules/ledger/application/commands/stop-credit-card-installment-tracking";
import {
  createDebt,
  recordDebtPayment,
} from "@/modules/ledger/application/commands/debt-commands";
import {
  createLiability,
  recordLiabilityPayment,
} from "@/modules/ledger/application/commands/liabilities";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

const LOAN_ID = "550e8400-e29b-41d4-a716-446655440000";
const CARD_ID = "650e8400-e29b-41d4-a716-446655440000";
const ACCOUNT_ID = "750e8400-e29b-41d4-a716-446655440000";
const TRANSACTION_ID = "850e8400-e29b-41d4-a716-446655440000";
const INSTALLMENT_ID = "950e8400-e29b-41d4-a716-446655440000";
const DEBT_ID = "a50e8400-e29b-41d4-a716-446655440000";

describe("Ledger money-product RPC classification", () => {
  it("prefers structured product codes over legacy messages", () => {
    const error = {
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
      message: "database unavailable",
    };

    expect(classifyLoanRpcError(error)).toBe(PRODUCT_ACTION_ERROR_CODE.INVALID);
    expect(classifyCardRpcError(error)).toBe(PRODUCT_ACTION_ERROR_CODE.INVALID);
    expect(classifyDebtRpcError(error)).toBe(PRODUCT_ACTION_ERROR_CODE.INVALID);
    expect(classifyLiabilityRpcError(error)).toBe(
      PRODUCT_ACTION_ERROR_CODE.INVALID,
    );
    expect(classifyInstallmentRpcError(error)).toBe(
      PRODUCT_ACTION_ERROR_CODE.INVALID,
    );
  });

  it("keeps legacy lifecycle failures as expected invalid outcomes", () => {
    expect(classifyLoanRpcError({ message: "Loan already completed" })).toBe(
      PRODUCT_ACTION_ERROR_CODE.INVALID,
    );
    expect(
      classifyCardRpcError({ message: "Amount exceeds remaining due" }),
    ).toBe(PRODUCT_ACTION_ERROR_CODE.INVALID);
    expect(
      classifyDebtRpcError({ message: "Debt cannot receive a payment" }),
    ).toBe(PRODUCT_ACTION_ERROR_CODE.INVALID);
    expect(classifyLiabilityRpcError({ message: "Liability archived" })).toBe(
      PRODUCT_ACTION_ERROR_CODE.INVALID,
    );
  });
});

describe("Ledger money-product unexpected failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-1",
      householdId: "household-1",
    });
  });

  it.each([
    [
      "loan creation",
      () =>
        createLoan({
          idempotencyKey: "550e8400-e29b-41d4-a716-446655440001",
          name: "Home loan",
          principal: 1_000_000,
          termValue: 12,
          termUnit: "months",
          startDate: "2026-08-01",
        }),
      LEDGER_OPERATION.CREATE_LOAN,
    ],
    [
      "loan payment",
      () =>
        recordLoanPayment({
          loanId: LOAN_ID,
          accountId: ACCOUNT_ID,
          idempotencyKey: "550e8400-e29b-41d4-a716-446655440002",
        }),
      LEDGER_OPERATION.RECORD_LOAN_PAYMENT,
    ],
    [
      "card settlement",
      () =>
        settleCard({
          cardAccountId: CARD_ID,
          sourceAccountId: ACCOUNT_ID,
          amount: 100_000,
        }),
      LEDGER_OPERATION.SETTLE_CARD,
    ],
    [
      "installment registration",
      () =>
        registerCreditCardInstallment({
          cardAccountId: CARD_ID,
          sourceTransactionId: TRANSACTION_ID,
          origin: "post_purchase",
          termCount: 6,
          firstExpectedDate: "2026-09-01",
          program: "zero_interest_zero_fee",
          calculationSource: "derived",
          conversionFeeType: "none",
          feeTiming: "first_expected_period",
          note: null,
        }),
      LEDGER_OPERATION.REGISTER_CREDIT_CARD_INSTALLMENT,
    ],
    [
      "installment stop",
      () =>
        stopCreditCardInstallmentTracking({ installmentId: INSTALLMENT_ID }),
      LEDGER_OPERATION.STOP_CREDIT_CARD_INSTALLMENT,
    ],
    [
      "debt creation",
      () =>
        createDebt({
          name: "Personal debt",
          counterparty: "Friend",
          direction: "borrowed",
          creationMode: "existing_balance",
          principalAmount: 100_000,
          startDate: "2026-08-01",
          idempotencyKey: "debt-test-key",
        }),
      LEDGER_OPERATION.CREATE_DEBT,
    ],
    [
      "debt payment",
      () =>
        recordDebtPayment({
          debtId: DEBT_ID,
          accountId: ACCOUNT_ID,
          amount: 50_000,
          effectiveDate: "2026-08-01",
          idempotencyKey: "payment-test-key",
        }),
      LEDGER_OPERATION.RECORD_DEBT_PAYMENT,
    ],
    [
      "liability creation",
      () => createLiability({ name: "Liability", principalAmount: 100_000 }),
      LEDGER_OPERATION.CREATE_LIABILITY,
    ],
    [
      "liability payment",
      () =>
        recordLiabilityPayment({
          liabilityId: DEBT_ID,
          amount: 50_000,
        }),
      LEDGER_OPERATION.RECORD_LIABILITY_PAYMENT,
    ],
  ])(
    "logs and safely maps an unexpected %s failure",
    async (_name, run, operation) => {
      const thrown = new Error("database unavailable");
      vi.mocked(createSupabaseServerClient).mockRejectedValueOnce(thrown);
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const result = await run();

      expect(result).toEqual({
        ok: false,
        code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
      });
      expect(JSON.stringify(result)).not.toContain("database unavailable");
      expect(consoleError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation,
          error: thrown,
          context: expect.objectContaining({ householdId: "household-1" }),
        }),
      );
      consoleError.mockRestore();
    },
  );
});

describe("Ledger money-product success contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-1",
      householdId: "household-1",
    });
  });

  it("keeps the card settlement receipt fields", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: {
          ok: true,
          transactionId: TRANSACTION_ID,
          paymentId: "payment-1",
          sourceDelta: -100_000,
          appliedAmount: 100_000,
          remainingDue: 0,
          idempotentReplay: false,
        },
        error: null,
      }),
    } as never);

    await expect(
      settleCard({
        cardAccountId: CARD_ID,
        sourceAccountId: ACCOUNT_ID,
        amount: 100_000,
      }),
    ).resolves.toEqual({
      ok: true,
      transactionId: TRANSACTION_ID,
      paymentId: "payment-1",
      sourceDelta: -100_000,
      appliedAmount: 100_000,
      remainingDue: 0,
      idempotentReplay: false,
    });
  });

  it("preserves an idempotent card-settlement replay", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: {
          ok: true,
          transactionId: TRANSACTION_ID,
          paymentId: "payment-1",
          sourceDelta: 0,
          appliedAmount: 100_000,
          remainingDue: 0,
          idempotentReplay: true,
        },
        error: null,
      }),
    } as never);

    await expect(
      settleCard({
        cardAccountId: CARD_ID,
        sourceAccountId: ACCOUNT_ID,
        amount: 100_000,
        idempotencyKey: "card-pay:replay",
      }),
    ).resolves.toEqual({
      ok: true,
      transactionId: TRANSACTION_ID,
      paymentId: "payment-1",
      sourceDelta: 0,
      appliedAmount: 100_000,
      remainingDue: 0,
      idempotentReplay: true,
    });
  });

  it("maps an unexpected RPC failure without exposing its message", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "database unavailable" },
      }),
    } as never);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(
      settleCard({
        cardAccountId: CARD_ID,
        sourceAccountId: ACCOUNT_ID,
        amount: 100_000,
      }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({ operation: LEDGER_OPERATION.SETTLE_CARD }),
    );
    consoleError.mockRestore();
  });

  it("preserves an expected legacy domain failure code", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Amount exceeds remaining due" },
      }),
    } as never);

    await expect(
      settleCard({
        cardAccountId: CARD_ID,
        sourceAccountId: ACCOUNT_ID,
        amount: 100_000,
      }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
  });
});
