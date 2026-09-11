import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";
import {
  PLAN_OPERATION,
  PLAN_QUERY_RPC,
  RecurringDirection,
} from "../plan-constants";
import { logPlanFailure } from "../plan-error";
import {
  calculateJarBudgetMetrics,
  calculateJarRuleBudget,
  calculateJarSpentAmount,
  calculateQualifyingPostedIncome,
  resolveQualifyingMonthlyIncome,
  resolveJarPlanForPeriod,
  type JarBudgetMetrics,
  type JarBudgetTransaction,
  type QualifyingIncomeResolution,
  type QualifyingIncomeSource,
} from "../jar-budget";
import {
  JarState,
  mapIncomeAllocateMode,
  mapJarPlan,
  mapJarRow,
  mapMonthCloseMode,
  type PlanJar,
  type PlanPulse,
} from "../jar-types";
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

export type JarPeriodSnapshotInsertRow = {
  household_id: string;
  jar_id: string;
  period_month: string;
  jar_name: string;
  plan_kind: string;
  percent_bps: number;
  fixed_amount: number;
  rollover_mode: string;
  qualifying_income: number;
  qualifying_income_source: string;
  rule_budget: number;
  rollover_credit: number;
};

export type CurrentPeriodSnapshotInserts = {
  householdId: string;
  periodMonth: string;
  rows: JarPeriodSnapshotInsertRow[];
};

type HouseholdSettings = {
  timezone: string;
  configuredIncome: number | null;
  currency: string;
};

type JarBudgetContext = {
  householdId: string;
  settings: HouseholdSettings;
  pulse: PlanPulse;
  currentPeriod: JarBudgetPeriod;
  selectedPeriod: JarBudgetPeriod;
  qualifyingIncome: QualifyingIncomeResolution;
  transactions: JarBudgetTransaction[];
  existing: Map<string, JarRuleSnapshotRow>;
  previousTransactions: JarBudgetTransaction[];
  previousAdjustments: Record<string, number>;
  adjustments: Record<string, number>;
};

type JsonRecord = Record<string, unknown>;

type PlanJarBudgetRawInputs = {
  householdId: string;
  timezone: string;
  currency: string;
  monthCloseMode: string | null;
  incomeAllocateMode: string | null;
  configuredIncome: number | string | null;
  currentPeriodMonth: string;
  previousPeriodMonth: string;
  jars: JsonRecord[];
  currentTransactions: JsonRecord[];
  previousTransactions: JsonRecord[];
  currentLoanPaymentIds: string[];
  previousLoanPaymentIds: string[];
  recurringIncome: JsonRecord[];
  snapshots: JsonRecord[];
  adjustments: JsonRecord[];
};

type RawAdjustment = {
  jarId: string;
  periodMonth: string;
  amount: number | string;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function readRecord(value: unknown): JsonRecord | null {
  return isRecord(value) ? value : null;
}

function readRecords(value: unknown): JsonRecord[] | null {
  if (!Array.isArray(value) || !value.every(isRecord)) return null;
  return value;
}

function readStrings(value: unknown): string[] | null {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    return null;
  }
  return value;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : readString(value);
}

function readNumber(value: unknown): number | string | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && Number.isFinite(Number(value))) {
    return value;
  }
  return null;
}

function readNullableNumber(value: unknown): number | string | null {
  return value === null || value === undefined ? null : readNumber(value);
}

