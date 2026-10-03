import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSaving } from "@/modules/savings/application/commands/create-saving";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { resolvePackageSnapshot } from "@/modules/savings/application/savings-provider-registry";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { MONEY_ACTION_DENIED_REASON } from "@/modules/tenancy/application/tenancy-constants";
import {
  SavingsCreateMode,
  SettlementRule,
} from "@/modules/savings/application/savings-constants";

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));
vi.mock("@/modules/savings/application/savings-provider-registry", () => ({
  resolvePackageSnapshot: vi.fn(),
}));
const payload = {
  creationMode: SavingsCreateMode.LIVE_DEPOSIT,
  fundingAccountId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  settlementAccountId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  providerId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  packageId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  productName: "Saving",
  principal: 1_000_000,
  settlementRule: SettlementRule.WITHDRAW_EVERYTHING,
};
const householdId = "household";
let query: {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
};
let rpc: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
    ok: true,
    householdId,
    membershipId: "mine",
    userId: "user",
  });
  vi.mocked(resolvePackageSnapshot).mockResolvedValue({
    providerId: payload.providerId,
    productName: "Provider",
    packageSnapshot: {
      packageId: payload.packageId,
      packageName: "90 days",
      durationDays: 90,
      annualInterestRate: 6,
      minAmount: null,
      maxAmount: null,
      settlementRules: [SettlementRule.WITHDRAW_EVERYTHING],
      penaltyRules: [],
      renewableAvailable: true,
    },
  });
  let lookup = 0;
  query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockImplementation(async () => ({
      data: {
        id:
          ++lookup % 2 ? payload.fundingAccountId : payload.settlementAccountId,
        type: "cash",
      },
      error: null,
    })),
  };
  rpc = vi.fn().mockResolvedValue({
    data: { ok: true, savingId: "saving", cycleId: "cycle" },
    error: null,
  });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    from: vi.fn().mockReturnValue(query),
    rpc,
  } as never);
});

describe("Create submission remains authoritative after streaming", () => {
  it("reads current household-scoped accounts on every submit and never forwards a displayed balance", async () => {
    expect(
      await createSaving({ ...payload, balance: 9_000_000 } as typeof payload),
    ).toMatchObject({ ok: true });
    expect(
      await createSaving({ ...payload, balance: 0 } as typeof payload),
    ).toMatchObject({ ok: true });
    expect(query.maybeSingle).toHaveBeenCalledTimes(4);
    expect(query.eq).toHaveBeenCalledWith("household_id", householdId);
    expect(query.eq).toHaveBeenCalledWith("is_archived", false);
    for (const [, input] of rpc.mock.calls) {
      expect(input).not.toHaveProperty("balance");
      expect(input).not.toHaveProperty("p_balance");
      expect(input).toHaveProperty("p_principal", payload.principal);
    }
  });
  it("rejects an account absent from the caller's household before mutation", async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await createSaving(payload)).toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
    expect(query.eq).toHaveBeenCalledWith("household_id", householdId);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("preserves database rejection if account mutation permission changes while open", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: PRODUCT_ACTION_ERROR_CODE.INVALID },
    });
    expect(await createSaving(payload)).toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it.each([null, { providerId: "another-provider" }])(
    "rejects a missing or mismatched current package",
    async (resolved) => {
      vi.mocked(resolvePackageSnapshot).mockResolvedValue(resolved as never);
      expect(await createSaving(payload)).toEqual({
        ok: false,
        code: PRODUCT_ACTION_ERROR_CODE.INVALID,
      });
      expect(rpc).not.toHaveBeenCalled();
    },
  );
  it("does not resolve financial data or mutate for an unauthenticated caller", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: MONEY_ACTION_DENIED_REASON.UNAUTHENTICATED,
    });
    expect(await createSaving(payload)).toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED,
    });
    expect(resolvePackageSnapshot).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
});
