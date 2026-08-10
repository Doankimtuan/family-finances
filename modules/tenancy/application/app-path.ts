/**
 * Locale-relative in-app paths for next-intl Link / redirect / router.
 */

export const APP_PATH = {
  HOME: "/home",
  WELCOME: "/welcome",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  MONEY: "/money",
  MONEY_ACCOUNTS: "/money/accounts",
  MONEY_ADD: "/money/transactions/new",
  MONEY_TRANSACTIONS: "/money/transactions",
  PLAN: "/plan",
  PLAN_JARS: "/plan/jars",
  PLAN_GOALS: "/plan/goals",
  PLAN_RECURRING: "/plan/recurring",
  PLAN_RITUAL: "/plan/ritual",
  PLAN_CALENDAR: "/plan/calendar",
  INBOX: "/inbox",
  HEALTH: "/health",
  HEALTH_INSIGHTS: "/health/insights",
  MONEY_DEBTS: "/money/debts",
  MONEY_SAVINGS: "/money/savings",
  MONEY_SAVINGS_NEW: "/money/savings/new",
  MONEY_INVESTMENTS: "/money/investments",
  MONEY_INVESTMENTS_NEW: "/money/investments/new",
  MONEY_INVESTMENTS_CONVERT: "/money/investments/convert",
  MONEY_LOANS: "/money/loans",
  /** @deprecated Use MONEY_LOANS — old Cards/EMI route. */
  MONEY_CARDS: "/money/loans",
  TOGETHER: "/together",
  TOGETHER_MEMBERS: "/together/members",
  ONBOARD: "/together/onboard",
  INVITATIONS: "/together/invitations",
  INVITATIONS_NEW: "/together/invitations/new",
  POLICIES: "/together/policies",
  PREFERENCES: "/together/preferences",
  SETTINGS: "/together/settings",
  SETTINGS_ACCOUNT: "/together/settings/account",
  ERROR: "/error",
  OFFLINE: "/offline",
  PERMISSION: "/permission",
  MAINTENANCE: "/maintenance",
} as const;

export type AppPath = (typeof APP_PATH)[keyof typeof APP_PATH];

/**
 * Canonical route-path namespace per Coding Standards naming-policy.
 * Alias, not a duplicate — `APP_PATH` remains the single source of truth.
 */
export const RoutePath = APP_PATH;

export const INVITE_PATH_SEGMENT = "invite";

/** Locale-relative invite deep link. */
export function invitePath(token: string): string {
  return `/${INVITE_PATH_SEGMENT}/${token}`;
}

export function moneyAccountPath(accountId: string): string {
  return `${APP_PATH.MONEY_ACCOUNTS}/${accountId}`;
}

export function moneyTransactionPath(transactionId: string): string {
  return `${APP_PATH.MONEY_TRANSACTIONS}/${transactionId}`;
}

export function moneyTransactionEditPath(transactionId: string): string {
  return `${moneyTransactionPath(transactionId)}/edit`;
}

export function moneyTransactionRefundPath(transactionId: string): string {
  return `${moneyTransactionPath(transactionId)}/refund`;
}

export function moneyTransactionCorrectPath(transactionId: string): string {
  return `${moneyTransactionPath(transactionId)}/correct`;
}

export function planJarPath(jarId: string): string {
  return `${APP_PATH.PLAN_JARS}/${jarId}`;
}

export function planGoalPath(goalId: string): string {
  return `${APP_PATH.PLAN_GOALS}/${goalId}`;
}

export function planRecurringPath(ruleId: string): string {
  return `${APP_PATH.PLAN_RECURRING}/${ruleId}`;
}

export function inboxItemPath(inboxItemId: string): string {
  return `${APP_PATH.INBOX}/${inboxItemId}`;
}

export function moneyDebtPath(debtId: string): string {
  return `${APP_PATH.MONEY_DEBTS}/${debtId}`;
}

export function moneySavingsPath(savingsId: string): string {
  return `${APP_PATH.MONEY_SAVINGS}/${savingsId}`;
}

export function moneySavingsNewPath(): string {
  return APP_PATH.MONEY_SAVINGS_NEW;
}

export function moneySavingsEarlyWithdrawPath(savingsId: string): string {
  return `${moneySavingsPath(savingsId)}/early-withdraw`;
}

export function moneyInvestmentPath(holdingId: string): string {
  return `${APP_PATH.MONEY_INVESTMENTS}/${holdingId}`;
}

export function moneyInvestmentBuyPath(holdingId: string): string {
  return `${moneyInvestmentPath(holdingId)}/buy`;
}

export function moneyInvestmentSellPath(holdingId: string): string {
  return `${moneyInvestmentPath(holdingId)}/sell`;
}

export function moneyInvestmentIncomePath(holdingId: string): string {
  return `${moneyInvestmentPath(holdingId)}/income`;
}

export function moneyInvestmentValuationPath(holdingId: string): string {
  return `${moneyInvestmentPath(holdingId)}/valuation`;
}

export function moneyLoanPath(loanId: string): string {
  return `${APP_PATH.MONEY_LOANS}/${loanId}`;
}

/** @deprecated Use moneyLoanPath. */
export function moneyCardPath(planId: string): string {
  return moneyLoanPath(planId);
}
