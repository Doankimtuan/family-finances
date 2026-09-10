import {
  JarBudgetState,
  MonthlyReviewStatus,
  PlanAssistMode,
  type JarBudgetState as JarBudgetStateValue,
} from "@/modules/plan/application/plan-constants";
import type { MonthlyReview } from "@/modules/plan/application/queries/get-monthly-review";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";

const JAR_ATTENTION_STATES = new Set<JarBudgetStateValue>([
  JarBudgetState.OVERSPENT,
  JarBudgetState.NEAR_LIMIT,
]);

export const MONTHLY_REVIEW_CASH_FLOW_FACTS = [
  {
    key: "income",
    field: "income",
    kind: FinancialNumberKind.MOVEMENT,
  },
  {
    key: "expenses",
    field: "expenses",
    kind: FinancialNumberKind.MOVEMENT,
  },
  {
    key: "savingsAdded",
    field: "savingsAdded",
    kind: FinancialNumberKind.MOVEMENT,
  },
  {
    key: "netInvested",
    field: "netInvested",
    kind: FinancialNumberKind.MOVEMENT,
  },
  {
    key: "debtReduced",
    field: "debtPrincipalReduced",
    kind: FinancialNumberKind.MOVEMENT,
  },
  {
    key: "netCashFlow",
    field: "netCashFlow",
    kind: FinancialNumberKind.MOVEMENT,
  },
] as const;

export type MonthlyReviewCashFlowFact =
  (typeof MONTHLY_REVIEW_CASH_FLOW_FACTS)[number];

export function isJarAttentionState(state: JarBudgetStateValue) {
  return JAR_ATTENTION_STATES.has(state);
}

export function countJarAttention(jars: MonthlyReview["jars"]) {
  return jars.filter((jar) => isJarAttentionState(jar.state)).length;
}

export function isReviewMarked(state: MonthlyReview["review"]["state"]) {
  return state === MonthlyReviewStatus.MARKED_REVIEWED;
}

export function isAssistedReview(assistMode: MonthlyReview["assistMode"]) {
  return assistMode === PlanAssistMode.ASSISTED;
}

export function isMonthlyReviewEmpty(review: MonthlyReview) {
  return (
    review.cashFlow.activityCount === 0 &&
    review.jars.length === 0 &&
    review.goals.length === 0
  );
}

export function primaryReviewIssue(issues: MonthlyReview["issues"]) {
  return issues[0] ?? null;
}

export function goalBackingCopyKey(
  backing: MonthlyReview["goals"][number]["backing"],
) {
  switch (backing) {
    case "legacy":
      return "legacyProgress";
    case "missing":
      return "missingBacking";
    default:
      return "linkedFunding";
  }
}