function readNullableNumberValue(value: unknown): number | null {
  const numeric = readNullableNumber(value);
  if (numeric === null) return null;
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function readNullableBoolean(value: unknown): boolean | null {
  return value === null || value === undefined ? null : readBoolean(value);
}

function readRawRow(value: unknown): JsonRecord | null {
  return Array.isArray(value) ? readRecord(value[0]) : readRecord(value);
}

function parsePlanJarBudgetRawInputs(
  value: unknown,
): PlanJarBudgetRawInputs | null {
  const row = readRawRow(value);
  if (!row) return null;

  const householdId = readString(row.household_id);
  const timezone = readString(row.timezone);
  const currency = readString(row.base_currency);
  const currentPeriodMonth = readString(row.current_period_month);
  const previousPeriodMonth = readString(row.previous_period_month);
  const jars = readRecords(row.jars);
  const currentTransactions = readRecords(row.current_transactions);
  const previousTransactions = readRecords(row.previous_transactions);
  const currentLoanPaymentIds = readStrings(row.current_loan_payment_ids);
  const previousLoanPaymentIds = readStrings(row.previous_loan_payment_ids);
  const recurringIncome = readRecords(row.recurring_income);
  const snapshots = readRecords(row.snapshots);
  const adjustments = readRecords(row.adjustments);
  const configuredIncome = readNullableNumber(row.qualifying_monthly_income);

  if (
    !householdId ||
    !timezone ||
    !currency ||
    !currentPeriodMonth ||
    !previousPeriodMonth ||
    !jars ||
    !currentTransactions ||
    !previousTransactions ||
    !currentLoanPaymentIds ||
    !previousLoanPaymentIds ||
    !recurringIncome ||
    !snapshots ||
    !adjustments ||
    (row.qualifying_monthly_income !== null && configuredIncome === null)
  ) {
    return null;
  }

  return {
    householdId,
    timezone,
    currency,
    monthCloseMode: readNullableString(row.month_close_mode),
    incomeAllocateMode: readNullableString(row.income_allocate_mode),
    configuredIncome,
    currentPeriodMonth,
    previousPeriodMonth,
    jars,
    currentTransactions,
    previousTransactions,
    currentLoanPaymentIds,
    previousLoanPaymentIds,
    recurringIncome,
    snapshots,
    adjustments,
  };
}

function mapRawJar(row: JsonRecord): PlanJar | null {
  const id = readString(row.id);
  const name = readString(row.name);
  const kind = readString(row.kind);
  const sortOrder = readNumber(row.sort_order);
  const isArchived = readBoolean(row.is_archived);
  const isPaused = readBoolean(row.is_paused);
  if (
    !id ||
    !name ||
    !kind ||
    sortOrder === null ||
    isArchived === null ||
    isPaused === null
  ) {
    return null;
  }

  const rawPlan = row.jar_plans === null ? null : readRecord(row.jar_plans);
  if (row.jar_plans !== null && !rawPlan) return null;

  let plan: {
    plan_kind: string;
    percent_bps: number | string;
    fixed_amount: number | string;
  } | null = null;
  if (rawPlan) {
    const planKind = readString(rawPlan.plan_kind);
    const percentBps = readNumber(rawPlan.percent_bps);
    const fixedAmount = readNumber(rawPlan.fixed_amount);
    if (!planKind || percentBps === null || fixedAmount === null) return null;
    plan = {
      plan_kind: planKind,
      percent_bps: percentBps,
      fixed_amount: fixedAmount,
    };
  }

  return mapJarRow({
    id,
    name,
    kind,
    sort_order: Number(sortOrder),
    is_archived: isArchived,
    is_paused: isPaused,
    rollover_mode: readNullableString(row.rollover_mode),
    jar_plans: plan,
  });
}

function mapRawTransaction(row: JsonRecord): JarBudgetTransaction | null {
  const id = readString(row.id);
  const type = readString(row.type);
  const amount = readNumber(row.amount);
  if (!id || !type || amount === null) return null;
  return mapTransactionRow({
    id,
    type,
    amount,
    status: readNullableString(row.status),
    jar_id: readNullableString(row.jar_id),
    savings_event_kind: readNullableString(row.savings_event_kind),
    reverses_transaction_id: readNullableString(row.reverses_transaction_id),
    corrects_transaction_id: readNullableString(row.corrects_transaction_id),
    is_reversal: readNullableBoolean(row.is_reversal),
  });
}

function mapRawRecurring(row: JsonRecord): PlanRecurring | null {
  const id = readString(row.id);
  const name = readString(row.name);
  const direction = readString(row.direction);
  const amount = readNumber(row.amount);
  const frequency = readString(row.frequency);
  const intervalCount = readNumber(row.interval_count);
  const startDate = readString(row.start_date);
  const isActive = readBoolean(row.is_active);
  if (
    !id ||
    !name ||
    !direction ||
    amount === null ||
    !frequency ||
    intervalCount === null ||
    !startDate ||
    isActive === null
  ) {
    return null;
  }
  return mapRecurringRow({
    id,
    name,
    direction,
    amount,
    frequency,
    interval_count: Number(intervalCount),
    day_of_month: readNullableNumberValue(row.day_of_month),
    day_of_week: readNullableNumberValue(row.day_of_week),
    start_date: startDate,
    next_run_date: readNullableString(row.next_run_date),
    is_active: isActive,
  });
}

function mapRawSnapshot(row: JsonRecord): JarRuleSnapshotRow | null {
  const id = readNullableString(row.id);
  const householdId = readString(row.household_id);
  const jarId = readString(row.jar_id);
  const periodMonth = readString(row.period_month);
  const jarName = readString(row.jar_name);
  const planKind = readString(row.plan_kind);
  const percentBps = readNumber(row.percent_bps);
  const fixedAmount = readNumber(row.fixed_amount);
  const rolloverMode = readString(row.rollover_mode);
  const qualifyingIncome = readNullableNumber(row.qualifying_income);
  const qualifyingIncomeSource = readNullableString(
    row.qualifying_income_source,
  );
  const ruleBudget = readNullableNumber(row.rule_budget);
  const rolloverCredit = readNullableNumber(row.rollover_credit);
  if (
    !householdId ||
    !jarId ||
    !periodMonth ||
    !jarName ||
    !planKind ||
    percentBps === null ||
    fixedAmount === null ||
    !rolloverMode ||
    qualifyingIncome === null ||
    ruleBudget === null ||
    rolloverCredit === null
  ) {
    return null;
  }
  return {
    id: id ?? undefined,
    household_id: householdId,
    jar_id: jarId,
    period_month: periodMonth,
    jar_name: jarName,
    plan_kind: planKind,
    percent_bps: percentBps,
    fixed_amount: fixedAmount,
    rollover_mode: rolloverMode,
    qualifying_income: qualifyingIncome,
    qualifying_income_source: qualifyingIncomeSource,
    rule_budget: ruleBudget,
    rollover_credit: rolloverCredit,
  };
}

function mapRawAdjustment(row: JsonRecord): RawAdjustment | null {
  const jarId = readString(row.jar_id);
  const periodMonth = readString(row.period_month);
  const amount = readNumber(row.amount);
  if (!jarId || !periodMonth || amount === null) return null;
  return { jarId, periodMonth, amount };
}

function mapRawRows<T>(
  rows: readonly JsonRecord[],
  mapper: (row: JsonRecord) => T | null,
): T[] | null {
  const mapped = rows.map(mapper);
  return mapped.every((row): row is T => row !== null) ? mapped : null;
}

function sumRawAdjustments(
  rows: readonly RawAdjustment[],
  periodMonth: string,
): Record<string, number> {
  return rows
    .filter((row) => row.periodMonth === periodMonth)
    .reduce<Record<string, number>>((result, row) => {
      result[row.jarId] = (result[row.jarId] ?? 0) + (Number(row.amount) || 0);
      return result;
    }, {});
}

function periodForMonth(month: string, timezone: string): JarBudgetPeriod {
  return {
    month,
    start: month,
    end: periodMonthEndDate(month),
    endExclusive: periodMonthExclusiveEnd(month),
    timezone,
  };
}

function mapRawPulse(
  raw: PlanJarBudgetRawInputs,
  jars: readonly PlanJar[],
): PlanPulse {
  const activeJars = jars.filter((jar) => jar.state === JarState.ACTIVE);
  return {
    householdId: raw.householdId,
    currency: raw.currency.toUpperCase(),
    monthCloseMode: mapMonthCloseMode(raw.monthCloseMode),
    incomeAllocateMode: mapIncomeAllocateMode(raw.incomeAllocateMode),
    activeJars,
    pausedJarCount: jars.filter((jar) => jar.state === JarState.PAUSED).length,
    archivedJarCount: jars.filter((jar) => jar.state === JarState.ARCHIVED)
      .length,
  };
}

function mapRawRecurringIncome(
  raw: PlanJarBudgetRawInputs,
  period: JarBudgetPeriod,
): number | null {
  const rules = mapRawRows(raw.recurringIncome, mapRawRecurring);
  if (!rules) return null;
  const projectedRules: Array<PlanRecurring & { currency: string }> = rules.map(
    (rule) => ({
      ...rule,
      householdId: raw.householdId,
      currency: raw.currency.toUpperCase(),
    }),
  );
  return projectRecurringEvents(
    projectedRules,
    period.start,
    period.endExclusive,
  ).reduce((total, event) => total + Math.max(0, Math.trunc(event.amount)), 0);
}

function markLoanPayments(
  transactions: readonly JarBudgetTransaction[],
  loanPaymentIds: readonly string[],
): JarBudgetTransaction[] {
  const loanPaymentIdSet = new Set(loanPaymentIds);
  return transactions.map((transaction) => ({
    ...transaction,
    is_loan_payment: transaction.id
      ? loanPaymentIdSet.has(transaction.id)
      : false,
  }));
}

async function loadCurrentJarBudgetContextFromRpc(
  householdId: string,
  now: Date,
): Promise<JarBudgetContext | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    PLAN_QUERY_RPC.JAR_BUDGET_RAW_INPUTS,
    {
      p_now: now.toISOString(),
    },
  );
  if (error) throw error;

  const raw = parsePlanJarBudgetRawInputs(data);
  if (!raw || raw.householdId !== householdId) return null;

  const currentPeriod = periodForMonth(raw.currentPeriodMonth, raw.timezone);
  const selectedPeriod = currentPeriod;
  const mappedJars = mapRawRows(raw.jars, mapRawJar);
  const currentTransactions = mapRawRows(
    raw.currentTransactions,
    mapRawTransaction,
  );
  const previousTransactions = mapRawRows(
    raw.previousTransactions,
    mapRawTransaction,
  );
  const snapshots = mapRawRows(raw.snapshots, mapRawSnapshot);
  const adjustments = mapRawRows(raw.adjustments, mapRawAdjustment);
  const recurringIncome = mapRawRecurringIncome(raw, selectedPeriod);
  if (
    !mappedJars ||
    !currentTransactions ||
    !previousTransactions ||
    !snapshots ||
    !adjustments ||
    recurringIncome === null
  ) {
    return null;
  }

  const pulse = mapRawPulse(raw, mappedJars);
  const transactions = markLoanPayments(
    currentTransactions,
    raw.currentLoanPaymentIds,
  );
  const previousBudgetTransactions = markLoanPayments(
    previousTransactions,
    raw.previousLoanPaymentIds,
  );
  const qualifyingIncome = resolveQualifyingMonthlyIncome({
    configuredIncome: raw.configuredIncome,
    recurringIncome,
    postedIncome: calculateQualifyingPostedIncome(transactions),
  });
  const existing = new Map(
    snapshots.map((row) => [`${row.jar_id}:${row.period_month}`, row]),
  );
  const adjustmentRows = adjustments;

  return {
    householdId,
    settings: {
      timezone: raw.timezone,
      configuredIncome:
        raw.configuredIncome === null
          ? null
          : Number(raw.configuredIncome) || 0,
      currency: raw.currency.toUpperCase(),
    },
    pulse,
    currentPeriod,
    selectedPeriod,
    qualifyingIncome,
    transactions,
    existing,
    previousTransactions: previousBudgetTransactions,
    previousAdjustments: sumRawAdjustments(
      adjustmentRows,
      raw.previousPeriodMonth,
    ),
    adjustments: sumRawAdjustments(adjustmentRows, raw.currentPeriodMonth),
  };
}

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
  const [txResult, loanResult] = await Promise.all([
    supabase
      .from("transactions")
      .select(`${TRANSACTION_PERIOD_SELECT}, accounts!inner(financial_scope)`)
      .eq("household_id", householdId)
      .eq("accounts.financial_scope", FINANCIAL_SCOPE.HOUSEHOLD)
      .gte("transaction_date", period.start)
      .lt("transaction_date", period.endExclusive)
      .order("transaction_date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("loan_payments")
      .select("transaction_id")
      .eq("household_id", householdId)
      .gte("paid_at", period.start)
      .lt("paid_at", period.endExclusive),
  ]);
  if (txResult.error) throw txResult.error;
  const loanPaymentIds = new Set(
    (loanResult.data ?? []).map((row) => String(row.transaction_id)),
  );
  return (txResult.data ?? []).map((row) => ({
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
  if (jarIds.length === 0) return new Map();
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
  if (jarIds.length === 0) return {};
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

function buildCurrentPeriodSnapshotRow(input: {
  householdId: string;
  jar: PlanJar;
  periodMonth: string;
  qualifyingIncome: QualifyingIncomeResolution;
  previousSnapshot: JarRuleSnapshotRow | undefined;
  previousTransactions: JarBudgetTransaction[];
  previousAdjustment: number;
}): JarPeriodSnapshotInsertRow | null {
  const { jar } = input;
  if (!jar.plan) return null;
  const ruleBudget = calculateJarBudgetMetrics(jar, jar.id, [], {
    periodIncome: input.qualifyingIncome.amount,
  }).ruleBudget;
  const previousSpent = input.previousSnapshot
    ? calculateJarSpentAmount(jar.id, input.previousTransactions)
    : 0;
  const rolloverCredit = input.previousSnapshot
    ? calculateRolloverCreditFromPreviousState({
        rolloverMode: input.previousSnapshot.rollover_mode,
        previousBudget:
          (Number(input.previousSnapshot.rule_budget) ||
            snapshotRuleBudget(input.previousSnapshot)) +
          (Number(input.previousSnapshot.rollover_credit) || 0) +
          input.previousAdjustment,
        previousSpent,
      })
    : 0;
  return {
    household_id: input.householdId,
    jar_id: jar.id,
    period_month: input.periodMonth,
    jar_name: jar.name,
    plan_kind: jar.plan.kind,
    percent_bps: jar.plan.percentBps,
    fixed_amount: jar.plan.fixedAmount,
    rollover_mode: jar.rolloverMode,
    qualifying_income: input.qualifyingIncome.amount,
    qualifying_income_source: input.qualifyingIncome.source,
    rule_budget: ruleBudget ?? 0,
    rollover_credit: rolloverCredit,
  };
}

function missingCurrentPeriodSnapshotRows(
  context: JarBudgetContext,
): JarPeriodSnapshotInsertRow[] {
  if (context.selectedPeriod.month !== context.currentPeriod.month) return [];
  const previousPeriod = previousPeriodMonth(context.selectedPeriod.month);
  const rows: JarPeriodSnapshotInsertRow[] = [];
  for (const jar of context.pulse.activeJars) {
    const key = `${jar.id}:${context.selectedPeriod.month}`;
    if (context.existing.has(key)) continue;
    const row = buildCurrentPeriodSnapshotRow({
      householdId: context.householdId,
      jar,
      periodMonth: context.selectedPeriod.month,
      qualifyingIncome: context.qualifyingIncome,
      previousSnapshot: context.existing.get(`${jar.id}:${previousPeriod}`),
      previousTransactions: context.previousTransactions,
      previousAdjustment: context.previousAdjustments[jar.id] ?? 0,
    });
    if (row) rows.push(row);
  }
  return rows;
}

function snapshotsForRead(
  context: JarBudgetContext,
): Map<string, JarRuleSnapshotRow> {
  const snapshots = new Map(context.existing);
  for (const row of missingCurrentPeriodSnapshotRows(context)) {
    snapshots.set(`${row.jar_id}:${row.period_month}`, row);
  }
  return snapshots;
}

async function loadJarBudgetContext(
  periodMonth: string | undefined,
  now: Date,
): Promise<JarBudgetContext | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  const [settings, pulse] = await Promise.all([
    loadHouseholdSettings(gate.householdId),
    getPlanPulse(),
  ]);
  if (!pulse) return null;
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
  const previousPeriod = previousPeriodMonth(selectedPeriod.month);
  const jarIds = pulse.activeJars.map((jar) => jar.id);
  const previousBounds: JarBudgetPeriod = {
    ...selectedPeriod,
    month: previousPeriod,
    start: previousPeriod,
    end: periodMonthEndDate(previousPeriod),
    endExclusive: periodMonthExclusiveEnd(previousPeriod),
  };
  const [
    transactions,
    recurringIncome,
    existing,
    previousTransactions,
    previousAdjustments,
    adjustments,
  ] = await Promise.all([
    loadPeriodTransactions(gate.householdId, selectedPeriod),
    loadRecurringIncome(gate.householdId, selectedPeriod, settings.currency),
    loadSnapshots(gate.householdId, jarIds, [
      selectedPeriod.month,
      previousPeriod,
    ]),
    loadPeriodTransactions(gate.householdId, previousBounds),
    loadAdjustments(gate.householdId, jarIds, previousPeriod),
    loadAdjustments(gate.householdId, jarIds, selectedPeriod.month),
  ]);
  const qualifyingIncome = resolveQualifyingMonthlyIncome({
    configuredIncome: settings.configuredIncome,
    recurringIncome,
    postedIncome: calculateQualifyingPostedIncome(transactions),
  });
  return {
    householdId: gate.householdId,
    settings,
    pulse,
    currentPeriod,
    selectedPeriod,
    qualifyingIncome,
    transactions,
    existing,
    previousTransactions,
    previousAdjustments,
    adjustments,
  };
}

function summaryFromContext(
  context: JarBudgetContext,
): CurrentJarBudgetSummary {
  const snapshots = snapshotsForRead(context);
  const byJarId: Record<string, JarBudgetMetrics> = {};
  let summaryIncome = context.qualifyingIncome.amount;
  let summarySource = context.qualifyingIncome.source;
  for (const jar of context.pulse.activeJars) {
    const snapshot = snapshots.get(`${jar.id}:${context.selectedPeriod.month}`);
    if (!snapshot) continue;
    const budgetPlan = resolveJarPlanForPeriod({
      currentPlan: jar.plan,
      snapshotPlan: mapJarPlan(snapshot),
      periodMonth: context.selectedPeriod.month,
      currentPeriodMonth: context.currentPeriod.month,
    });
    if (!budgetPlan) continue;
    const periodIncome =
      Number(snapshot.qualifying_income ?? context.qualifyingIncome.amount) ||
      0;
    const source = incomeSource(snapshot.qualifying_income_source);
    byJarId[jar.id] = calculateJarBudgetMetrics(
      { plan: budgetPlan },
      jar.id,
      context.transactions,
      {
        periodIncome,
        incomeSource: source,
        rolloverCredit: Math.max(0, Number(snapshot.rollover_credit) || 0),
        adjustment: context.adjustments[jar.id] ?? 0,
      },
    );
    summaryIncome = periodIncome;
    summarySource = source;
  }
  return {
    periodMonth: context.selectedPeriod.month,
    periodIncome: summaryIncome,
    qualifyingIncome: summaryIncome,
    incomeSource: summarySource,
    period: context.selectedPeriod,
    byJarId,
  };
}

/**
 * Pure period read. Missing current-period snapshots are computed in memory
 * so hub numbers stay available; persistence belongs to
 * `ensureJarPeriodRuleSnapshots`.
 */
export async function getJarBudgetsForPeriod(
  periodMonth?: string,
  now = new Date(),
): Promise<CurrentJarBudgetSummary | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const context = await loadJarBudgetContext(periodMonth, now);
    if (!context) return null;
    return summaryFromContext(context);
  } catch (error) {
    logPlanFailure(error, PLAN_OPERATION.GET_JAR_BUDGETS, {
      householdId: gate.householdId,
      periodMonth,
    });
    return null;
  }
}

export async function getCurrentJarBudgets(
  now = new Date(),
): Promise<CurrentJarBudgetSummary | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const context = await loadCurrentJarBudgetContextFromRpc(
      gate.householdId,
      now,
    );
    return context ? summaryFromContext(context) : null;
  } catch (error) {
    logPlanFailure(error, PLAN_OPERATION.GET_JAR_BUDGETS, {
      householdId: gate.householdId,
    });
    return null;
  }
}

/**
 * Rows the write path should persist for the current period. GET never calls
 * this for its own side effects; commands insert with ON CONFLICT DO NOTHING.
 */
export async function collectCurrentPeriodSnapshotInserts(
  now = new Date(),
): Promise<CurrentPeriodSnapshotInserts | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const context = await loadJarBudgetContext(undefined, now);
    if (!context) return null;
    return {
      householdId: context.householdId,
      periodMonth: context.selectedPeriod.month,
      rows: missingCurrentPeriodSnapshotRows(context),
    };
  } catch (error) {
    logPlanFailure(error, PLAN_OPERATION.ENSURE_JAR_PERIOD_SNAPSHOTS, {
      householdId: gate.householdId,
    });
    return null;
  }
}
