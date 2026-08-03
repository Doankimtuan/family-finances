import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { InboxItemStatus } from "@/modules/inbox/application/inbox-constants";
import { JarState, mapIncomeAllocateMode, resolveJarState } from "../jar-types";
import { GoalStatus, RitualStatus } from "../plan-constants";
import { currentPeriodMonth } from "../ritual-period";
import {
  mapRitualMode,
  mapRitualStatus,
  type MonthRitual,
  type RitualPreview,
} from "../ritual-types";

type RitualRow = {
  id: string;
  household_id: string;
  period_month: string;
  status: string;
  mode: string;
  preview_json: unknown;
  approved_at: string | null;
  correction_note: string | null;
};

function emptyPreview(
  periodMonth: string,
  monthCloseMode: RitualPreview["monthCloseMode"],
  incomeAllocateMode: RitualPreview["incomeAllocateMode"],
): RitualPreview {
  return {
    periodMonth,
    activeJarCount: 0,
    pausedJarCount: 0,
    archivedJarCount: 0,
    openInboxCount: 0,
    activeGoalCount: 0,
    recurringActiveCount: 0,
    incomeAllocateMode,
    monthCloseMode,
  };
}

function parseStoredPreview(
  raw: unknown,
  fallback: RitualPreview,
): RitualPreview {
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  return {
    periodMonth:
      typeof o.periodMonth === "string" ? o.periodMonth : fallback.periodMonth,
    activeJarCount: Number(o.activeJarCount) || 0,
    pausedJarCount: Number(o.pausedJarCount) || 0,
    archivedJarCount: Number(o.archivedJarCount) || 0,
    openInboxCount: Number(o.openInboxCount) || 0,
    activeGoalCount: Number(o.activeGoalCount) || 0,
    recurringActiveCount: Number(o.recurringActiveCount) || 0,
    incomeAllocateMode: mapIncomeAllocateMode(
      typeof o.incomeAllocateMode === "string" ? o.incomeAllocateMode : null,
    ),
    monthCloseMode: mapRitualMode(
      typeof o.monthCloseMode === "string" ? o.monthCloseMode : null,
    ),
  };
}

/**
 * Build live Assisted preview KPIs for the current period (intention snapshot).
 */
export async function buildRitualPreview(
  householdId: string,
  periodMonth: string = currentPeriodMonth(),
): Promise<RitualPreview | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const [
      { data: household },
      { data: jars },
      { count: inboxCount },
      { count: goalCount },
      { count: recurringCount },
    ] = await Promise.all([
      supabase
        .from("households")
        .select("month_close_mode, income_allocate_mode")
        .eq("id", householdId)
        .maybeSingle(),
      supabase
        .from("jars")
        .select("is_archived, is_paused")
        .eq("household_id", householdId),
      supabase
        .from("inbox_items")
        .select("id", { count: "exact", head: true })
        .eq("household_id", householdId)
        .eq("status", InboxItemStatus.PENDING),
      supabase
        .from("goals")
        .select("id", { count: "exact", head: true })
        .eq("household_id", householdId)
        .eq("status", GoalStatus.ACTIVE),
      supabase
        .from("recurring_rules")
        .select("id", { count: "exact", head: true })
        .eq("household_id", householdId)
        .eq("is_active", true),
    ]);

    const monthCloseMode = mapRitualMode(household?.month_close_mode);
    const incomeAllocateMode = mapIncomeAllocateMode(
      household?.income_allocate_mode,
    );

    let activeJarCount = 0;
    let pausedJarCount = 0;
    let archivedJarCount = 0;
    for (const row of jars ?? []) {
      const state = resolveJarState(row);
      if (state === JarState.ACTIVE) activeJarCount += 1;
      else if (state === JarState.PAUSED) pausedJarCount += 1;
      else archivedJarCount += 1;
    }

    return {
      periodMonth,
      activeJarCount,
      pausedJarCount,
      archivedJarCount,
      openInboxCount: inboxCount ?? 0,
      activeGoalCount: goalCount ?? 0,
      recurringActiveCount: recurringCount ?? 0,
      incomeAllocateMode,
      monthCloseMode,
    };
  } catch {
    return null;
  }
}

/**
 * Current-period Month Ritual read model (Assisted default — AC-009 / BR-09).
 */
export async function getMonthRitual(
  periodMonth: string = currentPeriodMonth(),
): Promise<MonthRitual | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household }, { data: row, error }] = await Promise.all([
      supabase
        .from("households")
        .select("month_close_mode, income_allocate_mode")
        .eq("id", gate.householdId)
        .maybeSingle(),
      supabase
        .from("month_ritual_runs")
        .select(
          "id, household_id, period_month, status, mode, preview_json, approved_at, correction_note",
        )
        .eq("household_id", gate.householdId)
        .eq("period_month", periodMonth)
        .maybeSingle(),
    ]);

    const monthCloseMode = mapRitualMode(household?.month_close_mode);
    const incomeAllocateMode = mapIncomeAllocateMode(
      household?.income_allocate_mode,
    );
    const fallback = emptyPreview(
      periodMonth,
      monthCloseMode,
      incomeAllocateMode,
    );

    // Table may not exist until migration is applied
    if (error) {
      const live =
        (await buildRitualPreview(gate.householdId, periodMonth)) ?? fallback;
      return {
        id: null,
        householdId: gate.householdId,
        periodMonth,
        status: RitualStatus.DRAFT,
        mode: monthCloseMode,
        preview: live,
        approvedAt: null,
        correctionNote: null,
        isLocked: false,
      };
    }

    if (!row) {
      const live =
        (await buildRitualPreview(gate.householdId, periodMonth)) ?? fallback;
      return {
        id: null,
        householdId: gate.householdId,
        periodMonth,
        status: RitualStatus.DRAFT,
        mode: monthCloseMode,
        preview: live,
        approvedAt: null,
        correctionNote: null,
        isLocked: false,
      };
    }

    const ritual = row as RitualRow;
    const status = mapRitualStatus(ritual.status);
    const preview =
      status === RitualStatus.DRAFT
        ? ((await buildRitualPreview(gate.householdId, periodMonth)) ??
          parseStoredPreview(ritual.preview_json, fallback))
        : parseStoredPreview(ritual.preview_json, fallback);

    return {
      id: ritual.id,
      householdId: ritual.household_id,
      periodMonth: ritual.period_month,
      status,
      mode: mapRitualMode(ritual.mode || monthCloseMode),
      preview,
      approvedAt: ritual.approved_at,
      correctionNote: ritual.correction_note,
      isLocked: status === RitualStatus.APPROVED,
    };
  } catch {
    return null;
  }
}
