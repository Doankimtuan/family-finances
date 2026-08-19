import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";

/** Home domain constants — dashboard periods, chart behavior, test IDs, and formatting. */
export const HomeDashboardPeriod = {
  MONTH: "month",
  QUARTER: "quarter",
} as const;
export type HomeDashboardPeriod =
  (typeof HomeDashboardPeriod)[keyof typeof HomeDashboardPeriod];

export const HOME_DASHBOARD_PERIOD_VALUES = [
  HomeDashboardPeriod.MONTH,
  HomeDashboardPeriod.QUARTER,
] as const;
export const HOME_DASHBOARD_DEFAULT_PERIOD = HomeDashboardPeriod.MONTH;
export const HOME_DASHBOARD_MAX_CATEGORY_COUNT = 4;

export const HomeFinancialPulseState = {
  UNAVAILABLE: "unavailable",
  POSITIVE: "positive",
  ATTENTION: "attention",
} as const;
export type HomeFinancialPulseState =
  (typeof HomeFinancialPulseState)[keyof typeof HomeFinancialPulseState];

export const HomeCashFlowGranularity = {
  DAY: "day",
  WEEK: "week",
} as const;
export type HomeCashFlowGranularity =
  (typeof HomeCashFlowGranularity)[keyof typeof HomeCashFlowGranularity];

/** Month stays daily; quarter compresses to seven-day periods for readable charts. */
export const HOME_CASH_FLOW_GRANULARITY_BY_PERIOD: Record<
  HomeDashboardPeriod,
  HomeCashFlowGranularity
> = {
  [HomeDashboardPeriod.MONTH]: HomeCashFlowGranularity.DAY,
  [HomeDashboardPeriod.QUARTER]: HomeCashFlowGranularity.WEEK,
};
export const HOME_CASH_FLOW_WEEK_LENGTH_DAYS = 7;
export const HOME_CASH_FLOW_CHART_HEIGHT = 144;
export const HOME_CASH_FLOW_CHART_MARGIN = {
  TOP: 12,
  RIGHT: 4,
  LEFT: 4,
  BOTTOM: 2,
} as const;
export const HOME_CASH_FLOW_CHART_STROKE_WIDTH = 1.5;
export const HOME_CASH_FLOW_CHART_ACTIVE_DOT_RADIUS = 3;
export const HOME_CASH_FLOW_CHART_HEADROOM_RATIO = 0.12;
export const HOME_CASH_FLOW_EXPENSE_DASH_PATTERN = "5 4";
export const HOME_CASH_FLOW_CHART_AREA_OPACITY = {
  INCOME: 0.12,
  EXPENSE: 0.08,
} as const;
export const HOME_PERCENT_SCALE = 100;
export const HomeStatusLaneKind = {
  OFFLINE: "offline",
  STALE: "stale",
  PARTIAL: "partial",
  PERMISSION: "permission",
  ERROR: "error",
} as const;
export type HomeStatusLaneKind =
  (typeof HomeStatusLaneKind)[keyof typeof HomeStatusLaneKind];
export const HOME_STATUS_LANE_KIND_VALUES = [
  HomeStatusLaneKind.OFFLINE,
  HomeStatusLaneKind.STALE,
  HomeStatusLaneKind.PARTIAL,
  HomeStatusLaneKind.PERMISSION,
  HomeStatusLaneKind.ERROR,
] as const;
export const HOME_STATUS_LANE_VARIANT: Record<
  Exclude<HomeStatusLaneKind, typeof HomeStatusLaneKind.OFFLINE>,
  "info" | "warning" | "danger"
> = {
  [HomeStatusLaneKind.STALE]: "info",
  [HomeStatusLaneKind.PARTIAL]: "info",
  [HomeStatusLaneKind.PERMISSION]: "warning",
  [HomeStatusLaneKind.ERROR]: "danger",
} as const;

export const HOME_TRANSLATION_NAMESPACE = "home" as const;
export const HOME_TEST_ID = {
  DASHBOARD: "home-dashboard",
  LOADING: "home-loading",
  REAL_POSITION: "home-real-position",
  FINANCIAL_PULSE: "home-financial-pulse",
  PERIOD_CONTROL: "home-period-control",
  PERIOD_MONTH: "home-period-month",
  PERIOD_QUARTER: "home-period-quarter",
  CASH_FLOW: "home-cash-flow",
  PERIOD_LOADING: "home-period-loading",
  PERIOD_CONTENT: "home-period-content",
  CASH_FLOW_CHART: "home-cash-flow-chart",
  CASH_FLOW_DATA_TABLE: "home-cash-flow-data-table",
  CASH_FLOW_TOOLTIP: "home-cash-flow-tooltip",
  SPENDING: "home-spending",
  PLAN_PULSE: "home-plan-pulse",
  INBOX_BLOCK: "home-inbox-block",
  PLAN_LINK: "home-plan-link",
  PERIOD_STORY: "home-period-story",
  CAPTURE_ACTION: "home-capture",
  ACCOUNT_ACTION: "home-add-account",
  FINANCIAL_PRIVACY_TOGGLE: "home-financial-privacy-toggle",
  DAY_ZERO: "home-day-zero",
  DAY_ZERO_ACCOUNT: "home-day-zero-account",
  DAY_ZERO_PLAN: "home-day-zero-plan",
  DAY_ZERO_INVITE: "home-day-zero-invite",
  INBOX_CONTENT: "home-inbox",
  INBOX_CTA: "home-inbox-cta",
  STATUS_OFFLINE: "home-status-offline",
  STATUS_PREFIX: "home-status",
} as const;

/** Fraction digits used when displaying large home balances without cents. */
export const HOME_CURRENCY_FRACTION_DIGITS = 0;
export const HOME_GREETING_PERIOD = {
  MORNING: "morning",
  AFTERNOON: "afternoon",
  EVENING: "evening",
} as const;
export type HomeGreetingPeriod =
  (typeof HOME_GREETING_PERIOD)[keyof typeof HOME_GREETING_PERIOD];

/** Deterministic greeting period using the household's canonical local timezone. */
export function homeGreetingPeriod(date = new Date()): HomeGreetingPeriod {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
    }).format(date),
  );
  if (hour < 12) return HOME_GREETING_PERIOD.MORNING;
  if (hour < 18) return HOME_GREETING_PERIOD.AFTERNOON;
  return HOME_GREETING_PERIOD.EVENING;
}
