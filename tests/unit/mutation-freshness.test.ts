import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePathMock,
  recordTransactionMock,
  recordInvestmentBuyMock,
  resolveInboxItemToJarMock,
  reallocateJarCapacityMock,
  updateMonthlyReviewMetadataMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  recordTransactionMock: vi.fn(),
  recordInvestmentBuyMock: vi.fn(),
  resolveInboxItemToJarMock: vi.fn(),
  reallocateJarCapacityMock: vi.fn(),
  updateMonthlyReviewMetadataMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/modules/ledger/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/ledger/application")>();
  return { ...actual, recordTransaction: recordTransactionMock };
});

vi.mock("@/modules/investments/application", () => ({
  recordInvestmentBuy: recordInvestmentBuyMock,
}));

vi.mock("@/modules/inbox/application", () => ({
  resolveInboxItemToJar: resolveInboxItemToJarMock,
}));

vi.mock("@/modules/plan/application", () => ({
  MonthlyReviewStatus: {
    VIEWED: "viewed",
    MARKED_REVIEWED: "marked_reviewed",
  },
  monthlyReviewMetadataInputSchema: {
    safeParse: (input: unknown) => {
      if (
        typeof input !== "object" ||
        input === null ||
        !("periodMonth" in input) ||
        typeof input.periodMonth !== "string"
      ) {
        return { success: false };
      }
      return /^\d{4}-\d{2}-01$/.test(input.periodMonth)
        ? { success: true, data: input }
        : { success: false };
    },
  },
  reallocateJarCapacity: reallocateJarCapacityMock,
  updateMonthlyReviewMetadata: updateMonthlyReviewMetadataMock,
}));

import { APP_ROUTE } from "@/modules/tenancy/application/app-path";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { TransactionDirection } from "@/modules/ledger/application/ledger-constants";
import { INVESTMENT_ERROR_CODE } from "@/modules/investments/application/investment-constants";
import { PLAN_ACTION_ERROR_CODE } from "@/modules/plan/application/plan-constants";
import { recordTransactionAction } from "@/app/[locale]/(product)/money/transactions/actions";
import { recordInvestmentBuyAction } from "@/app/[locale]/(product)/money/investments/investment-actions";
import { resolveInboxAction } from "@/app/[locale]/(product)/inbox/actions";
import { reallocateJarCapacityAction } from "@/app/[locale]/(product)/plan/jars/actions";
import {
  markMonthlyReviewReviewed,
  markMonthlyReviewViewed,
} from "@/app/[locale]/(product)/plan/ritual/actions-review";
import { MonthlyReviewStatus } from "@/modules/plan/application";

const transactionInput = {
  accountId: "00000000-0000-4000-8000-000000000001",
  type: TransactionDirection.EXPENSE,
  amount: 100,
};

