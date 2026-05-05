import type { AppLanguage } from "@/lib/i18n/config";

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

type Localization = {
  language?: AppLanguage;
  locale?: string;
};

function isVietnamese(language?: AppLanguage) {
  return language === "vi";
}

export function detectSpendingAnomaly(input: {
  currentExpense: number;
  avgPriorExpense: number;
} & Localization) {
  const vi = isVietnamese(input.language);
  if (input.avgPriorExpense <= 0) return null;

  const ratio = input.currentExpense / input.avgPriorExpense;
  if (ratio < 1.25) return null;

  const deltaPct = Math.round((ratio - 1) * 100);
  const severity: InsightSeverity = ratio >= 1.5 ? "critical" : "warning";

  return {
    insightType: "spending_anomaly" as const,
    severity,
    title: vi ? "Chi tiêu đang cao hơn mức nền gần đây" : "Spending is above your recent baseline",
    body: vi
      ? `Chi tiêu tháng này cao hơn ${deltaPct}% so với trung bình 3 tháng trước. Hãy rà soát nhóm chi biến đổi để bảo toàn đà tiết kiệm.`
      : `This month expenses are ${deltaPct}% above your previous 3-month average. Review variable categories to protect savings momentum.`,
    actionLabel: vi ? "Xem Giao dịch" : "Review Transactions",
    actionTarget: "/activity",
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
} & Localization) {
  const vi = isVietnamese(input.language);
  const locale = input.locale ?? "en-US";
  const risky = input.goals.find((goal) =>
    goal.targetDate && goal.requiredMonthly !== null && goal.avgMonthlyContribution < goal.requiredMonthly,
  );

  if (!risky) return null;

  const gap = Math.max(0, Math.round((risky.requiredMonthly ?? 0) - risky.avgMonthlyContribution));

  return {
    insightType: "goal_risk" as const,
    severity: gap > 5_000_000 ? ("critical" as const) : ("warning" as const),
    title: vi ? `Mục tiêu có rủi ro: ${risky.name}` : `Goal at risk: ${risky.name}`,
    body: vi
      ? `Theo mức đóng góp hiện tại, mục tiêu này có khả năng trễ hạn. Cần tăng đóng góp hàng tháng khoảng ${gap.toLocaleString(locale)} VND.`
      : `At current contributions, this goal is likely to miss timeline. Increase monthly contributions by about ${gap.toLocaleString(locale)} VND.`,
    actionLabel: vi ? "Mở Mục tiêu" : "Open Goals",
    actionTarget: "/goals",
  };
}

export function detectDebtAlert(input: {
  debtServiceRatio: number | null;
  nextPaymentIncreaseAmount: number | null;
  hasActiveDebt: boolean;
  monthlyIncome: number;
  monthlyExpense: number;
} & Localization) {
  const vi = isVietnamese(input.language);
  const locale = input.locale ?? "en-US";
  if (input.hasActiveDebt && input.monthlyIncome <= 0 && input.monthlyExpense > 0) {
    return {
      insightType: "debt_alert" as const,
      severity: "critical" as const,
      title: vi ? "Áp lực nợ khi tháng này không có thu nhập" : "Debt pressure with no income this month",
      body: vi
        ? "Vẫn có khoản nợ đang hoạt động nhưng thu nhập tháng này bằng 0 trong khi chi tiêu vẫn tiếp diễn. Cần ổn định thu nhập hoặc giảm nghĩa vụ ngay."
        : "Debt is active but monthly income is zero while expenses continue. Stabilize income or reduce obligations immediately.",
      actionLabel: vi ? "Mở Nợ" : "Open Debts",
      actionTarget: "/debts",
    };
  }

  if (input.hasActiveDebt && input.debtServiceRatio === null) {
    return {
      insightType: "debt_alert" as const,
      severity: "warning" as const,
      title: vi ? "Không thể tính tỷ lệ nợ" : "Debt ratio cannot be computed",
      body: vi
        ? "Không thể tính tỷ lệ trả nợ vì thu nhập giai đoạn này bằng 0. Hãy tự rà soát khả năng chi trả nợ trong tháng này."
        : "Debt service ratio is unavailable because income for this period is zero. Review debt affordability manually this month.",
      actionLabel: vi ? "Mở Nợ" : "Open Debts",
      actionTarget: "/debts",
    };
  }

  if ((input.debtServiceRatio ?? 0) <= 0.35 && (input.nextPaymentIncreaseAmount ?? 0) <= 0) return null;

  if ((input.nextPaymentIncreaseAmount ?? 0) > 0) {
    return {
      insightType: "debt_alert" as const,
      severity: input.nextPaymentIncreaseAmount! >= 3_000_000 ? ("critical" as const) : ("warning" as const),
      title: vi ? "Áp lực thanh toán sắp tới do đổi lãi suất" : "Upcoming payment pressure from rate change",
      body: vi
        ? `Khoản trả nợ hàng tháng dự kiến có thể tăng khoảng ${input.nextPaymentIncreaseAmount!.toLocaleString(locale)} VND ở giai đoạn lãi suất thả nổi.`
        : `Projected monthly debt payment may increase by about ${input.nextPaymentIncreaseAmount!.toLocaleString(locale)} VND in the floating-rate phase.`,
      actionLabel: vi ? "Mở Nợ" : "Open Debts",
      actionTarget: "/debts",
    };
  }

  return {
    insightType: "debt_alert" as const,
    severity: "warning" as const,
    title: vi ? "Tỷ lệ trả nợ đang cao" : "Debt service ratio is elevated",
    body: vi
      ? "Chi trả nợ đang chiếm tỷ trọng cao trong thu nhập. Hãy cân nhắc trả trước khoản nợ chi phí cao trước khi vay thêm."
      : "Debt payments are consuming a high share of income. Consider prepaying expensive debt before adding new loans.",
    actionLabel: vi ? "Mở Nợ" : "Open Debts",
    actionTarget: "/debts",
  };
}

