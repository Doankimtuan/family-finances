const PLAN_JAR_BUDGET_LOG_CONTEXT = "[plan.jar-budgets]";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";
import { RecurringDirection } from "../plan-constants";
import {
  calculateJarBudgetMetrics,
  calculateJarRuleBudget,
  calculateJarSpentAmount,
  calculateQualifyingPostedIncome,
  resolveQualifyingMonthlyIncome,
  type JarBudgetMetrics,
  type JarBudgetTransaction,
  type QualifyingIncomeSource,
} from "../jar-budget";
import { mapJarPlan, type PlanJar } from "../jar-types";
import { projectRecurringEvents } from "../calendar-projection";
import { mapRecurringRow, type PlanRecurring } from "../goal-recurring-types";
import { getPlanPulse } from "./get-plan-pulse";
import {
  currentPeriodMonth,
  periodMonthEndDate,
  periodMonthExclusiveEnd,
} from "../ritual-period";
import {
  previousPeriodMonth,
  calculateRolloverCreditFromPreviousState,
} from "../jar-rollover";

const DEFAULT_HOUSEHOLD_TIMEZONE = HOUSEHOLD_TIMEZONE.VIETNAM;
const HOUSEHOLD_SETTINGS_SELECT =
  "timezone, qualifying_monthly_income, base_currency";
const HOUSEHOLD_SETTINGS_FALLBACK_SELECT = "timezone, base_currency";
const TRANSACTION_PERIOD_SELECT =
  "id, type, amount, status, jar_id, savings_event_kind, reverses_transaction_id, corrects_transaction_id, is_reversal";
const RECURRING_INCOME_SELECT =
  "id, name, direction, amount, frequency, interval_count, day_of_month, day_of_week, start_date, next_run_date, is_active";

type JarRuleSnapshotRow = {
  id?: string;
  household_id: string;
  jar_id: string;
  period_month: string;
  jar_name: string;
  plan_kind: string;
  percent_bps: number | string;
  fixed_amount: number | string;
  rollover_mode: string;
  qualifying_income?: number | string | null;
  qualifying_income_source?: string | null;
  rule_budget?: number | string | null;
  rollover_credit?: number | string | null;
};

const SNAPSHOT_SELECT =
  "id, household_id, jar_id, period_month, jar_name, plan_kind, percent_bps, fixed_amount, rollover_mode, qualifying_income, qualifying_income_source, rule_budget, rollover_credit";

export type JarBudgetPeriod = {
  month: string;
  start: string;
  end: string;
  endExclusive: string;
  timezone: string;
};

export type CurrentJarBudgetSummary = {
  periodMonth: string;
  periodIncome: number;
  qualifyingIncome: number;
  incomeSource: QualifyingIncomeSource;
  period: JarBudgetPeriod;
  byJarId: Record<string, JarBudgetMetrics>;
};

export function jarBudgetPeriodBounds(
  now = new Date(),
  timezone: string = DEFAULT_HOUSEHOLD_TIMEZONE,
): JarBudgetPeriod {
  const month = currentPeriodMonth(now, timezone);
  return {
    month,
    start: month,
    end: periodMonthEndDate(month),
    endExclusive: periodMonthExclusiveEnd(month),
    timezone,
  };
}

function mapTransactionRow(row: {
  id: string;
  type: string;
  amount: number | string;
  status?: string | null;
  jar_id?: string | null;
  savings_event_kind?: string | null;
  reverses_transaction_id?: string | null;
  corrects_transaction_id?: string | null;
  is_reversal?: boolean | null;
}): JarBudgetTransaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    status: row.status,
    jar_id: row.jar_id,
    savings_event_kind: row.savings_event_kind,
    reverses_transaction_id: row.reverses_transaction_id,
    corrects_transaction_id: row.corrects_transaction_id,
    is_reversal: row.is_reversal,
  };
}

async function loadPeriodTransactions(
  householdId: string,
  period: JarBudgetPeriod,
): Promise<JarBudgetTransaction[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_PERIOD_SELECT)
    .eq("household_id", householdId)
    .gte("transaction_date", period.start)
    .lt("transaction_date", period.endExclusive)
    .order("transaction_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  const { data: loanRows } = await supabase
    .from("loan_payments")
    .select("transaction_id")
    .eq("household_id", householdId)
    .gte("paid_at", period.start)
    .lt("paid_at", period.endExclusive);
  const loanPaymentIds = new Set(
    (loanRows ?? []).map((row) => String(row.transaction_id)),
  );
  return (data ?? []).map((row) => ({
    ...mapTransactionRow(row),
    is_loan_payment: loanPaymentIds.has(row.id),
  }));
}

