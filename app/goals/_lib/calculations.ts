import { differenceInCalendarMonths } from "date-fns";
import type { GoalRow, ContributionRow, GoalStats, PaceStatus } from "./types";
import { VALIDATION } from "./constants";

export function monthsUntil(date: string): number {
  const now = new Date();
  const target = new Date(date);
  return Math.max(0, differenceInCalendarMonths(target, now));
}

export function calculateGoalStats(
  goal: GoalRow,
  contributions: ContributionRow[],
  savingsLinkedValue: number,
): GoalStats {
  const funded =
    contributions.reduce(
      (sum, row) =>
        sum +
        (row.flow_type === "outflow"
          ? -Number(row.amount)
          : Number(row.amount)),
      0,
    ) + savingsLinkedValue;
  const target = Number(goal.target_amount);
  const progressValue =
    target > 0
      ? Math.max(0, Math.min(100, Math.round((funded / target) * 100)))
      : 0;
  const remaining = Math.max(0, target - funded);

  const monthlyWindow = goal.target_date
    ? Math.max(1, monthsUntil(goal.target_date))
    : null;
  const requiredMonthly =
    monthlyWindow !== null ? Math.ceil(remaining / monthlyWindow) : null;

  const sixMonthAgo = new Date();
  sixMonthAgo.setMonth(sixMonthAgo.getMonth() - VALIDATION.RECENT_CONTRIBUTION_MONTHS);
  const recentContrib = contributions.filter(
    (row) => new Date(row.contribution_date) >= sixMonthAgo,
  );
  const avgMonthlyContribution =
    recentContrib.length > 0
      ? Math.round(
          recentContrib.reduce(
            (sum, row) =>
              sum +
              (row.flow_type === "outflow"
                ? -Number(row.amount)
                : Number(row.amount)),
            0,
          ) / VALIDATION.RECENT_CONTRIBUTION_MONTHS,
        )
      : 0;

  const etaMonths =
    avgMonthlyContribution > 0 ? Math.ceil(remaining / avgMonthlyContribution) : null;
  const etaDate =
    etaMonths !== null
      ? new Date(
          new Date().getFullYear(),
          new Date().getMonth() + etaMonths,
          1,
        )
      : null;

  const { paceStatus, overageMonths, neededExtraPerMonth } =
    calculatePaceStatus(
      goal.status,
      etaMonths,
      monthlyWindow,
      remaining,
      requiredMonthly,
      avgMonthlyContribution,
    );

  return {
    funded,
    target,
    progressValue,
    remaining,
    monthlyWindow,
    requiredMonthly,
    avgMonthlyContribution,
    etaMonths,
    etaDate,
    paceStatus,
    overageMonths,
    neededExtraPerMonth,
  };
}

function calculatePaceStatus(
  status: string,
  etaMonths: number | null,
  monthlyWindow: number | null,
  remaining: number,
  requiredMonthly: number | null,
  avgMonthlyContribution: number,
): {
  paceStatus: PaceStatus;
  overageMonths: number;
  neededExtraPerMonth: number;
} {
  let paceStatus: PaceStatus = "no_deadline";
  let overageMonths = 0;
  let neededExtraPerMonth = 0;

  if (status === "completed") {
    paceStatus = "completed";
  } else if (monthlyWindow !== null) {
    if (etaMonths !== null) {
      if (etaMonths <= monthlyWindow) {
        paceStatus = "on_track";
      } else {
        paceStatus = "behind";
        overageMonths = etaMonths - monthlyWindow;
        neededExtraPerMonth =
          requiredMonthly !== null
            ? requiredMonthly - avgMonthlyContribution
            : 0;
      }
    } else if (
      remaining > 0 &&
      monthlyWindow < VALIDATION.SHORT_DEADLINE_MONTHS
    ) {
      paceStatus = "behind";
      neededExtraPerMonth = requiredMonthly ?? 0;
    }
  }

  return { paceStatus, overageMonths, neededExtraPerMonth };
}
