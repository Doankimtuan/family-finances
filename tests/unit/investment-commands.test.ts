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
  INVESTMENT_INPUT_CURRENCY_RPC,
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
  initialPurchaseInputSchema,
  openingPositionInputSchema,
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
        unitPriceVnd: 100_000,
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
        totalValueVnd: -1,
        valuationDate: "2026-08-10",
        source: "manual",
        idempotencyKey: "investment:test:valuation",
      }).success,
    ).toBe(false);
  });

  it("accepts the Crypto input contract for every operation", () => {
    const common = {
      inputCurrency: "USDT" as const,
      inputRateToVnd: 25_000,
      inputRateSource: "manual" as const,
    };
    expect(
      openingPositionInputSchema.safeParse({
        assetName: "Bitcoin",
        assetClass: "crypto",
        quantity: "0.1",
        asOfDate: "2026-08-10",
        inputRemainingTotalCostBasis: 0.6795,
        inputCurrentValuation: 0.2181,
        ...common,
        idempotencyKey: "investment:test:opening-usdt",
      }).success,
    ).toBe(true);
    expect(
      initialPurchaseInputSchema.safeParse({
        assetName: "Bitcoin",
        assetClass: "crypto",
        quantity: "0.1",
        inputUnitPrice: 50_000,
        inputTotalValue: 5_000,
        ...common,
        cashAccountId: accountId,
        asOfDate: "2026-08-10",
        idempotencyKey: "investment:test:purchase-usdt",
      }).success,
    ).toBe(true);
    expect(
      investmentSellInputSchema.safeParse({
        holdingId,
        cashAccountId: accountId,
        soldQuantity: "0.1",
        inputUnitPrice: 55_000,
        ...common,
        effectiveDate: "2026-08-10",
        idempotencyKey: "investment:test:sell-usdt",
      }).success,
    ).toBe(true);
    expect(
      assetConversionInputSchema.safeParse({
        sourceHoldingId: holdingId,
        destinationHoldingId: accountId,
        sourceQuantity: "1",
        destinationQuantity: "1",
        inputExecutedValue: 100,
        inputQuotedValue: 101,
        ...common,
        effectiveDate: "2026-08-10",
        idempotencyKey: "investment:test:conversion-usdt",
      }).success,
    ).toBe(true);
    expect(
      investmentIncomeInputSchema.safeParse({
        holdingId,
        cashAccountId: accountId,
        amountVnd: 2_500_000,
        inputAmount: 100,
        ...common,
        incomeKind: "dividend",
        effectiveDate: "2026-08-10",
        idempotencyKey: "investment:test:income-usdt",
      }).success,
    ).toBe(true);
    expect(
      investmentValuationInputSchema.safeParse({
        holdingId,
        inputUnitPrice: 55_000,
        ...common,
        valuationDate: "2026-08-10",
        source: "manual",
        idempotencyKey: "investment:test:valuation-usdt",
      }).success,
    ).toBe(true);
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
      unitPriceVnd: 100_000,
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
      unitPriceVnd: 1_000_000,
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

  it("routes Crypto input values through the server conversion RPC", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      householdId: "household-1",
    } as never);
    const rpc = vi.fn().mockResolvedValue({
      data: {
        operationId: "op-crypto-1",
        holdingId,
        correlationId: "correlation-crypto-1",
      },
      error: null,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc } as never);
    const result = await recordInvestmentBuy({
      holdingId,
      cashAccountId: accountId,
      boughtQuantity: "0.1",
      inputCurrency: "USDT",
      inputUnitPrice: 1_000,
      inputQuotedValue: 100,
      inputRateToVnd: 25_000,
      inputRateSource: "manual",
      effectiveDate: "2026-08-10",
      idempotencyKey: "investment:test:buy-usdt",
    });
    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith(
      INVESTMENT_INPUT_CURRENCY_RPC,
      expect.objectContaining({
        p_operation_type: "buy",
        p_payload: expect.objectContaining({
          inputCurrency: "USDT",
          inputUnitPrice: 1_000,
          inputRateSource: "manual",
        }),
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
        unitPriceVnd: 1_000_000,
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
      unitPriceVnd: 1_000_000,
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
      unitPriceVnd: 1_000_000,
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
