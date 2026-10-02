import {
  APP_PATH,
  planGoalPath,
  planJarPath,
} from "@/modules/tenancy/application/app-path";
import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";
import {
  AllocationHealthStatus,
  CalendarEventSource,
  type AllocationHealth,
  type AllocationHealthStatus as AllocationHealthStatusValue,
} from "@/modules/plan/application/client";
import {
  PlanHomeExceptionKind,
  PlanHomeHealthStatus,
  type PlanHomeException,
  type PlanHomeHealthStatus as PlanHomeHealthStatusValue,
} from "@/modules/plan/application/plan-home-health";

/** Active jars shown on the Plan hub before the existing view-all escape. */
export const PLAN_HUB_VISIBLE_JAR_LIMIT = 6;

/** Active goals shown on the Plan hub before the existing view-all escape. */
export const PLAN_HUB_VISIBLE_GOAL_LIMIT = 3;

/** Existing recommendation engine cap used by the hub (one primary + supporting). */
export const PLAN_HUB_RECOMMENDATION_LIMIT = 3;

export const RecommendationListVariant = {
  HIGHLIGHTED: "highlighted",
  SUPPORTING: "supporting",
} as const;

export type RecommendationListVariant =
  (typeof RecommendationListVariant)[keyof typeof RecommendationListVariant];

const UPCOMING_DUE_SOURCES = new Set<string>([
  CalendarEventSource.CARD_DUE,
  CalendarEventSource.LIABILITY,
]);

export function resolvePlanHealthCopy(
  health: PlanHomeHealthStatusValue,
  t: (key: string, values?: Record<string, string | number>) => string,
  attentionIssue: string,
  overspentCount: number,
): { title: string; body: string } {
  switch (health) {
    case PlanHomeHealthStatus.HEALTHY:
      return {
        title: t("home.healthHealthy"),
        body: t("home.healthHealthyBody"),
      };
    case PlanHomeHealthStatus.ATTENTION:
      return {
        title: t("home.healthAttention"),
        body: t("home.healthAttentionBody", { issue: attentionIssue }),
      };
    case PlanHomeHealthStatus.OFF_TRACK:
      return {
        title: t("home.healthOffTrack"),
        body: t("home.healthOffTrackBody", { count: overspentCount }),
      };
    default:
      return {
        title: t("home.healthNoPlan"),
        body: t("home.healthNoPlanBody"),
      };
  }
}

export function exceptionHref(exception: PlanHomeException): string {
  if (exception.jarId) return planJarPath(exception.jarId);
  if (exception.goalId) return planGoalPath(exception.goalId);
  if (exception.kind === PlanHomeExceptionKind.UNCATEGORIZED) {
    return APP_PATH.INBOX;
  }
  return APP_PATH.PLAN_JARS;
}

export function isUpcomingDueEvent(source: string | undefined): boolean {
  return source != null && UPCOMING_DUE_SOURCES.has(source);
}

export function getPlanMonthProgress(
  periodMonth: string,
  locale: string,
  now = new Date(),
) {
  const [year, month] = periodMonth.slice(0, 7).split("-").map(Number);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const todayParts = new Intl.DateTimeFormat(locale, {
    timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const getPart = (type: "year" | "month" | "day") =>
    Number(todayParts.find((part) => part.type === type)?.value);
  const [todayYear, todayMonth, day] = [
    getPart("year"),
    getPart("month"),
    getPart("day"),
  ];
  if (todayYear !== year || todayMonth !== month) return null;

  const days = new Date(year, month, 0).getDate();
  return { day, days, percent: Math.round((day / days) * 100) };
}

export function allocationFactValue(
  allocationHealth: AllocationHealth,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (allocationHealth.status === AllocationHealthStatus.NO_INCOME) {
    return t("allocationHealthNoIncome");
  }
  return t("home.factAllocationValue", {
    percent: allocationHealth.utilizationPercent,
  });
}

export function allocationFactTone(
  status: AllocationHealthStatusValue,
): "secondary" | "danger" {
  return status === AllocationHealthStatus.OVER_ALLOCATED
    ? "danger"
    : "secondary";
}