export function detectSavingsMilestone(input: {
  emergencyMonths: number | null;
  prevEmergencyMonths: number | null;
} & Localization) {
  const vi = isVietnamese(input.language);
  const current = input.emergencyMonths ?? 0;
  const prev = input.prevEmergencyMonths ?? 0;
  const milestones = [1, 3, 6];
  const reached = milestones.find((m) => prev < m && current >= m);

  if (!reached) return null;

  return {
    insightType: "savings_milestone" as const,
    severity: "info" as const,
    title: vi
      ? `Đã đạt mốc quỹ khẩn cấp: ${reached} tháng`
      : `Emergency fund milestone reached: ${reached} month${reached > 1 ? "s" : ""}`,
    body: vi
      ? "Quỹ khẩn cấp của bạn vừa vượt qua một ngưỡng chống chịu quan trọng. Hãy duy trì thói quen này đều đặn."
      : "Your emergency buffer just crossed a key resilience threshold. Keep this habit consistent.",
    actionLabel: vi ? "Mở Bảng điều khiển" : "Open Dashboard",
    actionTarget: "/dashboard",
  };
}

export function detectNetWorthChange(input: {
  currentNetWorth: number;
  prevNetWorth: number | null;
} & Localization) {
  const vi = isVietnamese(input.language);
  if (input.prevNetWorth === null || input.prevNetWorth === 0) return null;

  const delta = input.currentNetWorth - input.prevNetWorth;
  const pct = Math.round((delta / Math.abs(input.prevNetWorth)) * 100);

  if (Math.abs(pct) < 5) return null;

  const positive = delta > 0;

  return {
    insightType: "net_worth_change" as const,
    severity: positive ? ("info" as const) : ("warning" as const),
    title: positive
      ? (vi ? "Tài sản ròng tăng đáng kể" : "Net worth moved up meaningfully")
      : (vi ? "Tài sản ròng giảm trong tháng này" : "Net worth declined this month"),
    body: positive
      ? (vi
        ? `Tài sản ròng tăng ${pct}% so với tháng trước. Hãy tiếp tục hành vi hiện tại để duy trì quỹ đạo này.`
        : `Net worth increased by ${pct}% versus last month. Continue current behavior to sustain this trajectory.`)
      : (vi
        ? `Tài sản ròng giảm ${Math.abs(pct)}% so với tháng trước. Hãy rà soát chi tiêu và các yếu tố nợ trong tháng này.`
        : `Net worth decreased by ${Math.abs(pct)}% versus last month. Review spending and debt drivers this month.`),
    actionLabel: vi ? "Mở Bảng điều khiển" : "Open Dashboard",
    actionTarget: "/dashboard",
  };
}

export function buildInsights(records: Array<InsightRecord | null>) {
  return records.filter((r): r is InsightRecord => r !== null);
}
