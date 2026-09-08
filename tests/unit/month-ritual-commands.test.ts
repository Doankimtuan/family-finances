import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

vi.mock("@/modules/plan/application/queries/get-month-ritual", () => ({
  buildRitualPreview: vi.fn(),
}));

vi.mock("@/modules/plan/application/queries/ritual-gates", () => ({
  listRitualDivergence: vi.fn(),
  listRitualEmergencies: vi.fn(),
}));

vi.mock(
  "@/modules/plan/application/commands/ensure-jar-period-snapshots",
  () => ({
    ensureJarPeriodRuleSnapshots: vi.fn(async () => ({ ok: true, written: 0 })),
  }),
);

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { buildRitualPreview } from "@/modules/plan/application/queries/get-month-ritual";
import {
  listRitualDivergence,
  listRitualEmergencies,
} from "@/modules/plan/application/queries/ritual-gates";
import { ensureJarPeriodRuleSnapshots } from "@/modules/plan/application/commands/ensure-jar-period-snapshots";
import {
  acknowledgeRitualEmergencies,
  approveMonthRitual,
  correctMonthRitual,
  previewMonthRitual,
} from "@/modules/plan/application/commands/month-ritual";
import {
  IncomeAllocateMode,
  MonthlyReviewStatus,
  RitualMode,
  RitualStatus,
  RITUAL_GATE_ERROR_CODE,
} from "@/modules/plan/application/plan-constants";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import type { RitualPreview } from "@/modules/plan/application/ritual-types";

const MONTH_RITUAL_RUNS_TABLE = "month_ritual_runs";
const GOALS_TABLE = "goals";
const SNAPSHOTS_TABLE = "goal_period_funded_snapshots";
const HOUSEHOLDS_TABLE = "households";
const HOUSEHOLD_ID = "household-1";
const USER_ID = "user-1";
const RITUAL_ID = "ritual-1";
const PERIOD_MONTH = "2026-08-01";
const FIXED_NOW = new Date("2026-08-17T00:00:00.000Z");

const PREVIEW: RitualPreview = {
  periodMonth: PERIOD_MONTH,
  activeJarCount: 2,
  pausedJarCount: 1,
  archivedJarCount: 0,
  openInboxCount: 1,
  activeGoalCount: 1,
  recurringActiveCount: 2,
  incomeAllocateMode: IncomeAllocateMode.SUGGEST,
  monthCloseMode: RitualMode.ASSISTED,
};

type MonthRun = {
  id: string;
  status: string;
  mode?: string | null;
  emergencies_acknowledged_at?: string | null;
};

function makeMonthRunTable(
  existing: MonthRun | null,
  options: {
    updateError?: unknown;
    insertedId?: string;
  } = {},
) {
  const updates: unknown[] = [];
  const inserts: unknown[] = [];
  const table = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: existing, error: null }),
    update: vi.fn((payload: unknown) => {
      updates.push(payload);
      return {
        eq: vi.fn().mockResolvedValue({ error: options.updateError ?? null }),
      };
    }),
    insert: vi.fn((payload: unknown) => {
      inserts.push(payload);
      return {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: options.insertedId ?? RITUAL_ID },
          error: null,
        }),
      };
    }),
  };

  return { table, inserts, updates };
}

function makeSupabase(options: {
  existing?: MonthRun | null;
  goals?: Array<{ id: string; funded_amount: number }>;
  monthUpdateError?: unknown;
  insertedId?: string;
}) {
  const monthRun = makeMonthRunTable(options.existing ?? null, {
    updateError: options.monthUpdateError,
    insertedId: options.insertedId,
  });
  const goalsTable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockResolvedValue({ data: options.goals ?? [], error: null }),
  };
  const snapshotsTable = { upsert: vi.fn().mockResolvedValue({ error: null }) };
  const householdsTable = {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  };
  const from = vi.fn((table: string) => {
    if (table === MONTH_RITUAL_RUNS_TABLE) return monthRun.table;
    if (table === GOALS_TABLE) return goalsTable;
    if (table === SNAPSHOTS_TABLE) return snapshotsTable;
    if (table === HOUSEHOLDS_TABLE) return householdsTable;
    throw new Error(`Unexpected table: ${table}`);
  });

  vi.mocked(createSupabaseServerClient).mockResolvedValue({ from } as never);
  return { from, monthRun, snapshotsTable, householdsTable };
}

