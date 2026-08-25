const MONTHLY_REVIEW_QUERY_LOG_CONTEXT = "[plan.monthly-review-query]";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { classifyFinancialEvent } from "@/modules/ledger/application/financial-semantics";
import { TransactionLedgerType } from "@/modules/ledger/application/ledger-constants";
import { getJarBudgetsForPeriod } from "./get-current-jar-budgets";
import { listGoals } from "./list-goals";
import { listJars } from "./list-jars";
import { currentPeriodMonth, periodMonthExclusiveEnd } from "../ritual-period";
import { GoalStatus, RitualMode } from "../plan-constants";
import {
  getPlanRecommendations,
  type PlanRecommendation,
} from "../plan-recommendations";
import type { JarBudgetState } from "../jar-budget";

type ReviewTransaction = {
  id: string;
  type: string;
  amount: number | string;
  status: string | null;
  transaction_date: string;
  created_at: string;
  transfer_group_id: string | null;
  savings_event_kind: string | null;
  is_reversal: boolean | null;
  reverses_transaction_id: string | null;
  jar_id: string | null;
  category_id: string | null;
};

type ReviewSnapshot = {
  capturedAt: string;
  cashFlow: MonthlyReview["cashFlow"];
  jars: MonthlyReview["jars"];
  goals: MonthlyReview["goals"];
};

export type MonthlyReview = {
  periodMonth: string;
  currentPeriodMonth: string;
  isCurrentPeriod: boolean;
  isFuturePeriod: boolean;
  timezone: string;
  currency: string;
  assistMode: "assisted" | "manual";
  review: {
    state: "not_started" | "viewed" | "marked_reviewed";
    viewedAt: string | null;
    reviewedAt: string | null;
    snapshot: ReviewSnapshot | null;
    updatedAfterReview: boolean;
    latestActivityAt: string | null;
  };
  cashFlow: {
    income: number;
    expenses: number;
    savingsAdded: number;
    savingsWithdrawn: number;
    netSavingsPlacement: number;
    investmentBuys: number;
    investmentSales: number;
    netInvested: number;
    debtCashPaid: number;
    debtPrincipalReduced: number;
    debtInterest: number;
    netCashFlow: number;
    activityCount: number;
  };
  jars: Array<{
    id: string;
    name: string;
    budget: number;
    spent: number;
    remaining: number;
    usagePercent: number;
    state: JarBudgetState;
  }>;
  goals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    fundedAmount: number;
    /**
     * Canonical PlanGoal progress (calculateGoalProgressPercent); may exceed
     * 100% when linked funding exceeds the target. Do not clamp here.
     */
    progressPercent: number | null;
    state:
      "active" | "ready" | "paused" | "legacy_progress" | "missing_backing";
    backing: "linked" | "legacy" | "missing";
    movement: number | null;
  }>;
  changes: Array<{
    id: string;
    label: "expenses" | "savings" | "investment" | "debt" | "jar";
    amount: number;
    percent: number | null;
    direction: "up" | "down" | "flat";
  }>;
  issues: Array<{
    id: string;
    kind: "uncategorized" | "overspent_jar" | "missing_income" | "goal_backing";
    value?: number;
    name?: string;
  }>;
  recommendations: PlanRecommendation[];
  suggestedActions: PlanRecommendation[];
};

function amount(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

function safePercent(part: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round(((part - total) / total) * 100);
}

function direction(value: number): "up" | "down" | "flat" {
  return value > 0 ? "up" : value < 0 ? "down" : "flat";
}

function previousMonth(periodMonth: string): string {
  const start = new Date(`${periodMonth}T00:00:00.000Z`);
  const previous = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1),
  );
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function emptyCashFlow() {
  return {
    income: 0,
    expenses: 0,
    savingsAdded: 0,
    savingsWithdrawn: 0,
    netSavingsPlacement: 0,
    investmentBuys: 0,
    investmentSales: 0,
    netInvested: 0,
    debtCashPaid: 0,
    debtPrincipalReduced: 0,
    debtInterest: 0,
    netCashFlow: 0,
    activityCount: 0,
  };
}

async function loadTransactions(householdId: string, periodMonth: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, type, amount, status, transaction_date, created_at, transfer_group_id, savings_event_kind, is_reversal, reverses_transaction_id, jar_id, category_id, accounts!inner(financial_scope)",
    )
    .eq("household_id", householdId)
    .eq("accounts.financial_scope", FINANCIAL_SCOPE.HOUSEHOLD)
    .gte("transaction_date", periodMonth)
    .lt("transaction_date", periodMonthExclusiveEnd(periodMonth))
    .order("transaction_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReviewTransaction[];
}

