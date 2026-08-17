import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  INVESTMENT_ERROR_CODE,
  INVESTMENT_RPC,
  InvestmentFeeSource,
} from "@/modules/investments/application/investment-constants";
import {
  classifyInvestmentRpcError,
  classifyLegacyInvestmentRpcError,
  recordInvestmentBuy,
} from "@/modules/investments/application/commands/investment-commands";
import {
  assetConversionInputSchema,
  investmentIncomeInputSchema,
  investmentSellInputSchema,
  investmentValuationInputSchema,
} from "@/modules/investments/application/commands/investment-commands.schema";
import { applyTransactionDeltas } from "@/modules/ledger/application/transaction-types";
import { TransactionLedgerType } from "@/modules/ledger/application/ledger-constants";

const holdingId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const accountId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

describe("Investments command boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps operation-specific required fields at the schema boundary", () => {
    expect(
      investmentSellInputSchema.safeParse({
        holdingId,
        cashAccountId: accountId,
        soldQuantity: "0",
        executedValueVnd: 100_000,
        effectiveDate: "2026-08-10",
        idempotencyKey: "investment:test:sell",
      }).success,
    ).toBe(false);
    expect(
      assetConversionInputSchema.safeParse({
        sourceHoldingId: holdingId,
        destinationHoldingId: holdingId,
        sourceQuantity: "1",
        destinationQuantity: "",
        effectiveDate: "2026-08-10",
        idempotencyKey: "investment:test:conversion",
      }).success,
    ).toBe(false);
    expect(
      investmentIncomeInputSchema.safeParse({
        holdingId,
        cashAccountId: accountId,
        amountVnd: 0,
        incomeKind: "dividend",
        effectiveDate: "2026-08-10",
        idempotencyKey: "investment:test:income",
      }).success,
    ).toBe(false);
    expect(
      investmentValuationInputSchema.safeParse({
        holdingId,
        valueVnd: -1,
        valuationDate: "2026-08-10",
        source: "manual",
        idempotencyKey: "investment:test:valuation",
      }).success,
    ).toBe(false);
  });

  it("gates household mutations before RPC", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: "no_membership",
    } as never);
    const result = await recordInvestmentBuy({
      holdingId,
      cashAccountId: accountId,
      boughtQuantity: "0.000000000000000001",
      executedValueVnd: 100_000,
      effectiveDate: "2026-08-10",
      idempotencyKey: "investment:test:gate",
    });
    expect(result).toEqual({
      ok: false,
      code: INVESTMENT_ERROR_CODE.FORBIDDEN,
    });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("maps exact quantities, fee payload, and idempotent receipt", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
    } as never);
    const rpc = vi.fn().mockResolvedValue({
      data: {
        operationId: "op-1",
        holdingId,
        destinationHoldingId: holdingId,
        transactionIds: ["tx-1"],
        beforeQuantity: "1.1",
        afterQuantity: "1.3",
        beforeBasis: 100_000,
        afterBasis: 301_000,
        cashDelta: -201_000,
        realizedResult: null,
        feeEffects: [
          {
            source: InvestmentFeeSource.CASH,
            feeValueVnd: 1_000,
            transactionId: "tx-1",
          },
        ],
        correlationId: "correlation-1",
        idempotentReplay: true,
      },
      error: null,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc } as never);
    const result = await recordInvestmentBuy({
      holdingId,
      cashAccountId: accountId,
      boughtQuantity: "0.2",
      executedValueVnd: 200_000,
      effectiveDate: "2026-08-10",
      fees: [
        {
          source: InvestmentFeeSource.CASH,
          amountVnd: 1_000,
          feeValueVnd: 1_000,
          cashAccountId: accountId,
        },
      ],
      idempotencyKey: "investment:test:buy",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.receipt.afterQuantity).toBe("1.3");
      expect(result.receipt.cashDelta).toBe(-201_000);
      expect(result.receipt.idempotentReplay).toBe(true);
    }
    expect(rpc).toHaveBeenCalledWith(
      INVESTMENT_RPC.BUY,
      expect.objectContaining({
        p_bought_quantity: "0.2",
        p_fees: [expect.objectContaining({ feeValueVnd: 1_000 })],
      }),
    );
  });

  it("preserves legacy domain mappings at the RPC boundary", () => {
    expect(
      classifyLegacyInvestmentRpcError({
        message: "Insufficient quantity for this holding",
      }),
    ).toBe(INVESTMENT_ERROR_CODE.INSUFFICIENT_QUANTITY);
    expect(
      classifyLegacyInvestmentRpcError({
        message: "Investment holding not found",
      }),
    ).toBe(INVESTMENT_ERROR_CODE.NOT_FOUND);
  });

  it("prefers structured RPC codes over conflicting legacy text", () => {
    expect(
      classifyInvestmentRpcError({
        details: INVESTMENT_ERROR_CODE.NOT_FOUND,
        message: "Insufficient quantity for this holding",
      }),
    ).toBe(INVESTMENT_ERROR_CODE.NOT_FOUND);
  });

  it("preserves expected domain failures through the command Result", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-1",
      householdId: "household-1",
    });
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Insufficient quantity" },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc } as never);

    await expect(
      recordInvestmentBuy({
        holdingId,
        cashAccountId: accountId,
        boughtQuantity: "0.2",
        executedValueVnd: 200_000,
        effectiveDate: "2026-08-10",
        idempotencyKey: "investment:test:domain-failure",
      }),
    ).resolves.toEqual({
      ok: false,
      code: INVESTMENT_ERROR_CODE.INSUFFICIENT_QUANTITY,
    });
  });

  it("logs unexpected RPC failures and returns a safe code", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-1",
      householdId: "household-1",
    });
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "internal investment database detail" },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc } as never);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await recordInvestmentBuy({
      holdingId,
      cashAccountId: accountId,
      boughtQuantity: "0.2",
      executedValueVnd: 200_000,
      effectiveDate: "2026-08-10",
      idempotencyKey: "investment:test:rpc-failure",
    });

    expect(result).toEqual({
      ok: false,
      code: INVESTMENT_ERROR_CODE.UNKNOWN,
    });
    expect(JSON.stringify(result)).not.toContain(
      "internal investment database detail",
    );
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: INVESTMENT_RPC.BUY,
        context: expect.objectContaining({
          householdId: "household-1",
          holdingId,
          cashAccountId: accountId,
        }),
      }),
    );
    consoleError.mockRestore();
  });

  it("logs unexpected thrown failures and returns a safe code", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-1",
      householdId: "household-1",
    });
    const thrown = new Error("investment service unavailable");
    vi.mocked(createSupabaseServerClient).mockRejectedValueOnce(thrown);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await recordInvestmentBuy({
      holdingId,
      cashAccountId: accountId,
      boughtQuantity: "0.2",
      executedValueVnd: 200_000,
      effectiveDate: "2026-08-10",
      idempotencyKey: "investment:test:thrown-failure",
    });

    expect(result).toEqual({
      ok: false,
      code: INVESTMENT_ERROR_CODE.UNKNOWN,
    });
    expect(JSON.stringify(result)).not.toContain(
      "investment service unavailable",
    );
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({ error: thrown }),
    );
    consoleError.mockRestore();
  });

  it("applies all investment ledger cash classifications", () => {
    const [account] = applyTransactionDeltas(
      [
        {
          id: accountId,
          name: "Cash",
          type: "cash",
          balance: 1_000_000,
          isArchived: false,
        },
      ],
      [
        {
          accountId,
          type: TransactionLedgerType.INVESTMENT_BUY,
          amount: 200_000,
        },
        {
          accountId,
          type: TransactionLedgerType.INVESTMENT_FEE,
          amount: 5_000,
        },
        {
          accountId,
          type: TransactionLedgerType.INVESTMENT_SELL_PROCEEDS,
          amount: 50_000,
        },
        {
          accountId,
          type: TransactionLedgerType.INVESTMENT_INCOME,
          amount: 10_000,
        },
      ],
    );
    expect(account.balance).toBe(855_000);
  });
});