describe("month ritual command behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: USER_ID,
      householdId: HOUSEHOLD_ID,
    });
    vi.mocked(buildRitualPreview).mockResolvedValue(PREVIEW);
    vi.mocked(listRitualDivergence).mockResolvedValue([]);
    vi.mocked(listRitualEmergencies).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a preview for an unlocked period", async () => {
    const supabase = makeSupabase({ insertedId: RITUAL_ID });

    await expect(previewMonthRitual(PERIOD_MONTH)).resolves.toEqual({
      ok: true,
      status: RitualStatus.PREVIEWED,
      ritualId: RITUAL_ID,
    });

    expect(supabase.monthRun.inserts).toEqual([
      expect.objectContaining({
        household_id: HOUSEHOLD_ID,
        period_month: PERIOD_MONTH,
        status: RitualStatus.PREVIEWED,
        mode: RitualMode.ASSISTED,
        preview_json: PREVIEW,
        updated_at: FIXED_NOW.toISOString(),
      }),
    ]);
    expect(ensureJarPeriodRuleSnapshots).toHaveBeenCalled();
  });

  it("rejects approval when the period is already locked", async () => {
    const supabase = makeSupabase({
      existing: { id: RITUAL_ID, status: RitualStatus.APPROVED },
    });

    await expect(
      approveMonthRitual({ periodMonth: PERIOD_MONTH }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED,
    });
    expect(supabase.monthRun.table.update).not.toHaveBeenCalled();
  });

  it("rejects approval until ritual emergencies are acknowledged", async () => {
    vi.mocked(listRitualEmergencies).mockResolvedValue([
      {
        id: "emergency-1",
        amount: 50,
        intentNote: "Emergency move",
        sourceJarId: "jar-1",
        targetJarId: "jar-2",
        createdAt: FIXED_NOW.toISOString(),
      },
    ]);
    const supabase = makeSupabase({
      existing: { id: RITUAL_ID, status: RitualStatus.PREVIEWED },
    });

    await expect(
      approveMonthRitual({ periodMonth: PERIOD_MONTH }),
    ).resolves.toEqual({
      ok: false,
      code: RITUAL_GATE_ERROR_CODE.EMERGENCIES_UNACKNOWLEDGED,
    });
    expect(supabase.monthRun.table.update).not.toHaveBeenCalled();
  });

  it("approves a preview and snapshots active goal funding", async () => {
    const supabase = makeSupabase({
      existing: {
        id: RITUAL_ID,
        status: RitualStatus.PREVIEWED,
        mode: RitualMode.ASSISTED,
      },
      goals: [{ id: "goal-1", funded_amount: 125_000 }],
    });

    await expect(
      approveMonthRitual({ periodMonth: PERIOD_MONTH }),
    ).resolves.toEqual({
      ok: true,
      status: RitualStatus.APPROVED,
      ritualId: RITUAL_ID,
    });

    expect(supabase.monthRun.updates).toEqual([
      {
        status: RitualStatus.APPROVED,
        mode: RitualMode.ASSISTED,
        review_status: MonthlyReviewStatus.MARKED_REVIEWED,
        approved_by: USER_ID,
        approved_at: FIXED_NOW.toISOString(),
        updated_at: FIXED_NOW.toISOString(),
      },
    ]);
    expect(supabase.snapshotsTable.upsert).toHaveBeenCalledWith(
      [
        {
          household_id: HOUSEHOLD_ID,
          goal_id: "goal-1",
          period_month: PERIOD_MONTH,
          funded_amount: 125_000,
        },
      ],
      { onConflict: "goal_id,period_month" },
    );
    expect(ensureJarPeriodRuleSnapshots).toHaveBeenCalled();
  });

  it("rejects approval when no preview exists", async () => {
    const supabase = makeSupabase({ existing: null });

    await expect(
      approveMonthRitual({ periodMonth: PERIOD_MONTH }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
    expect(supabase.monthRun.table.update).not.toHaveBeenCalled();
  });

  it("corrects an approved period and clears lock-related fields", async () => {
    const supabase = makeSupabase({
      existing: { id: RITUAL_ID, status: RitualStatus.APPROVED },
    });

    await expect(
      correctMonthRitual({
        note: "Corrected after review",
        periodMonth: PERIOD_MONTH,
      }),
    ).resolves.toEqual({
      ok: true,
      status: RitualStatus.CORRECTED,
      ritualId: RITUAL_ID,
    });

    expect(supabase.monthRun.updates).toEqual([
      {
        status: RitualStatus.CORRECTED,
        correction_note: "Corrected after review",
        corrected_by: USER_ID,
        corrected_at: FIXED_NOW.toISOString(),
        auto_locked_at: null,
        emergencies_acknowledged_at: null,
        updated_at: FIXED_NOW.toISOString(),
      },
    ]);
    expect(supabase.householdsTable.update).toHaveBeenCalledWith({
      consecutive_completed_rituals: 0,
    });
  });

  it("maps a failed ritual mutation to a stable error code", async () => {
    const supabase = makeSupabase({
      existing: { id: RITUAL_ID, status: RitualStatus.PREVIEWED },
      monthUpdateError: { code: "db_failure", message: "database unavailable" },
    });

    const result = await approveMonthRitual({ periodMonth: PERIOD_MONTH });

    expect(result).toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });
    expect(JSON.stringify(result)).not.toContain("database unavailable");
    expect(supabase.monthRun.updates).toHaveLength(1);
  });

  it("acknowledges emergencies on an existing draft", async () => {
    vi.mocked(listRitualEmergencies).mockResolvedValue([
      {
        id: "emergency-1",
        amount: 50,
        intentNote: null,
        sourceJarId: "jar-1",
        targetJarId: "jar-2",
        createdAt: FIXED_NOW.toISOString(),
      },
    ]);
    const supabase = makeSupabase({
      existing: { id: RITUAL_ID, status: RitualStatus.DRAFT },
    });

    await expect(acknowledgeRitualEmergencies(PERIOD_MONTH)).resolves.toEqual({
      ok: true,
      status: RitualStatus.DRAFT,
      ritualId: RITUAL_ID,
    });
    expect(supabase.monthRun.updates).toEqual([
      {
        emergencies_acknowledged_at: FIXED_NOW.toISOString(),
        updated_at: FIXED_NOW.toISOString(),
      },
    ]);
  });
});