async function loadHouseholdSettings(householdId: string): Promise<{
  timezone: string;
  configuredIncome: number | null;
  currency: string;
}> {
  const supabase = await createSupabaseServerClient();
  const preferred = await supabase
    .from("households")
    .select(HOUSEHOLD_SETTINGS_SELECT)
    .eq("id", householdId)
    .maybeSingle();
  if (!preferred.error && preferred.data) {
    return {
      timezone: preferred.data.timezone ?? DEFAULT_HOUSEHOLD_TIMEZONE,
      configuredIncome:
        preferred.data.qualifying_monthly_income == null
          ? null
          : Number(preferred.data.qualifying_monthly_income) || 0,
      currency: (
        preferred.data.base_currency ?? DEFAULT_CURRENCY
      ).toUpperCase(),
    };
  }
  const fallback = await supabase
    .from("households")
    .select(HOUSEHOLD_SETTINGS_FALLBACK_SELECT)
    .eq("id", householdId)
    .maybeSingle();
  return {
    timezone: fallback.data?.timezone ?? DEFAULT_HOUSEHOLD_TIMEZONE,
    configuredIncome: null,
    currency: (fallback.data?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
  };
}

async function loadRecurringIncome(
  householdId: string,
  period: JarBudgetPeriod,
  currency: string,
): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recurring_rules")
    .select(RECURRING_INCOME_SELECT)
    .eq("household_id", householdId)
    .eq("direction", RecurringDirection.INCOME)
    .eq("is_active", true);
  if (error || !data) return 0;
  const rules: Array<PlanRecurring & { currency: string }> = data.map(
    (row) => ({
      ...mapRecurringRow(row),
      householdId,
      currency,
    }),
  );
  return projectRecurringEvents(
    rules,
    period.start,
    period.endExclusive,
  ).reduce((total, event) => total + Math.max(0, Math.trunc(event.amount)), 0);
}

function incomeSource(
  value: string | null | undefined,
): QualifyingIncomeSource {
  return value === "configured" ||
    value === "recurring_fallback" ||
    value === "posted_fallback"
    ? value
    : "none";
}

function snapshotRuleBudget(row: JarRuleSnapshotRow): number {
  return calculateJarRuleBudget(
    mapJarPlan(row),
    Math.max(0, Number(row.qualifying_income) || 0),
  );
}

async function loadSnapshots(
  householdId: string,
  jarIds: string[],
  periods: string[],
): Promise<Map<string, JarRuleSnapshotRow>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("jar_period_rule_snapshots")
    .select(SNAPSHOT_SELECT)
    .eq("household_id", householdId)
    .in("jar_id", jarIds)
    .in("period_month", periods);
  if (error) throw error;
  if (!data) return new Map();
  return new Map(
    (data as JarRuleSnapshotRow[]).map((row) => [
      `${row.jar_id}:${row.period_month}`,
      row,
    ]),
  );
}

async function loadAdjustments(
  householdId: string,
  jarIds: string[],
  periodMonth: string,
): Promise<Record<string, number>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("jar_period_adjustments")
    .select("jar_id, amount")
    .eq("household_id", householdId)
    .eq("period_month", periodMonth)
    .in("jar_id", jarIds);
  if (error) throw error;
  if (!data) return {};
  return (data as Array<{ jar_id: string; amount: number | string }>).reduce<
    Record<string, number>
  >((result, row) => {
    result[row.jar_id] = (result[row.jar_id] ?? 0) + (Number(row.amount) || 0);
    return result;
  }, {});
}

async function ensureSnapshots(input: {
  householdId: string;
  jars: PlanJar[];
  selectedPeriod: JarBudgetPeriod;
  currentPeriod: string;
  qualifyingIncome: ReturnType<typeof resolveQualifyingMonthlyIncome>;
  previousTransactions: JarBudgetTransaction[];
  previousAdjustments: Record<string, number>;
  existing: Map<string, JarRuleSnapshotRow>;
}): Promise<Map<string, JarRuleSnapshotRow>> {
  const {
    householdId,
    jars,
    selectedPeriod,
    currentPeriod,
    qualifyingIncome,
    previousTransactions,
    previousAdjustments,
    existing,
  } = input;
  const previousPeriod = previousPeriodMonth(selectedPeriod.month);
  const inserts: Array<Record<string, unknown>> = [];
  for (const jar of jars) {
    if (!jar.plan) continue;
    const key = `${jar.id}:${selectedPeriod.month}`;
    if (existing.has(key) || selectedPeriod.month !== currentPeriod) continue;
    const ruleBudget = calculateJarBudgetMetrics(jar, jar.id, [], {
      periodIncome: qualifyingIncome.amount,
    }).ruleBudget;
    const previousSnapshot = existing.get(`${jar.id}:${previousPeriod}`);
    const previousSpent = previousSnapshot
      ? calculateJarSpentAmount(jar.id, previousTransactions)
      : 0;
    const rolloverCredit = previousSnapshot
      ? calculateRolloverCreditFromPreviousState({
          rolloverMode: previousSnapshot.rollover_mode,
          previousBudget:
            (Number(previousSnapshot.rule_budget) ||
              snapshotRuleBudget(previousSnapshot)) +
            (Number(previousSnapshot.rollover_credit) || 0) +
            (previousAdjustments[jar.id] ?? 0),
          previousSpent,
        })
      : 0;
    const row = {
      household_id: householdId,
      jar_id: jar.id,
      period_month: selectedPeriod.month,
      jar_name: jar.name,
      plan_kind: jar.plan.kind,
      percent_bps: jar.plan.percentBps,
      fixed_amount: jar.plan.fixedAmount,
      rollover_mode: jar.rolloverMode,
      qualifying_income: qualifyingIncome.amount,
      qualifying_income_source: qualifyingIncome.source,
      rule_budget: ruleBudget,
      rollover_credit: rolloverCredit,
    };
    inserts.push(row);
    existing.set(key, row as JarRuleSnapshotRow);
  }
  const supabase = await createSupabaseServerClient();
  if (inserts.length)
    await supabase.from("jar_period_rule_snapshots").insert(inserts);
  return existing;
}

