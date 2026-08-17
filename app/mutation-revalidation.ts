import { revalidatePath } from "next/cache";
import {
  APP_ROUTE,
  type AppRoutePattern,
} from "@/modules/tenancy/application/app-path";

function revalidateRoutes(routes: readonly AppRoutePattern[]) {
  for (const route of routes) {
    revalidatePath(route, "page");
  }
}

const TRANSACTION_ROUTES = [
  APP_ROUTE.HOME,
  APP_ROUTE.MONEY,
  APP_ROUTE.MONEY_ACCOUNTS,
  APP_ROUTE.MONEY_ACCOUNT_DETAIL,
  APP_ROUTE.MONEY_TRANSACTIONS,
  APP_ROUTE.MONEY_TRANSACTION_DETAIL,
  APP_ROUTE.PLAN,
  APP_ROUTE.INBOX,
] as const;

const SAVINGS_ROUTES = [
  APP_ROUTE.HOME,
  APP_ROUTE.MONEY,
  APP_ROUTE.MONEY_ACCOUNTS,
  APP_ROUTE.MONEY_ACCOUNT_DETAIL,
  APP_ROUTE.MONEY_TRANSACTIONS,
  APP_ROUTE.MONEY_SAVINGS,
  APP_ROUTE.MONEY_SAVINGS_DETAIL,
] as const;

const INBOX_ROUTES = [APP_ROUTE.HOME, APP_ROUTE.INBOX] as const;

const INVESTMENT_ROUTES = [
  APP_ROUTE.HOME,
  APP_ROUTE.MONEY,
  APP_ROUTE.MONEY_ACCOUNTS,
  APP_ROUTE.MONEY_ACCOUNT_DETAIL,
  APP_ROUTE.MONEY_TRANSACTIONS,
  APP_ROUTE.MONEY_TRANSACTION_DETAIL,
  APP_ROUTE.MONEY_INVESTMENTS,
  APP_ROUTE.MONEY_INVESTMENT_DETAIL,
  APP_ROUTE.PLAN,
  APP_ROUTE.PLAN_GOALS,
  APP_ROUTE.PLAN_GOAL_DETAIL,
] as const;

const JAR_ROUTES = [
  APP_ROUTE.HOME,
  APP_ROUTE.PLAN,
  APP_ROUTE.PLAN_JARS,
  APP_ROUTE.PLAN_JAR_DETAIL,
  APP_ROUTE.INBOX,
] as const;

/** Transaction changes affect the money position, review context, and plan allocations. */
export function revalidateTransactionViews() {
  revalidateRoutes(TRANSACTION_ROUTES);
}

/** Tag changes only affect transaction browsing and transaction detail presentation. */
export function revalidateTransactionTagViews() {
  revalidateRoutes([
    APP_ROUTE.MONEY_TRANSACTIONS,
    APP_ROUTE.MONEY_TRANSACTION_TAGS,
    APP_ROUTE.MONEY_TRANSACTION_DETAIL,
  ]);
}

/** Savings changes affect savings, cash position, and dashboard summaries. */
export function revalidateSavingsViews() {
  revalidateRoutes(SAVINGS_ROUTES);
}

/** Savings review decisions also remove or update the Inbox item and badge. */
export function revalidateSavingsInboxViews() {
  revalidateRoutes([...SAVINGS_ROUTES, APP_ROUTE.INBOX]);
}

/** Goal changes are scoped to planning surfaces. */
export function revalidateGoalViews() {
  revalidateRoutes([
    APP_ROUTE.PLAN,
    APP_ROUTE.PLAN_GOALS,
    APP_ROUTE.PLAN_GOAL_DETAIL,
  ]);
}

/** Inbox decisions affect the queue, navigation badge, and dashboard attention lane. */
export function revalidateInboxViews() {
  revalidateRoutes(INBOX_ROUTES);
}

/** Resolving an Inbox item to a jar also changes planning allocation views. */
export function revalidateInboxAndPlanViews() {
  revalidateRoutes([...INBOX_ROUTES, APP_ROUTE.PLAN, APP_ROUTE.PLAN_JARS]);
}

/** Investment operations change holdings, cash, transactions, and planning views. */
export function revalidateInvestmentViews() {
  revalidateRoutes(INVESTMENT_ROUTES);
}

/** Jar mutations change allocation, planning, and related Inbox views. */
export function revalidateJarViews() {
  revalidateRoutes(JAR_ROUTES);
}

/** Monthly review metadata is scoped to the Plan review surface. */
export function revalidateMonthlyReviewViews() {
  revalidateRoutes([APP_ROUTE.PLAN, APP_ROUTE.PLAN_RITUAL]);
}
