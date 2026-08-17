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
import { archiveAccount } from "@/modules/ledger/application/commands/archive-account";
import { createAccount } from "@/modules/ledger/application/commands/create-account";
import { updateAccount } from "@/modules/ledger/application/commands/update-account";
import { correctTransaction } from "@/modules/ledger/application/commands/correct-transaction";
import {
  classifyCorrectionRpcError,
  classifyRecordTransactionRpcError,
  classifyRecordTransferRpcError,
  classifyRefundRpcError,
  LEDGER_OPERATION,
  classifyTransactionTagRpcError,
} from "@/modules/ledger/application/ledger-error";
import { recordTransaction } from "@/modules/ledger/application/commands/record-transaction";
import { recordTransfer } from "@/modules/ledger/application/commands/record-transfer";
import { refundTransaction } from "@/modules/ledger/application/commands/refund-transaction";
import { LEDGER_ACTION_ERROR_CODE } from "@/modules/ledger/application/ledger-constants";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

const ACCOUNT_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_ACCOUNT_ID = "650e8400-e29b-41d4-a716-446655440000";
const TRANSACTION_ID = "750e8400-e29b-41d4-a716-446655440000";

describe("Ledger error classification", () => {
  it("prefers structured transfer codes over legacy text", () => {
    expect(
      classifyRecordTransferRpcError({
        code: PRODUCT_ACTION_ERROR_CODE.INVALID,
        message: "database unavailable",
      }),
    ).toBe(PRODUCT_ACTION_ERROR_CODE.INVALID);
  });

  it("keeps legacy domain classifications at the Ledger boundary", () => {
    expect(
      classifyRecordTransactionRpcError({ message: "Account not found" }),
    ).toBe(PRODUCT_ACTION_ERROR_CODE.INVALID);
    expect(
      classifyRecordTransferRpcError({
        message: "Source and destination must differ",
      }),
    ).toBe(PRODUCT_ACTION_ERROR_CODE.INVALID);
    expect(
      classifyRefundRpcError({ message: "Transaction is not refundable" }),
    ).toBe(LEDGER_ACTION_ERROR_CODE.REFUND_INVALID);
    expect(classifyCorrectionRpcError({ message: "Forbidden" })).toBe(
      LEDGER_ACTION_ERROR_CODE.CORRECTION_INVALID,
    );
    expect(
      classifyTransactionTagRpcError({
        code: PRODUCT_ACTION_ERROR_CODE.INVALID,
        message: "database unavailable",
      }),
    ).toBe(PRODUCT_ACTION_ERROR_CODE.INVALID);
    expect(classifyTransactionTagRpcError({ message: "tag not found" })).toBe(
      PRODUCT_ACTION_ERROR_CODE.INVALID,
    );
  });
});

describe("Ledger unexpected error handling", () => {
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
      "create account",
      () => createAccount({ name: "Cash" }),
      LEDGER_OPERATION.CREATE_ACCOUNT,
    ],
    [
      "update account",
      () =>
        updateAccount({
          accountId: ACCOUNT_ID,
          name: "Wallet",
          type: "cash",
        }),
      LEDGER_OPERATION.UPDATE_ACCOUNT,
    ],
    [
      "archive account",
      () => archiveAccount({ accountId: ACCOUNT_ID }),
      LEDGER_OPERATION.ARCHIVE_ACCOUNT,
    ],
    [
      "record transaction",
      () =>
        recordTransaction({
          accountId: ACCOUNT_ID,
          type: "expense",
          amount: 100,
        }),
      LEDGER_OPERATION.RECORD_TRANSACTION,
    ],
    [
      "record transfer",
      () =>
        recordTransfer({
          sourceAccountId: ACCOUNT_ID,
          destinationAccountId: OTHER_ACCOUNT_ID,
          amount: 100,
        }),
      LEDGER_OPERATION.RECORD_TRANSFER,
    ],
    [
      "refund transaction",
      () =>
        refundTransaction({
          originalTransactionId: TRANSACTION_ID,
          amount: 100,
        }),
      LEDGER_OPERATION.REFUND_TRANSACTION,
    ],
    [
      "correct transaction",
      () =>
        correctTransaction({
          originalTransactionId: TRANSACTION_ID,
          amount: 100,
          type: "expense",
        }),
      LEDGER_OPERATION.CORRECT_TRANSACTION,
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

  it("logs an unknown RPC error without exposing its message", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "database unavailable" },
      }),
    } as never);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await recordTransfer({
      sourceAccountId: ACCOUNT_ID,
      destinationAccountId: OTHER_ACCOUNT_ID,
      amount: 100,
    });

    expect(result).toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: LEDGER_OPERATION.RECORD_TRANSFER,
        error: { message: "database unavailable" },
      }),
    );
    consoleError.mockRestore();
  });
});
