import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";

/**
 * Home domain constants — dashboard status lane kinds, test IDs, and formatting.
 */

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
  PLAN_PULSE: "home-plan-pulse",
  INBOX_BLOCK: "home-inbox-block",
  PLAN_LINK: "home-plan-link",
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