export async function getJarBudgetsForPeriod(
  periodMonth?: string,
  now = new Date(),
): Promise<CurrentJarBudgetSummary | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const settings = await loadHouseholdSettings(gate.householdId);
    const currentPeriod = jarBudgetPeriodBounds(now, settings.timezone);
    const selectedPeriod = periodMonth
      ? {
          ...currentPeriod,
          month: periodMonth,
          start: periodMonth,
          end: periodMonthEndDate(periodMonth),
          endExclusive: periodMonthExclusiveEnd(periodMonth),
        }
      : currentPeriod;
    const pulse = await getPlanPulse();
    if (!pulse) return null;
    const transactions = await loadPeriodTransactions(
      gate.householdId,
      selectedPeriod,
    );
    const recurringIncome = await loadRecurringIncome(
      gate.householdId,
      selectedPeriod,
      settings.currency,
    );
    const qualifyingIncome = resolveQualifyingMonthlyIncome({
      configuredIncome: settings.configuredIncome,
      recurringIncome,
      postedIncome: calculateQualifyingPostedIncome(transactions),
    });
    const jarIds = pulse.activeJars.map((jar) => jar.id);
    const previousPeriod = previousPeriodMonth(selectedPeriod.month);
    const existing = await loadSnapshots(gate.householdId, jarIds, [
      selectedPeriod.month,
      previousPeriod,
    ]);
    const previousTransactions = await loadPeriodTransactions(
      gate.householdId,
      {
        ...selectedPeriod,
        month: previousPeriod,
        start: previousPeriod,
        end: periodMonthEndDate(previousPeriod),
        endExclusive: periodMonthExclusiveEnd(previousPeriod),
      },
    );
    const previousAdjustments = await loadAdjustments(
      gate.householdId,
      jarIds,
      previousPeriod,
    );
    const snapshots = await ensureSnapshots({
      householdId: gate.householdId,
      jars: pulse.activeJars,
      selectedPeriod,
      currentPeriod: currentPeriod.month,
      qualifyingIncome,
      previousTransactions,
      previousAdjustments,
      existing,
    });
    const adjustments = await loadAdjustments(
      gate.householdId,
      jarIds,
      selectedPeriod.month,
    );
    const byJarId: Record<string, JarBudgetMetrics> = {};
    let summaryIncome = qualifyingIncome.amount;
    let summarySource = qualifyingIncome.source;
    for (const jar of pulse.activeJars) {
      const snapshot = snapshots.get(`${jar.id}:${selectedPeriod.month}`);
      if (!snapshot) continue;
      const snapshotJar = {
        ...jar,
        name: snapshot.jar_name,
        rolloverMode: snapshot.rollover_mode === "carry" ? "carry" : "reset",
        plan: {
          kind: snapshot.plan_kind === "percent" ? "percent" : "fixed",
          percentBps: Number(snapshot.percent_bps) || 0,
          fixedAmount: Number(snapshot.fixed_amount) || 0,
        },
      } as PlanJar;
      const periodIncome =
        Number(snapshot.qualifying_income ?? qualifyingIncome.amount) || 0;
      const source = incomeSource(snapshot.qualifying_income_source);
      byJarId[jar.id] = calculateJarBudgetMetrics(
        snapshotJar,
        jar.id,
        transactions,
        {
          periodIncome,
          incomeSource: source,
          rolloverCredit: Math.max(0, Number(snapshot.rollover_credit) || 0),
          adjustment: adjustments[jar.id] ?? 0,
        },
      );
      summaryIncome = periodIncome;
      summarySource = source;
    }
    return {
      periodMonth: selectedPeriod.month,
      periodIncome: summaryIncome,
      qualifyingIncome: summaryIncome,
      incomeSource: summarySource,
      period: selectedPeriod,
      byJarId,
    };
  } catch (error) {
    console.error(PLAN_JAR_BUDGET_LOG_CONTEXT, error);
    return null;
  }
}

export async function getCurrentJarBudgets(
  now = new Date(),
): Promise<CurrentJarBudgetSummary | null> {
  return getJarBudgetsForPeriod(undefined, now);
}
