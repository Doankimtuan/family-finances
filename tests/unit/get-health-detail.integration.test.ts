import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

vi.mock("@/modules/ledger/application", () => ({
  getRealPosition: vi.fn(),
  listRecentTransactions: vi.fn(),
}));

vi.mock("@/modules/plan/application", () => ({
  getPlanPulse: vi.fn(),
}));

vi.mock("@/modules/inbox/application", () => ({
  listOpenInboxItems: vi.fn(),
  InboxItemKind: { EMI_COMPLETE: "emi_complete" },
}));

vi.mock("@/modules/health/application/log-health-ai-policy-block", () => ({
  logHealthAiPolicyBlock: vi.fn(),
}));

import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  getRealPosition,
  listRecentTransactions,
} from "@/modules/ledger/application";
import { getPlanPulse } from "@/modules/plan/application";
import { listOpenInboxItems } from "@/modules/inbox/application";
import { getHealthDetail } from "@/modules/health/application/get-health-detail";
import { logHealthAiPolicyBlock } from "@/modules/health/application/log-health-ai-policy-block";
import { InsightKind } from "@/modules/health/application/build-health-insights";

describe("getHealthDetail integration (ST-E06-001 / B2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates ledger, plan, and inbox reads without writes", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-1",
      householdId: "hh-1",
    });

    vi.mocked(getRealPosition).mockResolvedValue({
      accounts: [{ id: "a1" }, { id: "a2" }],
      totalBalance: 1_000_000,
    } as never);

    vi.mocked(getPlanPulse).mockResolvedValue({
      activeJars: [{ id: "j1" }],
      pausedJars: [],
    } as never);

    vi.mocked(listOpenInboxItems).mockResolvedValue([
      { id: "i1", kind: "unmapped_expense" },
    ] as never);

    vi.mocked(listRecentTransactions).mockResolvedValue([
      { id: "t1" },
      { id: "t2" },
      { id: "t3" },
    ] as never);

    const detail = await getHealthDetail();

    expect(detail).not.toBeNull();
    expect(detail!.accountCount).toBe(2);
    expect(detail!.activeJarCount).toBe(1);
    expect(detail!.openInboxCount).toBe(1);
    expect(detail!.recentTransactionCount).toBe(3);
    expect(detail!.hasEmiCompletePending).toBe(false);
    expect(detail!.insights.at(-1)?.kind).toBe(InsightKind.AI_GUARDRAIL);
    expect(getRealPosition).toHaveBeenCalledOnce();
    expect(getPlanPulse).toHaveBeenCalledOnce();
    expect(listOpenInboxItems).toHaveBeenCalledOnce();
    expect(listRecentTransactions).toHaveBeenCalledWith(8);
  });

  it("returns null when tenancy gate fails", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: "no_session",
    } as never);

    await expect(getHealthDetail()).resolves.toBeNull();
    expect(getRealPosition).not.toHaveBeenCalled();
  });

  it("wires BR-14 audit hook for policy blocks", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-1",
      householdId: "hh-1",
    });

    vi.mocked(getRealPosition).mockResolvedValue({
      accounts: [{ id: "a1" }],
      totalBalance: 0,
    } as never);
    vi.mocked(getPlanPulse).mockResolvedValue({
      activeJars: [],
      pausedJars: [],
    } as never);
    vi.mocked(listOpenInboxItems).mockResolvedValue([] as never);
    vi.mocked(listRecentTransactions).mockResolvedValue([] as never);

    await getHealthDetail();

    expect(logHealthAiPolicyBlock).not.toHaveBeenCalled();
  });
});
