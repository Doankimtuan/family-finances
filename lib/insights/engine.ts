export type InsightType =
  | "spending_anomaly"
  | "goal_risk"
  | "debt_alert"
  | "savings_milestone"
  | "net_worth_change";

export type InsightSeverity = "info" | "warning" | "critical";

export type InsightRecord = {
  insightType: InsightType;
  severity: InsightSeverity;
  title: string;
  body: string;
  actionLabel: string | null;
  actionTarget: string | null;
};

export function detectSpendingAnomaly(input: {
  currentExpense: number;
  avgPriorExpense: number;
}) {
  if (input.avgPriorExpense <= 0) return null;

  const ratio = input.currentExpense / input.avgPriorExpense;
  if (ratio < 1.25) return null;

  const deltaPct = Math.round((ratio - 1) * 100);
  const severity: InsightSeverity = ratio >= 1.5 ? "critical" : "warning";

  return {
    insightType: "spending_anomaly" as const,
    severity,
    title: "Spending is above your recent baseline",
    body: `This month expenses are ${deltaPct}% above your previous 3-month average. Review variable categories to protect savings momentum.`,
    actionLabel: "Review Transactions",
    actionTarget: "/transactions",
  };
}

export function detectGoalRisk(input: {
  goals: Array<{
    name: string;
    targetDate: string | null;
    remaining: number;
    requiredMonthly: number | null;
    avgMonthlyContribution: number;
  }>;
}) {
  const risky = input.goals.find((goal) =>
    goal.targetDate && goal.requiredMonthly !== null && goal.avgMonthlyContribution < goal.requiredMonthly,
  );

  if (!risky) return null;

  const gap = Math.max(0, Math.round((risky.requiredMonthly ?? 0) - risky.avgMonthlyContribution));

  return {
    insightType: "goal_risk" as const,
    severity: gap > 5_000_000 ? ("critical" as const) : ("warning" as const),
    title: `Goal at risk: ${risky.name}`,
    body: `At current contributions, this goal is likely to miss timeline. Increase monthly contributions by about ${gap.toLocaleString("en-US")} VND.`,
    actionLabel: "Open Goals",
    actionTarget: "/goals",
  };
}

export function detectDebtAlert(input: {
  debtServiceRatio: number | null;
  nextPaymentIncreaseAmount: number | null;
  hasActiveDebt: boolean;
  monthlyIncome: number;
  monthlyExpense: number;
}) {
  if (input.hasActiveDebt && input.monthlyIncome <= 0 && input.monthlyExpense > 0) {
    return {
      insightType: "debt_alert" as const,
      severity: "critical" as const,
      title: "Debt pressure with no income this month",
      body: "Debt is active but monthly income is zero while expenses continue. Stabilize income or reduce obligations immediately.",
      actionLabel: "Open Debts",
      actionTarget: "/debts",
    };
  }

  if (input.hasActiveDebt && input.debtServiceRatio === null) {
    return {
      insightType: "debt_alert" as const,
      severity: "warning" as const,
      title: "Debt ratio cannot be computed",
      body: "Debt service ratio is unavailable because income for this period is zero. Review debt affordability manually this month.",
      actionLabel: "Open Debts",
      actionTarget: "/debts",
    };
  }

  if ((input.debtServiceRatio ?? 0) <= 0.35 && (input.nextPaymentIncreaseAmount ?? 0) <= 0) return null;

  if ((input.nextPaymentIncreaseAmount ?? 0) > 0) {
    return {
      insightType: "debt_alert" as const,
      severity: input.nextPaymentIncreaseAmount! >= 3_000_000 ? ("critical" as const) : ("warning" as const),
      title: "Upcoming payment pressure from rate change",
      body: `Projected monthly debt payment may increase by about ${input.nextPaymentIncreaseAmount!.toLocaleString("en-US")} VND in the floating-rate phase.`,
      actionLabel: "Open Debts",
      actionTarget: "/debts",
    };
  }

  return {
    insightType: "debt_alert" as const,
    severity: "warning" as const,
    title: "Debt service ratio is elevated",
    body: "Debt payments are consuming a high share of income. Consider prepaying expensive debt before adding new loans.",
    actionLabel: "Open Debts",
    actionTarget: "/debts",
  };
}

export function detectSavingsMilestone(input: {
  emergencyMonths: number | null;
  prevEmergencyMonths: number | null;
}) {
  const current = input.emergencyMonths ?? 0;
  const prev = input.prevEmergencyMonths ?? 0;
  const milestones = [1, 3, 6];
  const reached = milestones.find((m) => prev < m && current >= m);

  if (!reached) return null;

  return {
    insightType: "savings_milestone" as const,
    severity: "info" as const,
    title: `Emergency fund milestone reached: ${reached} month${reached > 1 ? "s" : ""}`,
    body: "Your emergency buffer just crossed a key resilience threshold. Keep this habit consistent.",
    actionLabel: "Open Dashboard",
    actionTarget: "/dashboard",
  };
}

export function detectNetWorthChange(input: {
  currentNetWorth: number;
  prevNetWorth: number | null;
}) {
  if (input.prevNetWorth === null || input.prevNetWorth === 0) return null;

  const delta = input.currentNetWorth - input.prevNetWorth;
  const pct = Math.round((delta / Math.abs(input.prevNetWorth)) * 100);

  if (Math.abs(pct) < 5) return null;

  const positive = delta > 0;

  return {
    insightType: "net_worth_change" as const,
    severity: positive ? ("info" as const) : ("warning" as const),
    title: positive ? "Net worth moved up meaningfully" : "Net worth declined this month",
    body: positive
      ? `Net worth increased by ${pct}% versus last month. Continue current behavior to sustain this trajectory.`
      : `Net worth decreased by ${Math.abs(pct)}% versus last month. Review spending and debt drivers this month.`,
    actionLabel: "Open Dashboard",
    actionTarget: "/dashboard",
  };
}

export function buildInsights(records: Array<InsightRecord | null>) {
  return records.filter((r): r is InsightRecord => r !== null);
}
