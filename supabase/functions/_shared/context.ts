import { formatPercent, formatVnd, percentChange, rollingAverage, toNumber } from "./math.ts";

type QueryResponse<T = Record<string, unknown>> = {
  data: T[] | null;
  error: { message: string } | null;
};

type QueryBuilder<T = Record<string, unknown>> = Promise<QueryResponse<T>> & {
  eq: (column: string, value: unknown) => QueryBuilder<T>;
  gte: (column: string, value: unknown) => QueryBuilder<T>;
  lte: (column: string, value: unknown) => QueryBuilder<T>;
  in: (column: string, values: unknown[]) => QueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<T>;
  limit: (value: number) => QueryBuilder<T>;
};

type SupabaseClientLike = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  from: (table: string) => {
    select: (columns: string) => QueryBuilder;
  };
};

function monthDiff(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`);
  const to = new Date(`${toIso}T00:00:00Z`);
  return (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
}

function monthStartIso(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function shiftMonth(monthStart: string, delta: number): string {
  const base = new Date(`${monthStart}T00:00:00Z`);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + delta, 1)).toISOString().slice(0, 10);
}

function bucketMonth(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export async function buildMonthlyReviewContext(
  client: SupabaseClientLike,
  householdId: string,
  periodEnd: string,
): Promise<Record<string, unknown>> {
  const [coreResult, trendResult, topExpenseResult, goalResult] = await Promise.all([
    client.rpc("rpc_dashboard_core", {
      p_household_id: householdId,
      p_as_of_date: periodEnd,
    }),
    client
      .from("monthly_household_snapshots")
      .select("month, net_worth, income, expense, savings, savings_rate, emergency_months, debt_service_ratio")
      .eq("household_id", householdId)
      .order("month", { ascending: false })
      .limit(2),
    client
      .from("transactions")
      .select("amount, category_id, categories(name, is_essential)")
      .eq("household_id", householdId)
      .eq("type", "expense")
      .gte("transaction_date", monthStartIso(periodEnd))
      .lte("transaction_date", periodEnd),
    client
      .from("goals")
      .select("id, name, target_amount, target_date")
      .eq("household_id", householdId)
      .eq("status", "active"),
  ]);

  if (coreResult.error) throw new Error(`Failed to load dashboard core: ${coreResult.error.message}`);
  if (trendResult.error) throw new Error(`Failed to load monthly snapshots: ${trendResult.error.message}`);
  if (topExpenseResult.error) throw new Error(`Failed to load transactions: ${topExpenseResult.error.message}`);
  if (goalResult.error) throw new Error(`Failed to load goals: ${goalResult.error.message}`);

  const coreRow = ((coreResult.data ?? []) as Array<Record<string, unknown>>)[0] ?? {};
  const snapshots = (trendResult.data ?? []) as Array<Record<string, unknown>>;
  const currentSnapshot = snapshots[0] ?? null;
  const previousSnapshot = snapshots[1] ?? null;

  const expenseByCategory = new Map<string, number>();
  for (const row of (topExpenseResult.data ?? []) as Array<Record<string, unknown>>) {
    const categoryObject = row.categories as { name?: string; is_essential?: boolean } | null;
    if (categoryObject?.is_essential) continue;
    const categoryName = categoryObject?.name ?? "Không phân loại";
    expenseByCategory.set(categoryName, (expenseByCategory.get(categoryName) ?? 0) + toNumber(row.amount));
  }

  const topVariableCategories = [...expenseByCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({
      name,
      amount,
      amount_text: formatVnd(amount),
    }));

  const goals = (goalResult.data ?? []) as Array<Record<string, unknown>>;

  return {
    period_end: periodEnd,
    net_worth: {
      current: toNumber(coreRow.net_worth),
      current_text: formatVnd(toNumber(coreRow.net_worth)),
      previous: previousSnapshot ? toNumber(previousSnapshot.net_worth) : null,
      delta_percent: previousSnapshot ? percentChange(toNumber(coreRow.net_worth), toNumber(previousSnapshot.net_worth)) : null,
    },
    cashflow: {
      income: toNumber(coreRow.monthly_income),
      expense: toNumber(coreRow.monthly_expense),
      savings: toNumber(coreRow.monthly_savings),
      savings_rate: toNumber(coreRow.savings_rate) * 100,
      income_text: formatVnd(toNumber(coreRow.monthly_income)),
      expense_text: formatVnd(toNumber(coreRow.monthly_expense)),
      savings_text: formatVnd(toNumber(coreRow.monthly_savings)),
      savings_rate_text: formatPercent(toNumber(coreRow.savings_rate) * 100, 1),
    },
    household_resilience: {
      emergency_months: toNumber(coreRow.emergency_months),
      debt_service_ratio_pct: toNumber(coreRow.debt_service_ratio) * 100,
    },
    top_variable_expense_categories: topVariableCategories,
    active_goals_count: goals.length,
    has_goal_data: goals.length > 0,
    trend_reference: {
      snapshot_current_month: currentSnapshot?.month ?? null,
      snapshot_previous_month: previousSnapshot?.month ?? null,
    },
  };
}

export async function buildGoalRiskContext(
  client: SupabaseClientLike,
  householdId: string,
  periodEnd: string,
): Promise<{
  triggered: boolean;
  context: Record<string, unknown>;
  offtrackGoals: Array<Record<string, unknown>>;
}> {
  const goalsResult = await client
    .from("goals")
    .select("id, name, target_amount, target_date")
    .eq("household_id", householdId)
    .eq("status", "active");

  if (goalsResult.error) throw new Error(`Failed to load goals: ${goalsResult.error.message}`);

  const goals = (goalsResult.data ?? []) as Array<Record<string, unknown>>;
  const goalIds = goals.map((goal) => String(goal.id));

  const sixMonthsAgo = shiftMonth(monthStartIso(periodEnd), -6);

  const contribResult = goalIds.length
    ? await client
        .from("goal_contributions")
        .select("goal_id, amount, contribution_date, flow_type")
        .eq("household_id", householdId)
        .in("goal_id", goalIds)
        .gte("contribution_date", sixMonthsAgo)
        .lte("contribution_date", periodEnd)
    : { data: [], error: null };

  if (contribResult.error) {
    throw new Error(`Failed to load goal contributions: ${contribResult.error.message}`);
  }

  const grouped = new Map<string, Array<Record<string, unknown>>>();
  for (const row of (contribResult.data ?? []) as Array<Record<string, unknown>>) {
    const goalId = String(row.goal_id);
    const existing = grouped.get(goalId) ?? [];
    existing.push(row);
    grouped.set(goalId, existing);
  }

  const offtrackGoals: Array<Record<string, unknown>> = [];

  for (const goal of goals) {
    const rows = grouped.get(String(goal.id)) ?? [];

    const fundedAmount = rows.reduce((sum, row) => {
      const amount = toNumber(row.amount);
      return sum + (row.flow_type === "outflow" ? -amount : amount);
    }, 0);

    const last3MonthsStart = shiftMonth(monthStartIso(periodEnd), -2);
    const threeMonthContrib = rows
      .filter((row) => String(row.contribution_date) >= last3MonthsStart)
      .reduce((sum, row) => sum + (row.flow_type === "outflow" ? -toNumber(row.amount) : toNumber(row.amount)), 0);

    const avg3m = threeMonthContrib / 3;
    const targetAmount = toNumber(goal.target_amount);
    const remaining = Math.max(0, targetAmount - fundedAmount);

    let monthsLeft: number | null = null;
    let requiredMonthly: number | null = null;
    let isOfftrack = false;

    if (goal.target_date) {
      monthsLeft = Math.max(1, monthDiff(periodEnd, String(goal.target_date)));
      requiredMonthly = remaining / monthsLeft;
      const nearDeadline = monthsLeft <= 6;
      isOfftrack = avg3m < requiredMonthly * 0.9 || (nearDeadline && remaining > 0 && avg3m < requiredMonthly);
    }

    if (isOfftrack) {
      offtrackGoals.push({
        goal_name: goal.name,
        target_date: goal.target_date,
        target_amount: targetAmount,
        funded_amount: fundedAmount,
        remaining_amount: remaining,
        required_monthly: requiredMonthly,
        avg_contribution_3m: avg3m,
        gap_monthly: requiredMonthly ? Math.max(0, requiredMonthly - avg3m) : null,
        required_monthly_text: requiredMonthly !== null ? formatVnd(requiredMonthly) : "N/A",
        avg_contribution_3m_text: formatVnd(avg3m),
        remaining_amount_text: formatVnd(remaining),
      });
    }
  }

  return {
    triggered: offtrackGoals.length > 0,
    offtrackGoals,
    context: {
      period_end: periodEnd,
      trigger_reason: "goal_offtrack_rule",
      active_goals_count: goals.length,
      offtrack_goals_count: offtrackGoals.length,
      offtrack_goals: offtrackGoals.slice(0, 3),
    },
  };
}

export async function buildSpendingAnomalyContext(
  client: SupabaseClientLike,
  householdId: string,
  periodEnd: string,
): Promise<{
  triggered: boolean;
  context: Record<string, unknown>;
}> {
  const currentMonth = monthStartIso(periodEnd);
  const oldestMonth = shiftMonth(currentMonth, -3);

  const txResult = await client
    .from("transactions")
    .select("amount, transaction_date, category_id, categories(name, is_essential)")
    .eq("household_id", householdId)
    .eq("type", "expense")
    .gte("transaction_date", oldestMonth)
    .lte("transaction_date", periodEnd);

  if (txResult.error) throw new Error(`Failed to load expense transactions: ${txResult.error.message}`);

  const monthTotals = new Map<string, number>();
  const currentMonthCategory = new Map<string, number>();

  for (const row of (txResult.data ?? []) as Array<Record<string, unknown>>) {
    const categoryObject = row.categories as { name?: string; is_essential?: boolean } | null;
    if (categoryObject?.is_essential) continue;

    const amount = toNumber(row.amount);
    const monthKey = bucketMonth(String(row.transaction_date));
    monthTotals.set(monthKey, (monthTotals.get(monthKey) ?? 0) + amount);

    if (monthKey === currentMonth) {
      const categoryName = categoryObject?.name ?? "Không phân loại";
      currentMonthCategory.set(categoryName, (currentMonthCategory.get(categoryName) ?? 0) + amount);
    }
  }

  const priorMonths = [shiftMonth(currentMonth, -1), shiftMonth(currentMonth, -2), shiftMonth(currentMonth, -3)];
  const baseline = rollingAverage(priorMonths.map((month) => monthTotals.get(month) ?? 0)) ?? 0;
  const current = monthTotals.get(currentMonth) ?? 0;
  const deltaPct = percentChange(current, baseline);
  const triggered = baseline > 0 && current > baseline * 1.25;

  const topDrivers = [...currentMonthCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({
      name,
      amount,
      amount_text: formatVnd(amount),
    }));

  return {
    triggered,
    context: {
      period_end: periodEnd,
      trigger_reason: "spending_anomaly_rule",
      current_variable_spending: current,
      baseline_variable_spending: baseline,
      current_variable_spending_text: formatVnd(current),
      baseline_variable_spending_text: formatVnd(baseline),
      delta_percent: deltaPct,
      delta_percent_text: formatPercent(deltaPct, 1),
      anomaly_threshold_percent: 25,
      top_variable_categories: topDrivers,
    },
  };
}