export function summarizeCashFlow(rows: ReviewTransaction[]) {
  const summary = emptyCashFlow();
  const seenTransferGroups = new Set<string>();
  for (const row of rows) {
    const value = amount(row.amount);
    const semantics = classifyFinancialEvent({
      type: row.type,
      status: row.status,
      savingsEventKind: row.savings_event_kind,
      isReversal: row.is_reversal ?? false,
      reversesTransactionId: row.reverses_transaction_id,
    });
    if (row.transfer_group_id && semantics.category === "savings") {
      if (seenTransferGroups.has(row.transfer_group_id)) continue;
      seenTransferGroups.add(row.transfer_group_id);
    }
    summary.activityCount += 1;
    if (semantics.countsTowardIncome) summary.income += value;
    if (semantics.countsTowardExpense) summary.expenses += value;
    if (row.savings_event_kind?.includes("PRINCIPAL_PLACEMENT"))
      summary.savingsAdded += value;
    if (row.savings_event_kind?.includes("PRINCIPAL_RETURN"))
      summary.savingsWithdrawn += value;
    if (row.type === TransactionLedgerType.INVESTMENT_BUY)
      summary.investmentBuys += value;
    if (row.type === TransactionLedgerType.INVESTMENT_SELL_PROCEEDS)
      summary.investmentSales += value;
    if (
      row.type === TransactionLedgerType.LIABILITY_PAYMENT ||
      row.type === TransactionLedgerType.LOAN_INTEREST ||
      row.type === TransactionLedgerType.DEBT_LENDING
    )
      summary.debtCashPaid += value;
    if (row.type === TransactionLedgerType.DEBT_LENDING)
      summary.debtPrincipalReduced += value;
  }
  summary.netSavingsPlacement = summary.savingsAdded - summary.savingsWithdrawn;
  summary.netInvested = summary.investmentBuys - summary.investmentSales;
  summary.netCashFlow =
    summary.income -
    summary.expenses -
    summary.netSavingsPlacement -
    summary.netInvested -
    summary.debtCashPaid;
  return summary;
}

async function loadReviewRow(householdId: string, periodMonth: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("month_ritual_runs")
    .select(
      "id, review_status, viewed_at, reviewed_at, review_snapshot, updated_at",
    )
    .eq("household_id", householdId)
    .eq("period_month", periodMonth)
    .maybeSingle();
  return data as {
    review_status?: string | null;
    viewed_at?: string | null;
    reviewed_at?: string | null;
    review_snapshot?: ReviewSnapshot | null;
    updated_at?: string | null;
  } | null;
}

