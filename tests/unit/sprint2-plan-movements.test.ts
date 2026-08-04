/**
 * AC contract + command mapping for Sprint 2 verification fixes
 * (AC-JAR-01, AC-JAR-02, BR-06 BLOCK, BR-13 partner notify).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

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

vi.mock("@/modules/tenancy/application/get-household-policies", () => ({
  getHouseholdPolicies: vi.fn(),
}));

vi.mock("@/modules/plan/application/assert-plan-unlocked", () => ({
  assertPlanPeriodUnlocked: vi.fn(),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { getHouseholdPolicies } from "@/modules/tenancy/application/get-household-policies";
import { assertPlanPeriodUnlocked } from "@/modules/plan/application/assert-plan-unlocked";
import { OverspendPolicy } from "@/modules/tenancy/application/household-policies.schema";
import {
  MONEY_ACTION_DENIED_REASON,
  PRODUCT_ACTION_ERROR_CODE,
} from "@/modules/tenancy/application/tenancy-constants";
import {
  InboxItemKind,
  InboxSourceType,
} from "@/modules/inbox/application/inbox-constants";
import { reallocateJarCapacity } from "@/modules/plan/application/commands/reallocate-jar-capacity";
import {
  CapacityMovementDirection,
  PLAN_ACTION_ERROR_CODE,
  PLAN_MOVEMENT_LEDGER_IMPACT,
  PlanMovementEvent,
  reallocateJarCapacityInputSchema,
  applyCapacityDelta,
  areBankBalancesUnchanged,
  isCapacityMoveBlocked,
  isEmergencyIntentValid,
  isPartnerEmergencyAlert,
  isZeroLedgerImpact,
  shouldShowOverspendWarning,
} from "@/modules/plan/application/client";

const SOURCE = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const TARGET = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const DECLARER = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const PARTNER = "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("AC-JAR-01 GWT — reallocate $100 with $0.00 ledger impact", () => {
  it("accepts a valid capacity move and applies virtual deltas only", () => {
    expect(
      reallocateJarCapacityInputSchema.safeParse({
        sourceJarId: SOURCE,
        targetJarId: TARGET,
        amount: 100,
        isEmergency: false,
      }).success,
    ).toBe(true);

    expect(
      applyCapacityDelta(0, {
        direction: CapacityMovementDirection.OUT,
        amount: 100,
      }),
    ).toBe(-100);
    expect(
      applyCapacityDelta(0, {
        direction: CapacityMovementDirection.IN,
        amount: 100,
      }),
    ).toBe(100);

    expect(
      isZeroLedgerImpact({
        ledgerTransactionsCreated: 0,
        ledgerImpact: PLAN_MOVEMENT_LEDGER_IMPACT,
      }),
    ).toBe(true);
    expect(
      isZeroLedgerImpact({
        ledgerTransactionsCreated: 1,
        ledgerImpact: PLAN_MOVEMENT_LEDGER_IMPACT,
      }),
    ).toBe(false);
    expect(areBankBalancesUnchanged(1_500_000, 1_500_000)).toBe(true);
    expect(areBankBalancesUnchanged(1_500_000, 1_500_100)).toBe(false);
  });

  it("rejects same source and target jars", () => {
    const parsed = reallocateJarCapacityInputSchema.safeParse({
      sourceJarId: SOURCE,
      targetJarId: SOURCE,
      amount: 100,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe(
        PLAN_ACTION_ERROR_CODE.SAME_JAR,
      );
    }
  });
});

describe("AC-JAR-02 GWT — emergency bypasses WARN; BLOCK still floors capacity", () => {
  it("shows overspend warning only for non-emergency warn policy", () => {
    expect(
      shouldShowOverspendWarning({
        isEmergency: false,
        overspendPolicy: OverspendPolicy.WARN,
      }),
    ).toBe(true);
    expect(
      shouldShowOverspendWarning({
        isEmergency: true,
        overspendPolicy: OverspendPolicy.WARN,
      }),
    ).toBe(false);
  });

  it("blocks insufficient capacity under BLOCK even for emergency", () => {
    expect(
      isCapacityMoveBlocked({
        overspendPolicy: OverspendPolicy.BLOCK,
        sourceCapacityDelta: 50,
        amount: 200,
      }),
    ).toBe(true);
    expect(
      isCapacityMoveBlocked({
        overspendPolicy: OverspendPolicy.BLOCK,
        sourceCapacityDelta: 200,
        amount: 200,
      }),
    ).toBe(false);
    expect(
      isCapacityMoveBlocked({
        overspendPolicy: OverspendPolicy.ALLOW_NEGATIVE,
        sourceCapacityDelta: 0,
        amount: 200,
      }),
    ).toBe(false);
  });

  it("requires intent note when Declare Emergency is checked", () => {
    expect(
      isEmergencyIntentValid({ isEmergency: true, intentNote: "  " }),
    ).toBe(false);
    expect(
      isEmergencyIntentValid({
        isEmergency: true,
        intentNote: "Medical bill this week",
      }),
    ).toBe(true);

    const blocked = reallocateJarCapacityInputSchema.safeParse({
      sourceJarId: SOURCE,
      targetJarId: TARGET,
      amount: 200,
      isEmergency: true,
      intentNote: "",
    });
    expect(blocked.success).toBe(false);
  });

  it("notifies partners via assigned emergency_declaration channel", () => {
    expect(InboxItemKind.EMERGENCY_DECLARATION).toBe("emergency_declaration");
    expect(InboxSourceType.PLAN_MOVEMENT).toBe("plan_movement");
    expect(PlanMovementEvent.EMERGENCY_DECLARED).toBe("EmergencyDeclaredEvent");

    expect(
      isPartnerEmergencyAlert({
        kind: InboxItemKind.EMERGENCY_DECLARATION,
        executedByUserId: DECLARER,
        assignedToUserId: PARTNER,
        viewerUserId: PARTNER,
        emergencyKind: InboxItemKind.EMERGENCY_DECLARATION,
      }),
    ).toBe(true);
    expect(
      isPartnerEmergencyAlert({
        kind: InboxItemKind.EMERGENCY_DECLARATION,
        executedByUserId: DECLARER,
        assignedToUserId: PARTNER,
        viewerUserId: DECLARER,
        emergencyKind: InboxItemKind.EMERGENCY_DECLARATION,
      }),
    ).toBe(false);
  });
});

describe("reallocateJarCapacity command ↔ RPC mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertPlanPeriodUnlocked).mockResolvedValue({ ok: true });
  });

  it("maps zero-ledger RPC success and partner notify count (AC-JAR-01/02)", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: DECLARER,
      householdId: "h1",
    });
    vi.mocked(getHouseholdPolicies).mockResolvedValue({
      householdId: "h1",
      householdName: "Home",
      overspendPolicy: OverspendPolicy.WARN,
      monthCloseMode: "assisted",
      incomeAllocateMode: "suggest",
      canEdit: true,
      role: "admin",
    } as never);

    const rpc = vi.fn().mockResolvedValue({
      data: {
        plan_movement_id: "m1",
        source_jar_id: SOURCE,
        target_jar_id: TARGET,
        amount: 100,
        is_emergency: true,
        inbox_item_id: "i1",
        partner_notified_count: 1,
        ledger_transactions_created: 0,
        ledger_impact: 0,
      },
      error: null,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { capacity_delta: 500 },
                error: null,
              }),
            }),
          }),
        }),
      }),
      rpc,
    } as never);

    const result = await reallocateJarCapacity({
      sourceJarId: SOURCE,
      targetJarId: TARGET,
      amount: 100,
      isEmergency: true,
      intentNote: "Medical bill this week",
      warningAcknowledged: false,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ledgerTransactionsCreated).toBe(0);
      expect(result.ledgerImpact).toBe(0);
      expect(result.partnerNotifiedCount).toBe(1);
      expect(result.isEmergency).toBe(true);
    }
    expect(rpc).toHaveBeenCalledWith(
      "reallocate_jar_capacity",
      expect.objectContaining({
        p_source_jar_id: SOURCE,
        p_amount: 100,
        p_is_emergency: true,
      }),
    );
  });

  it("rejects BLOCK moves that exceed source capacity before RPC", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: DECLARER,
      householdId: "h1",
    });
    vi.mocked(getHouseholdPolicies).mockResolvedValue({
      householdId: "h1",
      householdName: "Home",
      overspendPolicy: OverspendPolicy.BLOCK,
      monthCloseMode: "assisted",
      incomeAllocateMode: "suggest",
      canEdit: true,
      role: "admin",
    } as never);

    const rpc = vi.fn();
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { capacity_delta: 50 },
                error: null,
              }),
            }),
          }),
        }),
      }),
      rpc,
    } as never);

    const result = await reallocateJarCapacity({
      sourceJarId: SOURCE,
      targetJarId: TARGET,
      amount: 200,
      isEmergency: false,
      warningAcknowledged: true,
    });

    expect(result).toEqual({
      ok: false,
      code: PLAN_ACTION_ERROR_CODE.CAPACITY_BLOCKED,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fails closed without membership", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: MONEY_ACTION_DENIED_REASON.UNAUTHENTICATED,
    });

    const result = await reallocateJarCapacity({
      sourceJarId: SOURCE,
      targetJarId: TARGET,
      amount: 100,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED);
    }
  });
});
