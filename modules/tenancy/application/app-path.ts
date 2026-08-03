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
  INBOX: "/inbox",
  TOGETHER: "/together",
  ONBOARD: "/together/onboard",
  INVITATIONS: "/together/invitations",
  POLICIES: "/together/policies",
  PREFERENCES: "/together/preferences",
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

export function planJarPath(jarId: string): string {
  return `${APP_PATH.PLAN_JARS}/${jarId}`;
}

export function planGoalPath(goalId: string): string {
  return `${APP_PATH.PLAN_GOALS}/${goalId}`;
}

export function planRecurringPath(ruleId: string): string {
  return `${APP_PATH.PLAN_RECURRING}/${ruleId}`;
}