describe("server-action mutation freshness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates the ledger dependency set after a successful transaction", async () => {
    recordTransactionMock.mockResolvedValue({
      ok: true,
      transactionId: "transaction-1",
      inboxItemId: null,
    });

    await expect(
      recordTransactionAction(transactionInput),
    ).resolves.toMatchObject({ status: "success" });

    expect(revalidatePathMock).toHaveBeenCalledWith(APP_ROUTE.HOME, "page");
    expect(revalidatePathMock).toHaveBeenCalledWith(APP_ROUTE.MONEY, "page");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      APP_ROUTE.MONEY_ACCOUNTS,
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      APP_ROUTE.MONEY_ACCOUNT_DETAIL,
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(APP_ROUTE.PLAN, "page");
    expect(revalidatePathMock).toHaveBeenCalledWith(APP_ROUTE.PLAN, "page");
    expect(revalidatePathMock).toHaveBeenCalledWith(APP_ROUTE.INBOX, "page");
  });

  it("does not revalidate after a failed transaction", async () => {
    recordTransactionMock.mockResolvedValue({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });

    await expect(
      recordTransactionAction(transactionInput),
    ).resolves.toMatchObject({ status: "error" });

    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rejects invalid boundary input before invoking the transaction command", async () => {
    await expect(
      recordTransactionAction({ amount: "100" }),
    ).resolves.toMatchObject({ status: "error" });

    expect(recordTransactionMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("revalidates planning and inbox views when an inbox item resolves to a jar", async () => {
    resolveInboxItemToJarMock.mockResolvedValue({
      ok: true,
      status: "resolved",
    });

    await expect(
      resolveInboxAction({ inboxItemId: "inbox-1", jarId: "jar-1" }),
    ).resolves.toEqual({ status: "success" });

    expect(revalidatePathMock).toHaveBeenCalledWith(APP_ROUTE.INBOX, "page");
    expect(revalidatePathMock).toHaveBeenCalledWith(APP_ROUTE.PLAN, "page");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      APP_ROUTE.PLAN_JARS,
      "page",
    );
  });

  it("preserves investment command results and revalidates after success", async () => {
    recordInvestmentBuyMock.mockResolvedValue({
      ok: true,
      receipt: { operationId: "operation-1" },
    });

    await expect(
      recordInvestmentBuyAction({ holdingId: "holding-1" }),
    ).resolves.toMatchObject({ ok: true });

    expect(revalidatePathMock).toHaveBeenCalledWith(
      APP_ROUTE.MONEY_INVESTMENTS,
      "page",
    );
  });

  it("does not revalidate after an investment command failure", async () => {
    recordInvestmentBuyMock.mockResolvedValue({
      ok: false,
      code: INVESTMENT_ERROR_CODE.INVALID,
    });

    await expect(recordInvestmentBuyAction({})).resolves.toEqual({
      ok: false,
      code: INVESTMENT_ERROR_CODE.INVALID,
    });

    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("revalidates planning and Inbox views after a successful capacity move", async () => {
    reallocateJarCapacityMock.mockResolvedValue({
      ok: true,
      planMovementId: "movement-1",
      sourceJarId: "source-1",
      targetJarId: "target-1",
      amount: 100,
      ledgerImpact: 0,
      ledgerTransactionsCreated: 0,
      inboxItemId: null,
      isEmergency: false,
    });

    await expect(
      reallocateJarCapacityAction({
        sourceJarId: "00000000-0000-4000-8000-000000000001",
        targetJarId: "00000000-0000-4000-8000-000000000002",
        amount: 100,
        isEmergency: false,
      }),
    ).resolves.toMatchObject({ status: "success" });

    expect(revalidatePathMock).toHaveBeenCalledWith(
      APP_ROUTE.PLAN_JARS,
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(APP_ROUTE.PLAN, "page");
    expect(revalidatePathMock).toHaveBeenCalledWith(APP_ROUTE.INBOX, "page");
  });

  it("does not revalidate after a failed capacity move", async () => {
    reallocateJarCapacityMock.mockResolvedValue({
      ok: false,
      code: PLAN_ACTION_ERROR_CODE.CAPACITY_BLOCKED,
    });

    await reallocateJarCapacityAction({
      sourceJarId: "00000000-0000-4000-8000-000000000001",
      targetJarId: "00000000-0000-4000-8000-000000000002",
      amount: 100,
      isEmergency: false,
    });

    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("keeps monthly review persistence in the application command", async () => {
    updateMonthlyReviewMetadataMock.mockResolvedValue({
      ok: true,
      state: MonthlyReviewStatus.VIEWED,
    });

    await markMonthlyReviewViewed("2026-08-01");

    expect(updateMonthlyReviewMetadataMock).toHaveBeenCalledWith({
      periodMonth: "2026-08-01",
      state: MonthlyReviewStatus.VIEWED,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(APP_ROUTE.PLAN, "page");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      APP_ROUTE.PLAN_RITUAL,
      "page",
    );
  });

  it("does not revalidate when monthly review persistence fails", async () => {
    updateMonthlyReviewMetadataMock.mockResolvedValue({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });

    await markMonthlyReviewReviewed("2026-08-01", { cashFlow: {} });

    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid monthly review period before persistence", async () => {
    await markMonthlyReviewViewed("2026-08-15");

    expect(updateMonthlyReviewMetadataMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
