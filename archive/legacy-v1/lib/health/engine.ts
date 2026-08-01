export type HealthFactorKey =
  | "cashflow"
  | "emergency"
  | "debt"
  | "networth"
  | "goals"
  | "diversification";

export type HealthWeights = Record<HealthFactorKey, number>;

export type HealthEngineInput = {
  monthlySavings: number;
  savingsRate: number | null;
  emergencyMonths: number | null;
  debtServiceRatio: number | null;
  totalAssets: number;
  totalLiabilities: number;
  netWorthTrend: number[];
  goalsProgressRatio: number | null;
  goalsOnTrackRatio: number | null;
  diversificationHHI: number | null;
};

export type FinancialHealthResult = {
  overallScore: number;
  factorScores: Record<HealthFactorKey, number>;
  weights: HealthWeights;
  topAction: string;
  metrics: Record<string, number | null>;
};

export const DEFAULT_HEALTH_WEIGHTS: HealthWeights = {
  cashflow: 22,
  emergency: 20,
  debt: 20,
  networth: 16,
  goals: 14,
  diversification: 8,
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function scoreCashflow(monthlySavings: number, savingsRate: number | null) {
  if (monthlySavings < 0) return 20;

  const rate = savingsRate ?? 0;
  if (rate >= 0.3) return 95;
  if (rate >= 0.2) return 85;
  if (rate >= 0.1) return 70;
  if (rate >= 0.05) return 55;
  return 40;
}

function scoreEmergency(emergencyMonths: number | null) {
  const months = emergencyMonths ?? 0;
  return clamp((months / 6) * 100);
}

function scoreDebt(
  debtServiceRatio: number | null,
  totalAssets: number,
  totalLiabilities: number,
) {
  const dsr = debtServiceRatio ?? 1;
  const leverage = totalAssets > 0 ? totalLiabilities / totalAssets : 1;

  const dsrScore =
    dsr <= 0.15
      ? 100
      : dsr <= 0.25
        ? 80
        : dsr <= 0.35
          ? 60
          : dsr <= 0.45
            ? 40
            : 20;
  const leverageScore =
    leverage <= 0.3 ? 100 : leverage <= 0.6 ? 75 : leverage <= 1 ? 50 : 25;

  return Math.round(dsrScore * 0.7 + leverageScore * 0.3);
}

function scoreNetWorth(netWorthTrend: number[]) {
  if (netWorthTrend.length < 2) return 55;

  const first = netWorthTrend[0] ?? 0;
  const last = netWorthTrend[netWorthTrend.length - 1] ?? first;
  const delta = last - first;

  if (first <= 0) {
    if (delta > 0) return 70;
    return 45;
  }

  const growth = delta / first;
  if (growth >= 0.15) return 95;
  if (growth >= 0.08) return 85;
  if (growth >= 0.03) return 70;
  if (growth >= 0) return 60;
  return 40;
}

function scoreGoals(progressRatio: number | null, onTrackRatio: number | null) {
  if (progressRatio === null && onTrackRatio === null) {
    return 60;
  }

  const progressScore = clamp((progressRatio ?? 0) * 100);
  const onTrackScore = clamp((onTrackRatio ?? 0) * 100);
  return Math.round(progressScore * 0.65 + onTrackScore * 0.35);
}

function scoreDiversification(diversificationHHI: number | null) {
  if (diversificationHHI === null) return 60;

  // HHI: lower is better; invert relative to 1.0 worst concentration.
  const score = (1 - diversificationHHI) * 100;
  return clamp(score);
}

/** Returns an i18n key from the dictionary (health.action.*) */
function pickTopAction(
  input: HealthEngineInput,
  factors: Record<HealthFactorKey, number>,
): string {
  if (input.monthlySavings < 0) {
    return "health.action.negative_cashflow";
  }
  if ((input.emergencyMonths ?? 0) < 3) {
    return "health.action.low_emergency";
  }
  if ((input.debtServiceRatio ?? 0) > 0.35) {
    return "health.action.high_dsr";
  }

  const weakest = (Object.keys(factors) as HealthFactorKey[]).reduce(
    (minKey, key) => (factors[key] < factors[minKey] ? key : minKey),
    "cashflow" as HealthFactorKey,
  );

  if (weakest === "goals") return "health.action.goals_offtrack";
  if (weakest === "diversification") return "health.action.concentrated";
  if (weakest === "networth") return "health.action.slow_networth";

  return "health.action.stable";
}

export function computeFinancialHealth(
  input: HealthEngineInput,
): FinancialHealthResult {
  const factorScores: Record<HealthFactorKey, number> = {
    cashflow: scoreCashflow(input.monthlySavings, input.savingsRate),
    emergency: scoreEmergency(input.emergencyMonths),
    debt: scoreDebt(
      input.debtServiceRatio,
      input.totalAssets,
      input.totalLiabilities,
    ),
    networth: scoreNetWorth(input.netWorthTrend),
    goals: scoreGoals(input.goalsProgressRatio, input.goalsOnTrackRatio),
    diversification: scoreDiversification(input.diversificationHHI),
  };

  const weights = DEFAULT_HEALTH_WEIGHTS;
  const weightedSum = (Object.keys(weights) as HealthFactorKey[]).reduce(
    (sum, key) => sum + factorScores[key] * weights[key],
    0,
  );

  const overallScore = Number((weightedSum / 100).toFixed(2));
  const topAction = pickTopAction(input, factorScores);

  return {
    overallScore,
    factorScores,
    weights,
    topAction,
    metrics: {
      savings_rate: input.savingsRate,
      emergency_months: input.emergencyMonths,
      debt_service_ratio: input.debtServiceRatio,
      goals_progress_ratio: input.goalsProgressRatio,
      goals_on_track_ratio: input.goalsOnTrackRatio,
      diversification_hhi: input.diversificationHHI,
    },
  };
}