export async function getMonthlyReview(
  periodMonth?: string,
): Promise<MonthlyReview | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: household } = await supabase
      .from("households")
      .select("base_currency, timezone, month_close_mode")
      .eq("id", gate.householdId)
      .maybeSingle();
    const timezone = household?.timezone ?? "Asia/Ho_Chi_Minh";
    const currency = String(household?.base_currency ?? "VND").toUpperCase();
    const current = currentPeriodMonth(new Date(), timezone);
    const selected = periodMonth ?? current;
    if (selected > current) return null;
    const [rows, budgets, goalsList, jarsList, reviewRow] = await Promise.all([
      loadTransactions(gate.householdId, selected),
      getJarBudgetsForPeriod(selected),
      listGoals(),
      listJars(),
      loadReviewRow(gate.householdId, selected),
    ]);
    const cashFlow = summarizeCashFlow(rows);
    const jarNames = new Map(
      [
        ...(jarsList?.active ?? []),
        ...(jarsList?.paused ?? []),
        ...(jarsList?.archived ?? []),
      ].map((jar) => [jar.id, jar.name]),
    );
    const jars = Object.entries(budgets?.byJarId ?? {}).map(([id, metric]) => ({
      id,
      name: jarNames.get(id) ?? id,
      budget: metric.budgetAmount,
      spent: metric.spentAmount,
      remaining: metric.remainingAmount,
      usagePercent: metric.usagePercent,
      state: metric.state,
    }));
    const goals = (goalsList?.goals ?? [])
      .filter((goal) => goal.status !== GoalStatus.CANCELLED)
      .map((goal) => {
        const fundedAmount = amount(goal.fundedAmount);
        const targetAmount = amount(goal.targetAmount);
        const linked = goal.fundingLinks?.length > 0;
        const legacy = Boolean(goal.isLegacyIntention) && !linked;
        return {
          id: goal.id,
          name: goal.name,
          targetAmount,
          fundedAmount,
          progressPercent: goal.progressPercent,
          state: legacy
            ? "legacy_progress"
            : linked
              ? goal.status === GoalStatus.READY
                ? "ready"
                : goal.status === GoalStatus.PAUSED
                  ? "paused"
                  : "active"
              : "missing_backing",
          backing: linked ? "linked" : legacy ? "legacy" : "missing",
          movement: null,
        } as MonthlyReview["goals"][number];
      });
    const issues: MonthlyReview["issues"] = [];
    const uncategorized = rows.filter(
      (row) => row.type === TransactionLedgerType.EXPENSE && !row.category_id,
    ).length;
    if (uncategorized > 0)
      issues.push({
        id: "uncategorized",
        kind: "uncategorized",
        value: uncategorized,
      });
    for (const jar of jars.filter((item) => item.state === "overspent"))
      issues.push({
        id: `jar:${jar.id}`,
        kind: "overspent_jar",
        value: Math.abs(jar.remaining),
        name: jar.name,
      });
    for (const goal of goals.filter((item) => item.backing === "missing"))
      issues.push({
        id: `goal:${goal.id}`,
        kind: "goal_backing",
        name: goal.name,
      });
    if (jars.length > 0 && (budgets?.qualifyingIncome ?? 0) <= 0)
      issues.push({ id: "missing-income", kind: "missing_income" });
    const assistMode =
      household?.month_close_mode === RitualMode.MANUAL ? "manual" : "assisted";
    const recommendationJars = (jarsList?.active ?? []).filter(
      (jar) => jar.kind !== "income",
    );
    const recommendations = getPlanRecommendations({
      assistMode,
      periodMonth: selected,
      isHistorical: selected !== current,
      jars: recommendationJars,
      budgetsByJar: budgets?.byJarId ?? {},
      qualifyingIncome: budgets?.periodIncome ?? 0,
      uncategorizedCount: uncategorized,
      goals: goalsList?.goals ?? [],
      limit: 3,
    });
    const suggestedActions = recommendations;
    const previous = await getMonthlyReviewWithoutState(
      gate.householdId,
      previousMonth(selected),
    );
    const changes: MonthlyReview["changes"] = [];
    if (previous) {
      const expenseDelta = cashFlow.expenses - previous.cashFlow.expenses;
      if (
        Math.abs(expenseDelta) >=
        Math.max(100000, previous.cashFlow.expenses * 0.1)
      )
        changes.push({
          id: "expenses",
          label: "expenses",
          amount: expenseDelta,
          percent: safePercent(cashFlow.expenses, previous.cashFlow.expenses),
          direction: direction(expenseDelta),
        });
      const savingsDelta =
        cashFlow.netSavingsPlacement - previous.cashFlow.netSavingsPlacement;
      if (
        Math.abs(savingsDelta) >=
        Math.max(100000, previous.cashFlow.netSavingsPlacement * 0.1)
      )
        changes.push({
          id: "savings",
          label: "savings",
          amount: savingsDelta,
          percent: safePercent(
            cashFlow.netSavingsPlacement,
            previous.cashFlow.netSavingsPlacement,
          ),
          direction: direction(savingsDelta),
        });
      const debtDelta =
        cashFlow.debtPrincipalReduced - previous.cashFlow.debtPrincipalReduced;
      if (
        Math.abs(debtDelta) >=
        Math.max(100000, previous.cashFlow.debtPrincipalReduced * 0.1)
      )
        changes.push({
          id: "debt",
          label: "debt",
          amount: debtDelta,
          percent: safePercent(
            cashFlow.debtPrincipalReduced,
            previous.cashFlow.debtPrincipalReduced,
          ),
          direction: direction(debtDelta),
        });
    }
    const state =
      reviewRow?.review_status === "marked_reviewed"
        ? "marked_reviewed"
        : reviewRow?.review_status === "viewed"
          ? "viewed"
          : "not_started";
    const snapshot =
      (reviewRow?.review_snapshot as ReviewSnapshot | null) ?? null;
    const latestActivityAt = rows.reduce<string | null>(
      (latest, row) =>
        !latest || row.created_at > latest ? row.created_at : latest,
      null,
    );
    return {
      periodMonth: selected,
      currentPeriodMonth: current,
      isCurrentPeriod: selected === current,
      isFuturePeriod: false,
      timezone,
      currency,
      assistMode,
      review: {
        state,
        viewedAt: reviewRow?.viewed_at ?? null,
        reviewedAt: reviewRow?.reviewed_at ?? null,
        snapshot,
        updatedAfterReview: Boolean(
          snapshot?.capturedAt &&
          latestActivityAt &&
          latestActivityAt > snapshot.capturedAt,
        ),
        latestActivityAt,
      },
      cashFlow,
      jars,
      goals,
      changes,
      issues,
      recommendations,
      suggestedActions,
    };
  } catch (error) {
    console.error(MONTHLY_REVIEW_QUERY_LOG_CONTEXT, error);
    return null;
  }
}

async function getMonthlyReviewWithoutState(
  householdId: string,
  periodMonth: string,
) {
  const [rows, budgets] = await Promise.all([
    loadTransactions(householdId, periodMonth),
    getJarBudgetsForPeriod(periodMonth),
  ]);
  if (!budgets && rows.length === 0) return null;
  return { cashFlow: summarizeCashFlow(rows) };
}
