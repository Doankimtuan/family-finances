import {
  APP_PATH,
  planGoalPath,
  planJarPath,
} from "@/modules/tenancy/application/app-path";
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

const UPCOMING_DUE_SOURCES = new Set<string>([
  CalendarEventSource.CARD_DUE,
  CalendarEventSource.LIABILITY,
]);

const HEALTH_DOT_CLASS: Record<PlanHomeHealthStatusValue, string> = {
  [PlanHomeHealthStatus.HEALTHY]: "bg-success",
  [PlanHomeHealthStatus.ATTENTION]: "bg-warning",
  [PlanHomeHealthStatus.OFF_TRACK]: "bg-danger",
  [PlanHomeHealthStatus.NO_PLAN]: "bg-white/40",
};

export function planHealthDotClass(health: PlanHomeHealthStatusValue): string {
  return HEALTH_DOT_CLASS[health];
}

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
