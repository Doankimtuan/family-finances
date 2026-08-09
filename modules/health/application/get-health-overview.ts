import "server-only";

import { getHealthDetail, type HealthDetail } from "./get-health-detail";

export type HealthOverview = Pick<
  HealthDetail,
  | "health"
  | "state"
  | "completeness"
  | "accountCount"
  | "activeJarCount"
  | "openInboxCount"
  | "hasEmiCompletePending"
>;

/**
 * Health overview pulse for Home chip + /health (AC-015).
 */
export async function getHealthOverview(): Promise<HealthOverview | null> {
  const detail = await getHealthDetail();
  if (detail == null) {
    return null;
  }
  return {
    health: detail.health,
    state: detail.state,
    completeness: detail.completeness,
    accountCount: detail.accountCount,
    activeJarCount: detail.activeJarCount,
    openInboxCount: detail.openInboxCount,
    hasEmiCompletePending: detail.hasEmiCompletePending,
  };
}
